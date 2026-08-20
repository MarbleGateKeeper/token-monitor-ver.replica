'use strict';

// Local session metadata enrichment. Tokscale remains the only usage source;
// this module joins its (client, sessionId) rows to project metadata already
// stored by each tool. Resolver results contain only opaque ids and labels;
// projectPathFromJsonl remains exported solely as a compatibility helper for
// existing local callers.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { claudeSessionRoots } = require('./claudePaths');
const { indexDshSessionHeaders, readDshSessionHeader, resolveDshSessionsRoot } = require('./dshSessionFiles');
const { findSessionFiles, codexSessionFile } = require('./sessionFiles');
const { discoverDbPaths: discoverOpenCodeDbPaths } = require('./opencodeLimits');
const { discoverHermesProfileScanPaths, resolveHermesHome } = require('./hermesProfiles');
const { hashKey } = require('./hashKey');

let sqlite = null;
try { sqlite = require('node:sqlite'); } catch (_) { sqlite = null; }

const JSON_METADATA_PREFIX_BYTES = 64 * 1024;
const LEGACY_PROJECT_PREFIX_BYTES = 256 * 1024;
const SQLITE_BATCH_SIZE = 200;
const MAX_CHANGED_PATHS_PER_CLIENT = 256;
const SUPPORTED_PROJECT_CLIENTS = new Set([
  'claude', 'codex', 'opencode', 'grok', 'kimi', 'pi', 'codebuddy',
  'workbuddy', 'qwen', 'zcode', 'hermes'
]);

// DSH session ids do not contain timestamps, so their transcript paths must be
// discovered separately. Keep this cache process-wide: collectUsageOnce can
// construct a fresh metadata resolver on each call, while a known DSH session's
// file path remains stable across ticks. The resolved root is part of every key
// so native and WSL homes carrying the same session id cannot collide.
const dshSessionFileCache = new Map();

// ---------------------------------------------------------------------------
// Identity and conflict handling
// ---------------------------------------------------------------------------

function isoFromDate(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const milliseconds = Math.abs(value) < 1e11 ? value * 1000 : value;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString();
  }
  if (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value.trim())) {
    return isoFromDate(Number(value));
  }
  const date = value instanceof Date ? value : new Date(value || '');
  return Number.isNaN(date.getTime()) ? '' : date.toISOString();
}

function timestampFromSessionId(id) {
  const raw = String(id || '');
  const isoMatch = raw.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/);
  if (isoMatch) return isoFromDate(isoMatch[0]);
  const localMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2})[:-](\d{2})(?:[:-](\d{2}))?/);
  if (!localMatch) return '';
  const [, year, month, day, hour, minute, second = '0'] = localMatch;
  return isoFromDate(new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)));
}

function timestampFromJsonLine(line) {
  try {
    const obj = JSON.parse(line);
    return isoFromDate(obj.timestamp || obj.updatedAt || obj.updated_at || obj.createdAt || obj.created_at);
  } catch (_) {
    return '';
  }
}

function normalizeProjectPath(value) {
  let normalized = String(value || '').trim().replace(/\\/g, '/');
  if (!normalized) return '';
  const windows = /^[a-z]:\//i.test(normalized) || normalized.startsWith('//');
  const root = normalized === '/' || /^[a-z]:\/$/i.test(normalized);
  if (!root) normalized = normalized.replace(/\/+$/, '');
  return windows ? normalized.toLowerCase() : normalized;
}

function projectIdentity(value) {
  const normalized = normalizeProjectPath(value);
  if (!normalized) return {};
  const root = normalized === '/' || /^[a-z]:\/$/i.test(normalized);
  let displayPath = String(value || '').trim().replace(/\\/g, '/');
  if (!root) displayPath = displayPath.replace(/\/+$/, '');
  const label = root ? (normalized === '/' ? '/' : `${normalized[0].toUpperCase()}:\\`) : displayPath.split('/').pop();
  return { projectId: hashKey('project', normalized), projectLabel: label };
}

function opaqueProjectIdentity(namespace, key, label) {
  const cleanNamespace = String(namespace || '').trim().toLowerCase();
  const cleanKey = String(key || '').trim().normalize('NFC');
  const cleanLabel = String(label || '').trim().normalize('NFC');
  if (!cleanNamespace || !cleanKey || !cleanLabel) return {};
  return {
    projectId: hashKey('project', `opaque:${cleanNamespace}:${cleanKey}`),
    projectLabel: cleanLabel
  };
}

function identityFromReference(reference) {
  if (!reference || reference.conflict) return {};
  if (reference.projectId) {
    return { projectId: String(reference.projectId), projectLabel: String(reference.projectLabel || '') };
  }
  if (reference.projectPath) return projectIdentity(reference.projectPath);
  if (reference.opaqueKey) return opaqueProjectIdentity(reference.namespace, reference.opaqueKey, reference.projectLabel);
  return {};
}

