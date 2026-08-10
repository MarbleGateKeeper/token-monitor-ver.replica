'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const sqlite = require('node:sqlite');
const { applySessionTimestamps } = require('../../src/shared/collector');
const {
  JSON_METADATA_PREFIX_BYTES,
  MAX_CHANGED_PATHS_PER_CLIENT,
  SQLITE_BATCH_SIZE,
  addBoundedMetadataPath,
  createSessionMetadataResolver,
  decodeGrokWorkspace,
  opaqueProjectIdentity
} = require('../../src/shared/sessionMetadata');
const { backfillSessionMetadataArchives } = require('../../src/shared/sessionArchiveMetadata');

function tmpHome(prefix = 'token-monitor-metadata-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJsonl(filePath, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
  return filePath;
}

function periodsFor(entries) {
  const sessions = {};
  for (const [client, sessionId] of entries) {
    sessions[`${client}:${sessionId}`] = { client, sessionId, totalTokens: 1 };
  }
  return { today: { sessions } };
}

function decorate(periods, home, resolver, options = {}) {
  applySessionTimestamps(periods, home, {
    metadataResolver: resolver,
    metadataCache: new Map(),
    resolvedSessionKeys: new Set(),
    attemptedSessionKeys: new Set(),
    reconciledClients: new Set(),
    processedChangedClients: new Set(),
    reconcileMetadata: options.reconcileMetadata !== false,
    changedPathsByClient: options.changedPathsByClient || {},
    reconcileMetadataClients: options.reconcileMetadataClients || [],
    resolveProjects: options.resolveProjects !== false,
    scopedHome: options.scopedHome === true
  });
  return periods.today.sessions;
}

function openDb(filePath, schema) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new sqlite.DatabaseSync(filePath);
  db.exec(schema);
  return db;
}

