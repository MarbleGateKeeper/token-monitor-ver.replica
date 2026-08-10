'use strict';

const os = require('node:os');
const { PERIODS } = require('./usage');
const { normalizeArchivedClientUsage } = require('./clientUsageArchive');
const { normalizeSessionUsageArchive } = require('./sessionUsageArchive');
const { createSessionMetadataResolver, SUPPORTED_PROJECT_CLIENTS } = require('./sessionMetadata');

function sessionKey(session) {
  const client = String(session?.client || '').trim();
  const sessionId = String(session?.sessionId || '').trim();
  return client && sessionId ? `${client}:${sessionId}` : '';
}

function needsProjectMetadata(session) {
  return Boolean(
    sessionKey(session)
    && SUPPORTED_PROJECT_CLIENTS.has(String(session.client || '').trim())
    && (!session.projectId || !session.projectLabel)
  );
}

function collectArchiveTargets(sessionUsageArchive, archivedClientUsage) {
  const targets = new Map();
  const add = (session, source) => {
    const key = sessionKey(session);
    if (!key || !needsProjectMetadata(session)) return;
    if (!targets.has(key)) targets.set(key, []);
    targets.get(key).push({ session, source });
  };

  for (const entry of Object.values(sessionUsageArchive.sessions || {})) {
    for (const periodName of PERIODS) add(entry.periods?.[periodName], 'session');
  }
  for (const entry of Object.values(archivedClientUsage.clients || {})) {
    for (const periodName of PERIODS) {
      for (const session of Object.values(entry.periods?.[periodName]?.sessions || {})) add(session, 'client');
    }
  }
  return targets;
}

function applyTimestamp(session, key, value, compare) {
  if (!value) return false;
  const current = session[key];
  if (current && !compare(value, current)) return false;
  if (current === value) return false;
  session[key] = value;
  return true;
}

function applyMetadata(target, metadata) {
  const session = target.session;
  let changed = false;
  if (metadata.projectId && !session.projectId) {
    session.projectId = metadata.projectId;
    session.projectLabel = metadata.projectLabel || '';
    changed = true;
  } else if (
    metadata.projectId
    && session.projectId === metadata.projectId
    && !session.projectLabel
    && metadata.projectLabel
  ) {
    session.projectLabel = metadata.projectLabel;
    changed = true;
  }
  changed = applyTimestamp(session, 'startedAt', metadata.startedAt, (next, current) => Date.parse(next) < Date.parse(current)) || changed;
  changed = applyTimestamp(session, 'lastUsedAt', metadata.lastUsedAt, (next, current) => Date.parse(next) > Date.parse(current)) || changed;
  return changed;
}

function emptyResult(sessionUsageArchive, archivedClientUsage, candidateSessions = 0) {
  return {
    sessionUsageArchive,
    archivedClientUsage,
    candidateSessions,
    updatedSessions: 0,
    sessionUsageArchiveChanged: false,
    archivedClientUsageChanged: false
  };
}

// Full scans call this before either archive is merged into the visible record.
// The resolver therefore sees historical session ids that Tokscale no longer
// returns, while its output remains the same projectId/projectLabel pair used by
// live periods. Both archives are normalized clones, so a failed lookup cannot
// partially mutate the caller's persisted state.
function backfillSessionMetadataArchives(input = {}, options = {}) {
  const sessionUsageArchive = normalizeSessionUsageArchive(input.sessionUsageArchive || {});
  const archivedClientUsage = normalizeArchivedClientUsage(input.archivedClientUsage || {});
  if (options.resolveProjects === false) return emptyResult(sessionUsageArchive, archivedClientUsage);

  const targets = collectArchiveTargets(sessionUsageArchive, archivedClientUsage);
  if (targets.size === 0) return emptyResult(sessionUsageArchive, archivedClientUsage);

  const sessions = {};
  for (const [key, values] of targets) {
    const sample = values[0].session;
    sessions[key] = { client: sample.client, sessionId: sample.sessionId, totalTokens: 1 };
  }

  const resolver = options.metadataResolver || createSessionMetadataResolver(options.metadataDeps);
  let metadata;
  try {
    metadata = resolver.resolve({ archive: { sessions } }, options.home || os.homedir(), {
      ...(options.metadataDeps || {}),
      metadataCache: new Map(),
      resolvedSessionKeys: new Set(),
      attemptedSessionKeys: new Set(),
      reconciledClients: new Set(),
      processedChangedClients: new Set(),
      reconcileMetadata: true,
      resolveProjects: true,
      retryMisses: true
    });
  } catch (_) {
    return emptyResult(sessionUsageArchive, archivedClientUsage, targets.size);
  }

  const updatedKeys = new Set();
  let sessionUsageArchiveChanged = false;
  let archivedClientUsageChanged = false;
  for (const [key, values] of targets) {
    const value = metadata.get(key);
    if (!value) continue;
    for (const target of values) {
      if (!applyMetadata(target, value)) continue;
      updatedKeys.add(key);
      if (target.source === 'session') sessionUsageArchiveChanged = true;
      else archivedClientUsageChanged = true;
    }
  }

  return {
    sessionUsageArchive,
    archivedClientUsage,
    candidateSessions: targets.size,
    updatedSessions: updatedKeys.size,
    sessionUsageArchiveChanged,
    archivedClientUsageChanged
  };
}

module.exports = {
  backfillSessionMetadataArchives,
  collectArchiveTargets,
  needsProjectMetadata
};