function mergeMetadata(target, source) {
  if (!source || typeof source !== 'object') return target;
  const next = { ...(target || {}) };
  if (source.startedAt && (!next.startedAt || Date.parse(source.startedAt) < Date.parse(next.startedAt))) next.startedAt = source.startedAt;
  if (source.lastUsedAt && (!next.lastUsedAt || Date.parse(source.lastUsedAt) > Date.parse(next.lastUsedAt))) next.lastUsedAt = source.lastUsedAt;
  if (source.projectConflict) {
    delete next.projectId;
    delete next.projectLabel;
    next.projectConflict = true;
  } else if (source.projectId && !next.projectId && !next.projectConflict) {
    next.projectId = source.projectId;
    next.projectLabel = source.projectLabel || '';
  } else if (source.projectId && next.projectId && next.projectId !== source.projectId) {
    delete next.projectId;
    delete next.projectLabel;
    next.projectConflict = true;
  }
  return next;
}

function mergeReferences(references) {
  let selected = null;
  for (const reference of references || []) {
    const identity = identityFromReference(reference);
    if (!identity.projectId) continue;
    if (!selected) {
      selected = { ...reference, identity };
      continue;
    }
    if (selected.identity.projectId !== identity.projectId) return { conflict: true };
    if (String(identity.projectLabel).localeCompare(String(selected.identity.projectLabel)) < 0) {
      selected = { ...reference, identity };
    }
  }
  if (!selected) return null;
  const { identity: _identity, ...reference } = selected;
  return reference;
}

// ---------------------------------------------------------------------------
// Bounded local-file readers
// ---------------------------------------------------------------------------

function fileSignature(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() ? `${stat.size}:${stat.mtimeMs}` : '';
  } catch (_) {
    return '';
  }
}

function databaseSignature(dbPath) {
  return [dbPath, `${dbPath}-wal`, `${dbPath}-shm`].map((filePath) => {
    try {
      const stat = fs.statSync(filePath);
      return `${stat.size}:${stat.mtimeMs}`;
    } catch (_) {
      return '-';
    }
  }).join('|');
}

function readFileChunk(filePath, bytes, fromEnd = false) {
  let fd;
  try {
    fd = fs.openSync(filePath, 'r');
    const stat = fs.fstatSync(fd);
    const length = Math.min(bytes, stat.size);
    const buffer = Buffer.alloc(length);
    fs.readSync(fd, buffer, 0, length, fromEnd ? Math.max(0, stat.size - length) : 0);
    return buffer.toString('utf8');
  } catch (_) {
    return '';
  } finally {
    if (fd !== undefined) {
      try { fs.closeSync(fd); } catch (_) {}
    }
  }
}

function pathWithin(filePath, root) {
  const relative = path.relative(path.resolve(root), path.resolve(filePath));
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function addBoundedMetadataPath(pathsByClient, reconcileClients, client, filePath, limit = MAX_CHANGED_PATHS_PER_CLIENT) {
  if (!client || !filePath || reconcileClients.has(client)) return;
  if (!pathsByClient.has(client)) pathsByClient.set(client, new Set());
  const paths = pathsByClient.get(client);
  const resolved = path.resolve(filePath);
  if (paths.size >= limit && !paths.has(resolved)) {
    pathsByClient.delete(client);
    reconcileClients.add(client);
    return;
  }
  paths.add(resolved);
}

function walkFiles(root, accepts) {
  const files = [];
  const queue = [root];
  while (queue.length > 0) {
    const dir = queue.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { continue; }
    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);
      if (entry.isDirectory()) queue.push(filePath);
      else if (entry.isFile() && accepts(filePath)) files.push(filePath);
    }
  }
  return files.sort((a, b) => a.localeCompare(b));
}

function jsonObjectsFromPrefix(filePath) {
  const text = readFileChunk(filePath, JSON_METADATA_PREFIX_BYTES);
  if (!text) return [];
  const objects = [];
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const value = JSON.parse(line);
      if (value && typeof value === 'object') objects.push(value);
    } catch (_) { /* partial final line or non-JSON log prefix */ }
  }
  if (objects.length === 0) {
    try {
      const value = JSON.parse(text);
      if (value && typeof value === 'object') objects.push(value);
    } catch (_) {}
  }
  return objects;
}

function payloadCandidates(value) {
  if (!value || typeof value !== 'object') return [];
  const candidates = [value];
  for (const key of ['payload', 'data', 'session']) {
    if (value[key] && typeof value[key] === 'object' && !Array.isArray(value[key])) candidates.push(value[key]);
  }
  return candidates;
}