test('path and JSON metadata adapters resolve projects without exposing raw paths', () => {
  const home = tmpHome();
  try {
    const grokWorkspace = encodeURIComponent('C:\\Work\\Grok Project');
    fs.mkdirSync(path.join(home, '.grok', 'sessions', grokWorkspace, 'grok-session'), { recursive: true });
    fs.mkdirSync(path.join(home, '.kimi-code', 'sessions', 'wd_项目_alpha_beta_ABCDEF012345', 'session_kimi-session'), { recursive: true });

    writeJsonl(path.join(home, '.omp', 'agent', 'sessions', 'workspace', 'pi.jsonl'), [
      { type: 'title', title: 'not metadata' },
      { type: 'session', id: 'pi-session', cwd: '/work/pi-repo' }
    ]);
    writeJsonl(path.join(home, '.codebuddy', 'projects', 'project', 'codebuddy-session.jsonl'), [
      { type: 'message', id: 'message-id', sessionId: 'codebuddy-session', cwd: '/work/codebuddy-repo' }
    ]);
    writeJsonl(path.join(home, '.codebuddy', 'projects', 'project', 'coarse-session.jsonl'), [
      { type: 'message', sessionId: 'coarse-session' }
    ]);
    writeJsonl(path.join(home, '.workbuddy', 'projects', 'project', 'workbuddy-session.jsonl'), [
      { type: 'message', sessionId: 'workbuddy-session', cwd: '/work/workbuddy-repo' }
    ]);
    writeJsonl(path.join(home, '.qwen', 'projects', 'real-project', 'chats', 'qwen-session.jsonl'), [
      { type: 'user', sessionId: 'qwen-session', cwd: '/work/qwen-repo' }
    ]);
    writeJsonl(path.join(home, '.qwen', 'projects', 'opaque-project', 'chats', 'opaque-file.jsonl'), [
      { type: 'user', sessionId: 'qwen-opaque' }
    ]);

    const periods = periodsFor([
      ['grok', 'grok-session'],
      ['kimi', 'kimi-session'],
      ['pi', 'pi-session'],
      ['codebuddy', 'codebuddy-session'],
      ['codebuddy', 'coarse-session'],
      ['workbuddy', 'workbuddy-session'],
      ['qwen', 'qwen-session'],
      ['qwen', 'qwen-opaque']
    ]);
    const sessions = decorate(periods, home, createSessionMetadataResolver());

    assert.equal(sessions['grok:grok-session'].projectLabel, 'Grok Project');
    assert.equal(sessions['kimi:kimi-session'].projectLabel, '项目_alpha_beta');
    assert.equal(sessions['pi:pi-session'].projectLabel, 'pi-repo');
    assert.equal(sessions['codebuddy:codebuddy-session'].projectLabel, 'codebuddy-repo');
    assert.equal(sessions['codebuddy:coarse-session'].projectId, undefined);
    assert.equal(sessions['workbuddy:workbuddy-session'].projectLabel, 'workbuddy-repo');
    assert.equal(sessions['qwen:qwen-session'].projectLabel, 'qwen-repo');
    assert.equal(sessions['qwen:qwen-opaque'].projectLabel, 'opaque-project');
    assert.equal(
      sessions['qwen:qwen-opaque'].projectId,
      opaqueProjectIdentity('qwen', 'opaque-project', 'opaque-project').projectId
    );
    assert.equal(decodeGrokWorkspace('%E0%A4%A'), '');
    for (const session of Object.values(sessions)) {
      assert.equal(Object.hasOwn(session, 'projectPath'), false);
      if (session.projectId) assert.match(session.projectId, /^sha256:/);
    }
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('SQLite adapters honor source priority and conflicts', () => {
  const home = tmpHome();
  const databases = [];
  try {
    const zcodeDb = openDb(
      path.join(home, '.zcode', 'cli', 'db', 'db.sqlite'),
      'CREATE TABLE session (id TEXT PRIMARY KEY, directory TEXT, path TEXT)'
    );
    databases.push(zcodeDb);
    zcodeDb.prepare('INSERT INTO session (id, directory, path) VALUES (?, ?, ?)')
      .run('zcode-session', '/work/zcode-db', '/work/zcode-path');
    zcodeDb.close();
    databases.pop();
    writeJsonl(path.join(home, '.zcode', 'projects', 'legacy-project', 'zcode-session.jsonl'), [
      { sessionId: 'zcode-session', cwd: '/work/zcode-file' }
    ]);

    const workbuddyDb = openDb(
      path.join(home, '.workbuddy', 'workbuddy.db'),
      'CREATE TABLE sessions (id TEXT PRIMARY KEY, cwd TEXT)'
    );
    databases.push(workbuddyDb);
    workbuddyDb.prepare('INSERT INTO sessions (id, cwd) VALUES (?, ?)').run('workbuddy-db', '/work/workbuddy-db');
    workbuddyDb.prepare('INSERT INTO sessions (id, cwd) VALUES (?, ?)').run('workbuddy-preferred', '/work/workbuddy-stale');
    workbuddyDb.prepare('INSERT INTO sessions (id, cwd) VALUES (?, ?)').run('workbuddy-conflict', '/work/workbuddy-db-fallback');
    workbuddyDb.close();
    databases.pop();
    writeJsonl(path.join(home, '.workbuddy', 'projects', 'preferred', 'workbuddy-preferred.jsonl'), [
      { sessionId: 'workbuddy-preferred', cwd: '/work/workbuddy-live' }
    ]);
    writeJsonl(path.join(home, '.workbuddy', 'projects', 'conflict-a', 'workbuddy-conflict.jsonl'), [
      { sessionId: 'workbuddy-conflict', cwd: '/work/workbuddy-a' }
    ]);
    writeJsonl(path.join(home, '.workbuddy', 'projects', 'conflict-b', 'workbuddy-conflict.jsonl'), [
      { sessionId: 'workbuddy-conflict', cwd: '/work/workbuddy-b' }
    ]);

    const hermesDb = openDb(
      path.join(home, '.hermes', 'state.db'),
      'CREATE TABLE sessions (id TEXT PRIMARY KEY, cwd TEXT, git_repo_root TEXT)'
    );
    databases.push(hermesDb);
    hermesDb.prepare('INSERT INTO sessions (id, cwd, git_repo_root) VALUES (?, ?, ?)')
      .run('hermes-session', '/work/hermes-cwd', '/work/hermes-git');
    hermesDb.prepare('INSERT INTO sessions (id, cwd, git_repo_root) VALUES (?, ?, ?)')
      .run('hermes-conflict', '/work/hermes-a', '');
    hermesDb.close();
    databases.pop();

    const hermesProfile = openDb(
      path.join(home, '.hermes', 'profiles', 'other', 'state.db'),
      'CREATE TABLE sessions (id TEXT PRIMARY KEY, cwd TEXT, git_repo_root TEXT)'
    );
    databases.push(hermesProfile);
    hermesProfile.prepare('INSERT INTO sessions (id, cwd, git_repo_root) VALUES (?, ?, ?)')
      .run('hermes-conflict', '/work/hermes-b', '');
    hermesProfile.close();
    databases.pop();

    const opencodeDb = openDb(
      path.join(home, '.local', 'share', 'opencode', 'opencode.db'),
      'CREATE TABLE session (id TEXT PRIMARY KEY, directory TEXT, time_created INTEGER, time_updated INTEGER)'
    );
    databases.push(opencodeDb);
    opencodeDb.prepare('INSERT INTO session (id, directory, time_created, time_updated) VALUES (?, ?, ?, ?)')
      .run('opencode-session', '/work/opencode-repo', 1_700_000_000_000, 1_700_000_001_000);
    opencodeDb.close();
    databases.pop();

    const sessions = decorate(periodsFor([
      ['zcode', 'zcode-session'],
      ['workbuddy', 'workbuddy-db'],
      ['workbuddy', 'workbuddy-preferred'],
      ['workbuddy', 'workbuddy-conflict'],
      ['hermes', 'hermes-session'],
      ['hermes', 'hermes-conflict'],
      ['opencode', 'opencode-session']
    ]), home, createSessionMetadataResolver());

    assert.equal(sessions['zcode:zcode-session'].projectLabel, 'zcode-db');
    assert.equal(sessions['workbuddy:workbuddy-db'].projectLabel, 'workbuddy-db');
    assert.equal(sessions['workbuddy:workbuddy-preferred'].projectLabel, 'workbuddy-live');
    assert.equal(sessions['workbuddy:workbuddy-conflict'].projectId, undefined);
    assert.equal(sessions['hermes:hermes-session'].projectLabel, 'hermes-git');
    assert.equal(sessions['hermes:hermes-conflict'].projectId, undefined);
    assert.equal(sessions['opencode:opencode-session'].projectLabel, 'opencode-repo');
    assert.equal(sessions['opencode:opencode-session'].startedAt, '2023-11-14T22:13:20.000Z');
    assert.equal(sessions['opencode:opencode-session'].lastUsedAt, '2023-11-14T22:13:21.000Z');

    const disabled = decorate(
      periodsFor([['opencode', 'opencode-session']]),
      home,
      createSessionMetadataResolver(),
      { resolveProjects: false }
    );
    assert.equal(disabled['opencode:opencode-session'].projectId, undefined);
    assert.equal(disabled['opencode:opencode-session'].lastUsedAt, '2023-11-14T22:13:21.000Z');
  } finally {
    for (const db of databases) { try { db.close(); } catch (_) {} }
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('SQLite reads are batched and malformed databases fail closed', () => {
  const home = tmpHome();
  let db;
  try {
    db = openDb(
      path.join(home, '.zcode', 'cli', 'db', 'db.sqlite'),
      'CREATE TABLE session (id TEXT PRIMARY KEY, directory TEXT)'
    );
    const insert = db.prepare('INSERT INTO session (id, directory) VALUES (?, ?)');
    const entries = [];
    db.exec('BEGIN');
    for (let index = 0; index < SQLITE_BATCH_SIZE + 5; index += 1) {
      const id = `z${index}`;
      insert.run(id, `/work/project-${index}`);
      entries.push(['zcode', id]);
    }
    db.exec('COMMIT');
    db.close();
    db = null;

    const sessions = decorate(periodsFor(entries), home, createSessionMetadataResolver());
    assert.equal(Object.values(sessions).filter((session) => session.projectId).length, SQLITE_BATCH_SIZE + 5);

    const brokenHome = tmpHome('token-monitor-broken-db-');
    try {
      const broken = path.join(brokenHome, '.hermes', 'state.db');
      fs.mkdirSync(path.dirname(broken), { recursive: true });
      fs.writeFileSync(broken, 'not a sqlite database');
      const brokenSessions = decorate(
        periodsFor([['hermes', 'broken']]),
        brokenHome,
        createSessionMetadataResolver()
      );
      assert.equal(brokenSessions['hermes:broken'].projectId, undefined);

      const incomplete = openDb(
        path.join(brokenHome, '.workbuddy', 'workbuddy.db'),
        'CREATE TABLE sessions (id TEXT PRIMARY KEY)'
      );
      incomplete.prepare('INSERT INTO sessions (id) VALUES (?)').run('missing-column');
      incomplete.close();
      const incompleteSessions = decorate(
        periodsFor([['workbuddy', 'missing-column']]),
        brokenHome,
        createSessionMetadataResolver()
      );
      assert.equal(incompleteSessions['workbuddy:missing-column'].projectId, undefined);
    } finally {
      fs.rmSync(brokenHome, { recursive: true, force: true });
    }
  } finally {
    if (db) db.close();
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('SQLite cache retains hits and misses until the DB, WAL, or SHM signature changes', () => {
  const home = tmpHome();
  try {
    const dbPath = path.join(home, '.zcode', 'cli', 'db', 'db.sqlite');
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    fs.writeFileSync(dbPath, 'signature-only fixture');
    let selectCalls = 0;
    const fakeSqlite = {
      DatabaseSync: class {
        exec() {}
        prepare(sql) {
          if (sql.startsWith('PRAGMA table_info')) {
            return { all: () => [{ name: 'id' }, { name: 'directory' }] };
          }
          return {
            all: (...ids) => {
              selectCalls += 1;
              return ids.includes('hit') ? [{ id: 'hit', directory: '/work/cached' }] : [];
            }
          };
        }
        close() {}
      }
    };
    const resolver = createSessionMetadataResolver({ sqlite: fakeSqlite });
    const entries = [['zcode', 'hit'], ['zcode', 'miss']];

    let sessions = decorate(periodsFor(entries), home, resolver);
    assert.equal(sessions['zcode:hit'].projectLabel, 'cached');
    assert.equal(sessions['zcode:miss'].projectId, undefined);
    assert.equal(selectCalls, 1);

    sessions = decorate(periodsFor(entries), home, resolver);
    assert.equal(sessions['zcode:hit'].projectLabel, 'cached');
    assert.equal(selectCalls, 1);

    fs.writeFileSync(`${dbPath}-wal`, 'wal changed');
    decorate(periodsFor(entries), home, resolver);
    assert.equal(selectCalls, 2);

    fs.writeFileSync(`${dbPath}-shm`, 'shm changed');
    decorate(periodsFor(entries), home, resolver);
    assert.equal(selectCalls, 3);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('a locked SQLite source fails closed and is retried after the lock clears', () => {
  const home = tmpHome();
  let lockDb;
  try {
    const dbPath = path.join(home, '.zcode', 'cli', 'db', 'db.sqlite');
    lockDb = openDb(dbPath, 'CREATE TABLE session (id TEXT PRIMARY KEY, directory TEXT)');
    lockDb.prepare('INSERT INTO session (id, directory) VALUES (?, ?)').run('locked', '/work/unlocked');
    lockDb.exec('PRAGMA journal_mode = DELETE');
    lockDb.exec('BEGIN EXCLUSIVE');

    const resolver = createSessionMetadataResolver();
    let sessions = decorate(periodsFor([['zcode', 'locked']]), home, resolver);
    assert.equal(sessions['zcode:locked'].projectId, undefined);

    lockDb.exec('ROLLBACK');
    lockDb.close();
    lockDb = null;
    sessions = decorate(periodsFor([['zcode', 'locked']]), home, resolver);
    assert.equal(sessions['zcode:locked'].projectLabel, 'unlocked');
  } finally {
    if (lockDb) {
      try { lockDb.exec('ROLLBACK'); } catch (_) {}
      lockDb.close();
    }
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('changed files update only the cached client index and deletions remove attribution', () => {
  const home = tmpHome();
  try {
    const file = writeJsonl(path.join(home, '.codebuddy', 'projects', 'p', 'session.jsonl'), [
      { sessionId: 'session', cwd: '/work/first' }
    ]);
    const resolver = createSessionMetadataResolver();
    const initial = decorate(periodsFor([['codebuddy', 'session']]), home, resolver);
    assert.equal(initial['codebuddy:session'].projectLabel, 'first');

    fs.writeFileSync(file, `${JSON.stringify({ sessionId: 'session', cwd: '/work/second' })}\n`);
    const changed = decorate(periodsFor([['codebuddy', 'session']]), home, resolver, {
      reconcileMetadata: false,
      changedPathsByClient: { codebuddy: [file] }
    });
    assert.equal(changed['codebuddy:session'].projectLabel, 'second');

    fs.rmSync(file);
    const removed = decorate(periodsFor([['codebuddy', 'session']]), home, resolver, {
      reconcileMetadata: false,
      changedPathsByClient: { codebuddy: [file] }
    });
    assert.equal(removed['codebuddy:session'].projectId, undefined);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('JSON metadata reads are bounded, conflicts remain unknown, and opt-out skips enrichment', () => {
  const home = tmpHome();
  try {
    const beyondPrefix = path.join(home, '.codebuddy', 'projects', 'large', 'large-session.jsonl');
    fs.mkdirSync(path.dirname(beyondPrefix), { recursive: true });
    const filler = `${JSON.stringify({ type: 'noop' })}\n`.repeat(Math.ceil(JSON_METADATA_PREFIX_BYTES / 16));
    fs.writeFileSync(beyondPrefix, `${filler}${JSON.stringify({ sessionId: 'large-session', cwd: '/work/too-late' })}\n`);

    writeJsonl(path.join(home, '.codebuddy', 'projects', 'a', 'conflict.jsonl'), [
      { sessionId: 'conflict', cwd: '/work/a' }
    ]);
    writeJsonl(path.join(home, '.codebuddy', 'projects', 'b', 'conflict.jsonl'), [
      { sessionId: 'conflict', cwd: '/work/b' }
    ]);
    writeJsonl(path.join(home, '.codebuddy', 'projects', 'off', 'off.jsonl'), [
      { sessionId: 'off', cwd: '/work/off' }
    ]);

    const resolver = createSessionMetadataResolver();
    const sessions = decorate(periodsFor([
      ['codebuddy', 'large-session'],
      ['codebuddy', 'conflict']
    ]), home, resolver);
    assert.equal(sessions['codebuddy:large-session'].projectId, undefined);
    assert.equal(sessions['codebuddy:conflict'].projectId, undefined);

    const disabled = decorate(periodsFor([['codebuddy', 'off']]), home, resolver, { resolveProjects: false });
    assert.equal(disabled['codebuddy:off'].projectId, undefined);

    const changed = new Map();
    const reconcile = new Set();
    for (let index = 0; index <= MAX_CHANGED_PATHS_PER_CLIENT; index += 1) {
      addBoundedMetadataPath(changed, reconcile, 'codebuddy', path.join(home, `changed-${index}.jsonl`));
    }
    assert.equal(changed.has('codebuddy'), false);
    assert.deepEqual([...reconcile], ['codebuddy']);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('scoped WSL decoration does not open SQLite-backed project stores', () => {
  const home = tmpHome();
  const otherHome = tmpHome();
  let db;
  try {
    db = openDb(
      path.join(home, '.workbuddy', 'workbuddy.db'),
      'CREATE TABLE sessions (id TEXT PRIMARY KEY, cwd TEXT)'
    );
    db.prepare('INSERT INTO sessions (id, cwd) VALUES (?, ?)').run('wsl-db', '/work/wsl-db');
    db.close();
    db = null;

    const sessions = decorate(
      periodsFor([['workbuddy', 'wsl-db']]),
      home,
      createSessionMetadataResolver(),
      { scopedHome: true }
    );
    assert.equal(sessions['workbuddy:wsl-db'].projectId, undefined);

    const resolver = createSessionMetadataResolver();
    writeJsonl(path.join(home, '.codebuddy', 'projects', 'one', 'shared.jsonl'), [
      { sessionId: 'shared', cwd: '/work/host-one' }
    ]);
    writeJsonl(path.join(otherHome, '.codebuddy', 'projects', 'two', 'shared.jsonl'), [
      { sessionId: 'shared', cwd: '/work/host-two' }
    ]);
    const firstHome = decorate(periodsFor([['codebuddy', 'shared']]), home, resolver);
    const secondHome = decorate(
      periodsFor([['codebuddy', 'shared']]),
      otherHome,
      resolver,
      { scopedHome: true }
    );
    assert.equal(firstHome['codebuddy:shared'].projectLabel, 'host-one');
    assert.equal(secondHome['codebuddy:shared'].projectLabel, 'host-two');
  } finally {
    if (db) db.close();
    fs.rmSync(home, { recursive: true, force: true });
    fs.rmSync(otherHome, { recursive: true, force: true });
  }
});

test('full-scan archive backfill decorates retained and removed-client sessions', () => {
  const home = tmpHome();
  let hermesDb;
  try {
    writeJsonl(path.join(home, '.workbuddy', 'projects', 'project', 'retained.jsonl'), [
      { sessionId: 'retained', cwd: '/work/retained-project' }
    ]);
    hermesDb = openDb(
      path.join(home, '.hermes', 'state.db'),
      'CREATE TABLE sessions (id TEXT PRIMARY KEY, cwd TEXT, git_repo_root TEXT)'
    );
    hermesDb.prepare('INSERT INTO sessions (id, cwd, git_repo_root) VALUES (?, ?, ?)')
      .run('removed', '/work/hermes-cwd', '/work/hermes-repository');
    hermesDb.close();
    hermesDb = null;

    const retainedSession = {
      client: 'workbuddy', sessionId: 'retained', totalTokens: 10,
      projectId: '', projectLabel: ''
    };
    const removedSession = {
      client: 'hermes', sessionId: 'removed', totalTokens: 20,
      projectId: '', projectLabel: ''
    };
    const existingSession = {
      client: 'zcode', sessionId: 'existing', totalTokens: 30,
      projectId: 'sha256:existing', projectLabel: 'Existing'
    };
    const sessionUsageArchive = {
      version: 1,
      sessions: {
        'workbuddy:retained': {
          client: 'workbuddy', sessionId: 'retained', capturedAt: '2026-08-10T00:00:00.000Z',
          day: '2026-08-10', month: '2026-08', periodWindows: {},
          periods: {
            today: { ...retainedSession },
            month: { ...retainedSession },
            allTime: { ...retainedSession }
          }
        },
        'zcode:existing': {
          client: 'zcode', sessionId: 'existing', capturedAt: '2026-08-10T00:00:00.000Z',
          day: '2026-08-10', month: '2026-08', periodWindows: {},
          periods: { allTime: existingSession }
        }
      }
    };
    const archivedClientUsage = {
      version: 1,
      clients: {
        hermes: {
          client: 'hermes', capturedAt: '2026-08-10T00:00:00.000Z', day: '2026-08-10', month: '2026-08',
          periods: {
            today: { totalTokens: 20, sessions: { 'hermes:removed': { ...removedSession } } },
            month: { totalTokens: 20, sessions: { 'hermes:removed': { ...removedSession } } },
            allTime: { totalTokens: 20, sessions: { 'hermes:removed': { ...removedSession } } }
          }
        }
      }
    };

    const resolver = createSessionMetadataResolver();
    const result = backfillSessionMetadataArchives({ sessionUsageArchive, archivedClientUsage }, {
      home,
      metadataResolver: resolver
    });
    assert.equal(result.updatedSessions, 2);
    assert.equal(result.sessionUsageArchiveChanged, true);
    assert.equal(result.archivedClientUsageChanged, true);
    for (const period of Object.values(result.sessionUsageArchive.sessions['workbuddy:retained'].periods)) {
      assert.equal(period.projectLabel, 'retained-project');
    }
    for (const period of Object.values(result.archivedClientUsage.clients.hermes.periods)) {
      assert.equal(period.sessions['hermes:removed'].projectLabel, 'hermes-repository');
    }
    assert.equal(
      result.sessionUsageArchive.sessions['zcode:existing'].periods.allTime.projectId,
      'sha256:existing'
    );
    assert.equal(JSON.stringify(result).includes('/work/'), false);

    const unchanged = backfillSessionMetadataArchives({
      sessionUsageArchive: result.sessionUsageArchive,
      archivedClientUsage: result.archivedClientUsage
    }, { home, metadataResolver: resolver });
    assert.equal(unchanged.candidateSessions, 0);
    assert.equal(unchanged.updatedSessions, 0);
  } finally {
    if (hermesDb) hermesDb.close();
    fs.rmSync(home, { recursive: true, force: true });
  }
});
