'use strict';

(function exposeModelMappings(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TokenMonitorModelMappings = api;
})(typeof window !== 'undefined' ? window : null, function createModelMappingsApi() {
  const PERIODS = ['today', 'month', 'allTime'];
  const PERIOD_MODEL_MAPS = [
    'models',
    'modelCosts',
    'modelCacheReads',
    'modelCacheWrites',
    'modelOutputs'
  ];

  function normalizeModelId(value) {
    const normalized = String(value || '').trim().toLowerCase();
    return normalized || null;
  }

  function normalizeModelMappings(value) {
    const bySource = new Map();
    for (const raw of Array.isArray(value) ? value : []) {
      const source = normalizeModelId(raw?.source ?? raw?.from ?? raw?.alias);
      const target = normalizeModelId(raw?.target ?? raw?.to ?? raw?.canonical);
      if (!source || !target || source === target) continue;
      bySource.set(source, { source, target });
    }
    return [...bySource.values()];
  }

  function directMapping(value) {
    return new Map(normalizeModelMappings(value).map(({ source, target }) => [source, target]));
  }

  function resolverFor(value) {
    const direct = directMapping(value);
    const cache = new Map();

    return (model) => {
      const original = String(model || '').trim();
      const source = normalizeModelId(model);
      if (!source || direct.size === 0) return source;
      if (!direct.has(source)) return original;
      if (cache.has(source)) return cache.get(source);

      const seen = new Set();
      let current = source;
      while (direct.has(current)) {
        if (seen.has(current)) {
          // Invalid persisted cycles are deliberately inert. The editor blocks
          // new cycles, but old/manual settings must never make model rows vanish.
          return original;
        }
        seen.add(current);
        current = direct.get(current);
      }
      cache.set(source, current);
      return current;
    };
  }

  function validateModelMapping(value, entry, previousSource = '') {
    const source = normalizeModelId(entry?.source);
    const target = normalizeModelId(entry?.target);
    if (!source || !target) return 'missing';
    if (source === target) return 'same';

    const previous = normalizeModelId(previousSource);
    if (normalizeModelMappings(value).some((mapping) => mapping.source === source && mapping.source !== previous)) {
      return 'duplicate';
    }
    const direct = directMapping(value);
    if (previous) direct.delete(previous);
    direct.delete(source);
    direct.set(source, target);

    const seen = new Set([source]);
    let current = target;
    while (direct.has(current)) {
      if (seen.has(current)) return 'cycle';
      seen.add(current);
      current = direct.get(current);
    }
    return null;
  }

  function upsertModelMapping(value, entry, previousSource = '') {
    const source = normalizeModelId(entry?.source);
    const target = normalizeModelId(entry?.target);
    if (!source || !target || source === target) return normalizeModelMappings(value);
    const previous = normalizeModelId(previousSource);
    const next = normalizeModelMappings(value).filter((mapping) => (
      mapping.source !== source && (!previous || mapping.source !== previous)
    ));
    next.push({ source, target });
    return next;
  }

  function removeModelMapping(value, source) {
    const normalized = normalizeModelId(source);
    return normalizeModelMappings(value).filter((mapping) => mapping.source !== normalized);
  }

  function inUseModelIds(stats) {
    const ids = new Set();
    const periods = stats?.periods || {};
    for (const periodName of PERIODS) {
      for (const model of Object.keys(periods?.[periodName]?.models || {})) ids.add(model);
    }
    return [...ids].sort();
  }

  function finiteNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function sameMapKind(input) {
    return input && Object.getPrototypeOf(input) === null ? Object.create(null) : {};
  }

  function own(object, key) {
    return Object.prototype.hasOwnProperty.call(object || {}, key);
  }

  function setOwn(object, key, value) {
    Object.defineProperty(object, key, {
      configurable: true,
      enumerable: true,
      value,
      writable: true
    });
  }

  function remapNumberMap(input, resolve) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const output = sameMapKind(input);
    for (const [model, value] of Object.entries(input)) {
      const target = resolve(model);
      if (!target) continue;
      setOwn(output, target, (own(output, target) ? finiteNumber(output[target]) : 0) + finiteNumber(value));
    }
    return output;
  }

  function remapNestedNumberMaps(input, resolve) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const output = sameMapKind(input);
    for (const [key, models] of Object.entries(input)) {
      output[key] = remapNumberMap(models, resolve);
    }
    return output;
  }

  function mergeMetricValue(previous, incoming) {
    if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
      return finiteNumber(previous) + finiteNumber(incoming);
    }
    const output = previous && typeof previous === 'object' && !Array.isArray(previous)
      ? { ...previous }
      : {};
    for (const [key, value] of Object.entries(incoming)) {
      if (typeof value === 'number' || (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)))) {
        output[key] = finiteNumber(output[key]) + finiteNumber(value);
      } else if (output[key] === undefined) {
        output[key] = value;
      }
    }
    return output;
  }

  function remapMetricMap(input, resolve) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const output = sameMapKind(input);
    for (const [model, value] of Object.entries(input)) {
      const target = resolve(model);
      if (!target) continue;
      setOwn(output, target, mergeMetricValue(own(output, target) ? output[target] : undefined, value));
    }
    return output;
  }

  function remapSessions(input, resolve) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
    const output = sameMapKind(input);
    for (const [key, session] of Object.entries(input)) {
      if (!session || typeof session !== 'object') {
        output[key] = session;
        continue;
      }
      output[key] = {
        ...session,
        ...(session.models && typeof session.models === 'object'
          ? { models: remapNumberMap(session.models, resolve) }
          : {}),
        ...(session.modelCosts && typeof session.modelCosts === 'object'
          ? { modelCosts: remapNumberMap(session.modelCosts, resolve) }
          : {})
      };
    }
    return output;
  }

  function remapPeriod(period, resolve) {
    if (!period || typeof period !== 'object') return period;
    const output = { ...period };
    for (const key of PERIOD_MODEL_MAPS) {
      if (period[key] && typeof period[key] === 'object') {
        output[key] = remapNumberMap(period[key], resolve);
      }
    }
    if (period.clientModels && typeof period.clientModels === 'object') {
      output.clientModels = remapNestedNumberMaps(period.clientModels, resolve);
    }
    if (period.clientModelCosts && typeof period.clientModelCosts === 'object') {
      output.clientModelCosts = remapNestedNumberMaps(period.clientModelCosts, resolve);
    }
    if (period.sessions && typeof period.sessions === 'object') {
      output.sessions = remapSessions(period.sessions, resolve);
    }
    return output;
  }

  function remapPeriodContainer(container, resolve) {
    if (!container || typeof container !== 'object') return container;
    const output = { ...container };
    for (const periodName of PERIODS) {
      if (container[periodName] && typeof container[periodName] === 'object') {
        output[periodName] = remapPeriod(container[periodName], resolve);
      }
    }
    return output;
  }

  function favoriteModel(rows) {
    const totals = new Map();
    for (const row of Array.isArray(rows) ? rows : []) {
      for (const [model, value] of Object.entries(row?.perModel || {})) {
        totals.set(model, (totals.get(model) || 0) + finiteNumber(value?.tokens ?? value));
      }
    }
    let winner = '';
    let winnerTokens = -1;
    for (const [model, tokens] of totals) {
      if (tokens > winnerTokens) {
        winner = model;
        winnerTokens = tokens;
      }
    }
    return winner;
  }

  function remapHistoryWithResolver(history, resolve) {
    if (!history || typeof history !== 'object') return history;
    const mapRows = (rows) => (Array.isArray(rows)
      ? rows.map((row) => ({
          ...row,
          ...(row?.perModel && typeof row.perModel === 'object'
            ? { perModel: remapMetricMap(row.perModel, resolve) }
            : {})
        }))
      : rows);
    const daily = mapRows(history.daily);
    const monthly = mapRows(history.monthly);
    const rowsWithModels = (Array.isArray(monthly) && monthly.some((row) => Object.keys(row?.perModel || {}).length > 0))
      ? monthly
      : daily;
    const recomputedFavorite = favoriteModel(rowsWithModels);
    const summary = history.summary && typeof history.summary === 'object'
      ? {
          ...history.summary,
          favoriteModel: recomputedFavorite || resolve(history.summary.favoriteModel) || ''
        }
      : history.summary;
    return { ...history, daily, monthly, summary };
  }

  function remapRecordWithResolver(record, resolve) {
    if (!record || typeof record !== 'object') return record;
    let output = { ...record };
    if (record.periods && typeof record.periods === 'object') {
      output.periods = remapPeriodContainer(record.periods, resolve);
    }
    output = remapPeriodContainer(output, resolve);
    if (record.history && typeof record.history === 'object') {
      output.history = remapHistoryWithResolver(record.history, resolve);
    }
    return output;
  }

  function applyModelMappingsToPeriod(period, mappings) {
    if (normalizeModelMappings(mappings).length === 0) return period;
    return remapPeriod(period, resolverFor(mappings));
  }

  function applyModelMappingsToRecord(record, mappings) {
    if (normalizeModelMappings(mappings).length === 0) return record;
    return remapRecordWithResolver(record, resolverFor(mappings));
  }

  function applyModelMappingsToHistory(history, mappings) {
    if (normalizeModelMappings(mappings).length === 0) return history;
    return remapHistoryWithResolver(history, resolverFor(mappings));
  }

  function applyModelMappingsToStats(stats, mappings) {
    if (!stats || typeof stats !== 'object' || normalizeModelMappings(mappings).length === 0) return stats;
    const resolve = resolverFor(mappings);
    const output = remapRecordWithResolver(stats, resolve);
    if (Array.isArray(stats.devices)) {
      output.devices = stats.devices.map((device) => remapRecordWithResolver(device, resolve));
    }
    if (stats.allTimeSessionsView && typeof stats.allTimeSessionsView === 'object') {
      output.allTimeSessionsView = remapSessions(stats.allTimeSessionsView, resolve);
    }
    if (stats.historyPreview && typeof stats.historyPreview === 'object') {
      output.historyPreview = remapHistoryWithResolver(stats.historyPreview, resolve);
    }
    return output;
  }

  return {
    applyModelMappingsToHistory,
    applyModelMappingsToPeriod,
    applyModelMappingsToRecord,
    applyModelMappingsToStats,
    inUseModelIds,
    normalizeModelId,
    normalizeModelMappings,
    removeModelMapping,
    upsertModelMapping,
    validateModelMapping
  };
});