function firstText(values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function projectPathFromObject(value) {
  for (const candidate of payloadCandidates(value)) {
    const projectPath = firstText([
      candidate.cwd,
      candidate.project_path,
      candidate.projectPath,
      candidate.workingDirectory,
      candidate.working_directory,
      candidate.directory
    ]);
    if (projectPath) return projectPath;
  }
  return '';
}

function legacyProjectPathFromObject(value) {
  if (!value || typeof value !== 'object') return '';
  const payload = value.payload && typeof value.payload === 'object' ? value.payload : value;
  return firstText([
    payload.cwd,
    payload.project_path,
    payload.projectPath,
    payload.workingDirectory,
    payload.working_directory
  ]);
}

function explicitSessionId(value, allowTypedId = false) {
  for (const candidate of payloadCandidates(value)) {
    const sessionId = firstText([candidate.sessionId, candidate.session_id]);
    if (sessionId) return sessionId;
    if (allowTypedId && String(candidate.type || '').toLowerCase() === 'session') {
      const id = firstText([candidate.id]);
      if (id) return id;
    }
  }
  return '';
}

function referencesFromJsonFile(client, root, filePath) {
  const objects = jsonObjectsFromPrefix(filePath);
  const fallbackId = path.basename(filePath).replace(/\.(?:jsonl|json)$/i, '');
  const bySession = new Map();
  const seenSessionIds = [];
  const add = (sessionId, reference) => {
    const id = String(sessionId || '').trim();
    const identity = identityFromReference(reference);
    if (!id || !identity.projectId) return;
    if (!bySession.has(id)) bySession.set(id, []);
    bySession.get(id).push(identity);
  };

  for (const object of objects) {
    const projectPath = projectPathFromObject(object);
    let sessionId = explicitSessionId(object, client === 'pi');
    if (!sessionId && ['codebuddy', 'workbuddy', 'qwen', 'zcode'].includes(client)) sessionId = fallbackId;
    if (sessionId && !seenSessionIds.includes(sessionId)) seenSessionIds.push(sessionId);
    if (projectPath) add(sessionId, { projectPath });
  }

  if (client === 'qwen' || client === 'zcode') {
    const relative = path.relative(root, filePath).split(path.sep).filter(Boolean);
    const projectDir = relative[0] || '';
    const sessionId = seenSessionIds[0] || [...bySession.keys()][0] || fallbackId;
    if (projectDir && sessionId && !bySession.has(sessionId)) {
      add(sessionId, { namespace: client, opaqueKey: projectDir, projectLabel: projectDir });
    }
  }

  return [...bySession.entries()].map(([sessionId, references]) => ({
    sessionId,
    reference: mergeReferences(references)
  })).filter((entry) => entry.reference);
}

function cleanProjectLabel(value) {
  return String(value || '').trim().normalize('NFC');
}

function kimiWorkspaceReference(name) {
  const match = String(name || '').match(/^wd_(.+)_([0-9a-f]{12})$/i);
  if (!match) return null;
  return {
    namespace: 'kimi',
    opaqueKey: match[2].toLowerCase(),
    projectLabel: cleanProjectLabel(match[1])
  };
}

function decodeGrokWorkspace(name) {
  try {
    const decoded = decodeURIComponent(String(name || ''));
    return normalizeProjectPath(decoded) ? decoded : '';
  } catch (_) {
    return '';
  }
}

function nonBlankEnvPath(env, name, fallback) {
  const value = String(env?.[name] || '').trim();
  return value || fallback;
}

function rootsForFileClient(client, home) {
  if (client === 'pi') {
    return [path.join(home, '.pi', 'agent', 'sessions'), path.join(home, '.omp', 'agent', 'sessions')];
  }
  if (client === 'codebuddy') return [path.join(home, '.codebuddy', 'projects')];
  if (client === 'workbuddy') return [path.join(home, '.workbuddy', 'projects')];
  if (client === 'qwen') return [path.join(home, '.qwen', 'projects')];
  if (client === 'zcode') return [path.join(home, '.zcode', 'projects')];
  return [];
}

// ---------------------------------------------------------------------------
// Per-collector indexes and client adapters
// ---------------------------------------------------------------------------

function acceptsMetadataFile(filePath) {
  return /\.(?:jsonl|json)$/i.test(filePath);
}

function createFileIndexState() {
  return { initialized: false, files: new Map(), bySession: new Map() };
}

function removeFileContributions(state, filePath) {
  const previous = state.files.get(filePath);
  if (!previous) return;
  state.files.delete(filePath);
  for (const entry of previous.records) {
    const sources = state.bySession.get(entry.sessionId);
    if (!sources) continue;
    sources.delete(filePath);
    if (sources.size === 0) state.bySession.delete(entry.sessionId);
  }
}

function addFileContributions(state, filePath, signature, records) {
  removeFileContributions(state, filePath);
  state.files.set(filePath, { signature, records });
  for (const entry of records) {
    if (!state.bySession.has(entry.sessionId)) state.bySession.set(entry.sessionId, new Map());
    state.bySession.get(entry.sessionId).set(filePath, entry.reference);
  }
}

function createSessionMetadataResolver(baseDeps = {}) {
  const projectPathCache = new Map();
  const jsonlTimestampCache = new Map();
  const fileIndexes = new Map();
  const pathIndexes = new Map();
  const databaseCaches = new Map();

  function readProjectPath(filePath) {
    const signature = fileSignature(filePath);
    if (!signature) return '';
    const cached = projectPathCache.get(filePath);
    if (cached?.signature === signature) return cached.value;
    const text = readFileChunk(filePath, LEGACY_PROJECT_PREFIX_BYTES);
    let value = '';
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim()) continue;
      try {
        value = legacyProjectPathFromObject(JSON.parse(line));
        if (value) break;
      } catch (_) {}
    }
    projectPathCache.set(filePath, { signature, value });
    return value;
  }

  function lastJsonlTimestamp(filePath) {
    const signature = fileSignature(filePath);
    if (!signature) return '';
    const cached = jsonlTimestampCache.get(filePath);
    if (cached?.signature === signature) return cached.value;
    const tail = readFileChunk(filePath, 64 * 1024, true);
    const lines = tail.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    let value = '';
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      value = timestampFromJsonLine(lines[index]);
      if (value) break;
    }
    if (!value) {
      try { value = fs.statSync(filePath).mtime.toISOString(); } catch (_) {}
    }
    jsonlTimestampCache.set(filePath, { signature, value });
    return value;
  }

  function fileIndex(client, home) {
    const key = `${client}\0${path.resolve(home)}`;
    if (!fileIndexes.has(key)) fileIndexes.set(key, createFileIndexState());
    return fileIndexes.get(key);
  }

  function updateMetadataFile(state, client, root, filePath) {
    const signature = fileSignature(filePath);
    if (!signature || !acceptsMetadataFile(filePath)) {
      removeFileContributions(state, filePath);
      return;
    }
    const cached = state.files.get(filePath);
    if (cached?.signature === signature) return;
    addFileContributions(state, filePath, signature, referencesFromJsonFile(client, root, filePath));
  }

  function reconcileFileIndex(client, home, state) {
    const seen = new Set();
    for (const root of rootsForFileClient(client, home)) {
      for (const filePath of walkFiles(root, acceptsMetadataFile)) {
        seen.add(filePath);
        updateMetadataFile(state, client, root, filePath);
      }
    }
    for (const filePath of [...state.files.keys()]) {
      if (!seen.has(filePath)) removeFileContributions(state, filePath);
    }
    state.initialized = true;
  }

  function applyChangedFiles(client, home, state, changedPaths) {
    const roots = rootsForFileClient(client, home);
    let needsReconcile = false;
    for (const changedPath of changedPaths || []) {
      const root = roots.find((candidate) => pathWithin(changedPath, candidate));
      if (!root) continue;
      let stat = null;
      try { stat = fs.statSync(changedPath); } catch (_) {}
      if (stat?.isDirectory() || (!stat && !acceptsMetadataFile(changedPath))) {
        needsReconcile = true;
        continue;
      }
      updateMetadataFile(state, client, root, changedPath);
    }
    if (needsReconcile) reconcileFileIndex(client, home, state);
  }

  function resolveFileClient(client, ids, home, options) {
    const state = fileIndex(client, home);
    const shouldReconcile = !state.initialized || options.reconcile;
    if (shouldReconcile) reconcileFileIndex(client, home, state);
    else applyChangedFiles(client, home, state, options.changedPaths);
    const out = new Map();
    for (const id of ids) {
      const sources = state.bySession.get(id);
      if (!sources) continue;
      const reference = mergeReferences(sources.values());
      const identity = identityFromReference(reference);
      if (identity.projectId) out.set(id, identity);
      else if (reference?.conflict) out.set(id, { projectConflict: true });
    }
    return out;
  }

  function pathIndex(client, home) {
    const key = `${client}\0${path.resolve(home)}`;
    if (!pathIndexes.has(key)) pathIndexes.set(key, { initialized: false, entries: new Map() });
    return pathIndexes.get(key);
  }

  function pathLayoutRoot(client, home, env, scopedHome) {
    if (client === 'grok') {
      const grokHome = scopedHome ? path.join(home, '.grok') : nonBlankEnvPath(env, 'GROK_HOME', path.join(home, '.grok'));
      return path.join(grokHome, 'sessions');
    }
    if (client === 'kimi') {
      const kimiHome = scopedHome ? path.join(home, '.kimi-code') : nonBlankEnvPath(env, 'KIMI_CODE_HOME', path.join(home, '.kimi-code'));
      return path.join(kimiHome, 'sessions');
    }
    return '';
  }

  function referenceForLayout(client, workspaceName) {
    if (client === 'grok') {
      const projectPath = decodeGrokWorkspace(workspaceName);
      return projectPath ? { projectPath } : null;
    }
    if (client === 'kimi') return kimiWorkspaceReference(workspaceName);
    return null;
  }

  function addLayoutSession(state, client, workspaceName, sessionName) {
    const reference = referenceForLayout(client, workspaceName);
    const identity = identityFromReference(reference);
    if (!identity.projectId) return;
    const rawId = client === 'kimi' ? String(sessionName).replace(/^session_/, '') : String(sessionName);
    if (!rawId) return;
    state.entries.set(rawId, identity);
    if (client === 'kimi') state.entries.set(String(sessionName), identity);
  }

  function reconcilePathIndex(client, home, state, env, scopedHome) {
    state.entries.clear();
    const root = pathLayoutRoot(client, home, env, scopedHome);
    let workspaces;
    try { workspaces = fs.readdirSync(root, { withFileTypes: true }); } catch (_) { workspaces = []; }
    for (const workspace of workspaces) {
      if (!workspace.isDirectory() || !referenceForLayout(client, workspace.name)) continue;
      const workspacePath = path.join(root, workspace.name);
      let sessions;
      try { sessions = fs.readdirSync(workspacePath, { withFileTypes: true }); } catch (_) { continue; }
      for (const session of sessions) {
        if (session.isDirectory()) addLayoutSession(state, client, workspace.name, session.name);
      }
    }
    state.initialized = true;
  }

  function applyChangedLayouts(client, home, state, env, scopedHome, changedPaths) {
    const root = pathLayoutRoot(client, home, env, scopedHome);
    let needsReconcile = false;
    for (const changedPath of changedPaths || []) {
      if (!pathWithin(changedPath, root)) continue;
      const parts = path.relative(root, changedPath).split(path.sep).filter(Boolean);
      if (parts.length < 2) {
        needsReconcile = true;
        continue;
      }
      const [workspaceName, sessionName] = parts;
      const sessionDir = path.join(root, workspaceName, sessionName);
      try {
        if (fs.statSync(sessionDir).isDirectory()) addLayoutSession(state, client, workspaceName, sessionName);
        else needsReconcile = true;
      } catch (_) {
        const rawId = client === 'kimi' ? sessionName.replace(/^session_/, '') : sessionName;
        state.entries.delete(rawId);
        state.entries.delete(sessionName);
      }
    }
    if (needsReconcile) reconcilePathIndex(client, home, state, env, scopedHome);
  }

  function resolvePathClient(client, ids, home, options) {
    const state = pathIndex(client, home);
    if (!state.initialized || options.reconcile) reconcilePathIndex(client, home, state, options.env, options.scopedHome);
    else applyChangedLayouts(client, home, state, options.env, options.scopedHome, options.changedPaths);
    const out = new Map();
    for (const id of ids) {
      const identity = identityFromReference(state.entries.get(id));
      if (identity.projectId) out.set(id, identity);
    }
    return out;
  }

  function sqliteModule(deps) {
    return deps.sqlite !== undefined ? deps.sqlite : (baseDeps.sqlite !== undefined ? baseDeps.sqlite : sqlite);
  }

  // SQLite adapters share discovery, schema probing, 200-id batching and a
  // db/WAL/SHM signature cache. Client-specific code is only the descriptor.

  function sqlitePaths(client, home, options) {
    const env = options.env || process.env;
    if (client === 'opencode') {
      const useExplicitHome = options.scopedHome || path.resolve(home) !== path.resolve(os.homedir());
      const scopedEnv = useExplicitHome
        ? { ...env, OPENCODE_DB: '', XDG_DATA_HOME: path.join(home, '.local', 'share'), HOME: home, USERPROFILE: home }
        : env;
      return discoverOpenCodeDbPaths(scopedEnv);
    }
    if (client === 'zcode') return [path.join(home, '.zcode', 'cli', 'db', 'db.sqlite')];
    if (client === 'workbuddy') return [path.join(home, '.workbuddy', 'workbuddy.db')];
    if (client === 'hermes') {
      const hermesHome = resolveHermesHome({ env, homeDir: home, platform: options.platform, existsSync: fs.existsSync });
      return [hermesHome, ...discoverHermesProfileScanPaths(hermesHome)].map((dir) => path.join(dir, 'state.db'));
    }
    return [];
  }

  function sqliteDescriptor(client) {
    if (client === 'opencode') return { table: 'session', id: 'id', projects: ['directory'], started: ['time_created'], updated: ['time_updated'] };
    if (client === 'zcode') return { table: 'session', id: 'id', projects: ['directory', 'path'] };
    if (client === 'workbuddy') return { table: 'sessions', id: 'id', projects: ['cwd'] };
    if (client === 'hermes') return { table: 'sessions', id: 'id', projects: ['git_repo_root', 'cwd'] };
    return null;
  }

  function databaseCache(client, dbPath, signature) {
    const key = `${client}\0${dbPath}`;
    let cache = databaseCaches.get(key);
    if (!cache || cache.signature !== signature) {
      cache = { signature, metadata: new Map(), misses: new Set() };
      databaseCaches.set(key, cache);
    }
    return cache;
  }

  function queryDatabase(client, dbPath, ids, deps) {
    const sqliteMod = sqliteModule(deps);
    const descriptor = sqliteDescriptor(client);
    const signature = databaseSignature(dbPath);
    if (!sqliteMod || !descriptor || signature.startsWith('-')) return { success: false, metadata: new Map() };
    const cache = databaseCache(client, dbPath, signature);
    const pending = [...ids].filter((id) => !cache.metadata.has(id) && !cache.misses.has(id));
    if (pending.length === 0) return { success: true, metadata: cache.metadata };

    let db;
    try {
      db = new sqliteMod.DatabaseSync(dbPath, { readOnly: true });
      db.exec('PRAGMA busy_timeout = 250');
      const columns = new Set(db.prepare(`PRAGMA table_info(${descriptor.table})`).all().map((column) => String(column.name)));
      if (!columns.has(descriptor.id)) {
        for (const id of pending) cache.misses.add(id);
        return { success: true, metadata: cache.metadata };
      }
      const selected = [descriptor.id, ...descriptor.projects, ...(descriptor.started || []), ...(descriptor.updated || [])]
        .filter((column, index, values) => columns.has(column) && values.indexOf(column) === index);
      if (!selected.some((column) => descriptor.projects.includes(column))) {
        for (const id of pending) cache.misses.add(id);
        return { success: true, metadata: cache.metadata };
      }
      for (let offset = 0; offset < pending.length; offset += SQLITE_BATCH_SIZE) {
        const batch = pending.slice(offset, offset + SQLITE_BATCH_SIZE);
        const placeholders = batch.map(() => '?').join(',');
        const sql = `SELECT ${selected.join(',')} FROM ${descriptor.table} WHERE ${descriptor.id} IN (${placeholders})`;
        for (const row of db.prepare(sql).all(...batch)) {
          const id = String(row[descriptor.id] || '');
          if (!id) continue;
          const projectPath = firstText(descriptor.projects.map((column) => row[column]));
          const startedAt = firstText((descriptor.started || []).map((column) => isoFromDate(row[column])));
          const lastUsedAt = firstText((descriptor.updated || []).map((column) => isoFromDate(row[column]))) || startedAt;
          const identity = projectIdentity(projectPath);
          if (identity.projectId || startedAt || lastUsedAt) cache.metadata.set(id, { ...identity, startedAt, lastUsedAt });
        }
      }
      for (const id of pending) {
        if (!cache.metadata.has(id)) cache.misses.add(id);
      }
      return { success: true, metadata: cache.metadata };
    } catch (_) {
      return { success: false, metadata: cache.metadata };
    } finally {
      if (db) { try { db.close(); } catch (_) {} }
    }
  }

  function resolveSqliteClient(client, ids, home, options, deps) {
    if (client === 'opencode' && typeof deps.readOpencodeMeta === 'function') {
      const raw = deps.readOpencodeMeta(ids);
      const out = new Map();
      for (const [id, meta] of raw) {
        const identity = projectIdentity(meta.projectPath);
        const startedAt = meta.startedAt || '';
        const lastUsedAt = meta.lastUsedAt || startedAt;
        if (identity.projectId || startedAt || lastUsedAt) out.set(String(id), { ...identity, startedAt, lastUsedAt });
      }
      return out;
    }
    if (options.scopedHome) return new Map();
    const candidates = new Map();
    for (const dbPath of sqlitePaths(client, home, options)) {
      const result = queryDatabase(client, dbPath, ids, deps);
      if (!result.success && result.metadata.size === 0) continue;
      for (const id of ids) {
        const meta = result.metadata.get(id);
        if (!meta) continue;
        if (!candidates.has(id)) candidates.set(id, []);
        candidates.get(id).push(meta);
      }
    }
    const out = new Map();
    for (const [id, entries] of candidates) {
      let merged = null;
      for (const entry of entries) merged = mergeMetadata(merged, entry);
      if (merged?.projectConflict) {
        delete merged.projectId;
        delete merged.projectLabel;
      }
      if (merged && Object.keys(merged).length > 0) out.set(id, merged);
    }
    return out;
  }

  function applyClaudeAndCodex(byClient, home, metadata, resolved, resolveProjects, deps) {
    const applyFile = (client, sessionId, filePath) => {
      const startedAt = timestampFromSessionId(sessionId);
      const lastUsedAt = lastJsonlTimestamp(filePath) || startedAt;
      const identity = resolveProjects ? projectIdentity(readProjectPath(filePath)) : {};
      const key = `${client}:${sessionId}`;
      metadata.set(key, { startedAt, lastUsedAt, ...identity });
      if (identity.projectId) resolved.add(key);
    };

    const claudeRoots = claudeSessionRoots({
      homeDir: home,
      env: deps.env || baseDeps.env,
      useEnvRoots: !deps.scopedHome
    });
    const claudeIds = byClient.get('claude') || new Set();
    const claudeFiles = findSessionFiles(claudeRoots.projects, claudeIds);
    for (const [sessionId, filePath] of claudeFiles) applyFile('claude', sessionId, filePath);
    const missingClaudeIds = new Set([...claudeIds].filter((sessionId) => !claudeFiles.has(sessionId)));
    const transcriptFiles = findSessionFiles(claudeRoots.transcripts, missingClaudeIds);
    for (const [sessionId, filePath] of transcriptFiles) applyFile('claude', sessionId, filePath);

    const codexIds = byClient.get('codex') || new Set();
    const missingCodexIds = new Set();
    for (const sessionId of codexIds) {
      const filePath = codexSessionFile(home, sessionId);
      if (filePath) applyFile('codex', sessionId, filePath);
      else missingCodexIds.add(sessionId);
    }
    const codexFiles = findSessionFiles(path.join(home, '.codex', 'sessions'), missingCodexIds);
    for (const [sessionId, filePath] of codexFiles) applyFile('codex', sessionId, filePath);
  }

  function applyDshSessions(byClient, home, metadata, deps) {
    const ids = byClient.get('dsh') || new Set();
    if (ids.size === 0) return;

    const fileCache = deps.dshSessionFileCache || baseDeps.dshSessionFileCache || dshSessionFileCache;
    const env = deps.scopedHome ? {} : (deps.env || baseDeps.env || process.env);
    const platform = deps.platform || baseDeps.platform;
    const sessionsRoot = resolveDshSessionsRoot({ homeDir: home, env, platform });
    const cacheKey = (sessionId) => `${sessionsRoot}\u0000${sessionId}`;
    const unresolved = [...ids].filter((sessionId) => !fileCache.has(cacheKey(sessionId)));

    if (unresolved.length > 0) {
      const buildIndex = deps.indexDshSessionHeaders || baseDeps.indexDshSessionHeaders || indexDshSessionHeaders;
      const index = buildIndex({ homeDir: home, env, platform });
      for (const [sessionId, entry] of index) {
        const key = cacheKey(sessionId);
        if (fileCache.has(key)) continue;
        let statFingerprint = '';
        try {
          const stat = fs.statSync(entry.filePath);
          statFingerprint = `${stat.size}:${stat.mtimeMs}`;
        } catch (_) { /* file vanished during discovery */ }
        fileCache.set(key, { ...entry, statFingerprint });
      }
    }

    for (const sessionId of ids) {
      const key = cacheKey(sessionId);
      let entry = fileCache.get(key);
      if (!entry) continue;
      let lastUsedAt = '';
      let statFingerprint = '';
      try {
        const stat = fs.statSync(entry.filePath);
        lastUsedAt = isoFromDate(stat.mtime);
        statFingerprint = `${stat.size}:${stat.mtimeMs}`;
      } catch (_) { /* file vanished after discovery */ }

      // A torn initial write can leave only the directory-name fallback. Once
      // the file changes, retry the bounded header read to recover createdAt.
      if (entry.createdAt === undefined && statFingerprint && statFingerprint !== entry.statFingerprint) {
        const readHeader = deps.readDshSessionHeader || baseDeps.readDshSessionHeader || readDshSessionHeader;
        const refreshed = readHeader(entry.filePath);
        if (refreshed) entry = { filePath: entry.filePath, createdAt: refreshed.createdAt, statFingerprint };
        else entry = { ...entry, statFingerprint };
        fileCache.set(key, entry);
      }

      const startedAt = isoFromDate(Number(entry.createdAt));
      if (!startedAt && !lastUsedAt) continue;
      metadata.set(`dsh:${sessionId}`, {
        startedAt: startedAt || lastUsedAt,
        lastUsedAt: lastUsedAt || startedAt
      });
    }
  }

  function resolve(periods, home = os.homedir(), deps = {}) {
    const refs = new Map();
    for (const period of Object.values(periods || {})) {
      for (const session of Object.values(period?.sessions || {})) {
        if (!session?.client || !session?.sessionId) continue;
        refs.set(`${session.client}:${session.sessionId}`, { client: session.client, sessionId: session.sessionId });
      }
    }

    const metadata = deps.metadataCache || new Map();
    const resolved = deps.resolvedSessionKeys || new Set();
    const attempted = deps.attemptedSessionKeys || new Set();
    const resolveProjects = deps.resolveProjects !== false;
    const byClient = new Map();
    for (const ref of refs.values()) {
      const key = `${ref.client}:${ref.sessionId}`;
      if (resolved.has(key)) continue;
      if (!deps.retryMisses && attempted.has(key)) continue;
      if (!byClient.has(ref.client)) byClient.set(ref.client, new Set());
      byClient.get(ref.client).add(ref.sessionId);
    }

    applyClaudeAndCodex(byClient, home, metadata, resolved, resolveProjects, deps);
    applyDshSessions(byClient, home, metadata, deps);

    const changedPathsByClient = deps.changedPathsByClient || {};
    const reconciledClients = deps.reconciledClients || new Set();
    const processedChangedClients = deps.processedChangedClients || new Set();
    const forceReconcile = new Set(deps.reconcileMetadataClients || []);
    const env = deps.env || process.env;
    const platform = deps.platform || process.platform;

    for (const [client, ids] of byClient) {
      if (client === 'claude' || client === 'codex') continue;
      const canResolveProject = resolveProjects && SUPPORTED_PROJECT_CLIENTS.has(client);
      if (!canResolveProject && client !== 'opencode') continue;
      const reconcile = !reconciledClients.has(client)
        && (deps.reconcileMetadata === true || forceReconcile.has(client));
      const changedPaths = processedChangedClients.has(client) ? [] : (changedPathsByClient[client] || []);
      const options = { reconcile, changedPaths, env, platform, scopedHome: deps.scopedHome === true };
      let clientMetadata = new Map();

      if (client === 'grok' || client === 'kimi') {
        clientMetadata = resolvePathClient(client, ids, home, options);
      } else if (client === 'workbuddy') {
        clientMetadata = resolveFileClient(client, ids, home, options);
        const missing = new Set([...ids].filter((id) => !clientMetadata.has(id)));
        if (missing.size > 0) {
          for (const [id, meta] of resolveSqliteClient(client, missing, home, options, deps)) {
            clientMetadata.set(id, meta);
          }
        }
      } else if (client === 'zcode') {
        clientMetadata = resolveSqliteClient(client, ids, home, options, deps);
        const missing = new Set([...ids].filter((id) => !clientMetadata.has(id)));
        if (missing.size > 0) {
          for (const [id, meta] of resolveFileClient(client, missing, home, options)) {
            clientMetadata.set(id, meta);
          }
        }
      } else if (['pi', 'codebuddy', 'qwen'].includes(client)) {
        clientMetadata = resolveFileClient(client, ids, home, options);
      } else if (client === 'opencode' || client === 'hermes') {
        clientMetadata = resolveSqliteClient(client, ids, home, options, deps);
      }

      if (!canResolveProject) {
        clientMetadata = new Map([...clientMetadata].map(([id, meta]) => [id, {
          ...(meta.startedAt ? { startedAt: meta.startedAt } : {}),
          ...(meta.lastUsedAt ? { lastUsedAt: meta.lastUsedAt } : {})
        }]));
      }

      reconciledClients.add(client);
      processedChangedClients.add(client);
      for (const [sessionId, meta] of clientMetadata) {
        const key = `${client}:${sessionId}`;
        metadata.set(key, mergeMetadata(metadata.get(key), meta));
        if (meta.projectId || meta.projectConflict) resolved.add(key);
      }
    }

    for (const ref of refs.values()) {
      const key = `${ref.client}:${ref.sessionId}`;
      if (resolved.has(key) || metadata.has(key)) continue;
      const timestamp = timestampFromSessionId(ref.sessionId);
      if (timestamp) metadata.set(key, { startedAt: timestamp, lastUsedAt: timestamp });
      if (!SUPPORTED_PROJECT_CLIENTS.has(ref.client) && ref.client !== 'dsh') resolved.add(key);
    }
    for (const ref of refs.values()) attempted.add(`${ref.client}:${ref.sessionId}`);
    return metadata;
  }

  return { resolve, projectPathFromJsonl: readProjectPath };
}

const defaultResolver = createSessionMetadataResolver();

function projectPathFromJsonl(filePath) {
  return defaultResolver.projectPathFromJsonl(filePath);
}

function sessionTimestampMap(periods, home = os.homedir(), deps = {}) {
  const resolver = deps.metadataResolver || defaultResolver;
  return resolver.resolve(periods, home, deps);
}

module.exports = {
  JSON_METADATA_PREFIX_BYTES,
  MAX_CHANGED_PATHS_PER_CLIENT,
  SQLITE_BATCH_SIZE,
  SUPPORTED_PROJECT_CLIENTS,
  addBoundedMetadataPath,
  createSessionMetadataResolver,
  decodeGrokWorkspace,
  kimiWorkspaceReference,
  normalizeProjectPath,
  opaqueProjectIdentity,
  projectIdentity,
  projectPathFromJsonl,
  sessionTimestampMap,
  timestampFromSessionId
};
