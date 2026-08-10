'use strict';

const crypto = require('node:crypto');
const { readJson, writeJsonAtomic } = require('./config');
const {
  modelMappingResolver,
  normalizeModelId,
  normalizeModelMappings
} = require('./modelMappings');

const INVALID_UNIT_PRICE = Symbol('invalid custom pricing value');

// '' / null / undefined => unset (undefined). Finite numbers >= 0 are accepted
// (0 = explicit free). Other provided values are invalid, not unset.
function toUnitPrice(value) {
  if (value === '' || value === null || value === undefined) return undefined;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return INVALID_UNIT_PRICE;
  return value;
}

// Array<{modelId,inputPerM,outputPerM,cacheReadPerM}> -> cleaned array.
// Mirrors tokscale's rule: at least one of input/output must be present.
// A present zero is an explicit free price; undefined means unset.
function normalizeCustomPricingSetting(value) {
  if (!Array.isArray(value)) return [];
  const byId = new Map();
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const modelId = typeof raw.modelId === 'string' ? raw.modelId.trim() : '';
    if (!modelId) continue;
    const inputPerM = toUnitPrice(raw.inputPerM);
    const outputPerM = toUnitPrice(raw.outputPerM);
    const cacheReadPerM = toUnitPrice(raw.cacheReadPerM);
    if ([inputPerM, outputPerM, cacheReadPerM].includes(INVALID_UNIT_PRICE)) continue;
    if (inputPerM === undefined && outputPerM === undefined) continue;
    byId.set(modelId, { modelId, inputPerM, outputPerM, cacheReadPerM });
  }
  return [...byId.values()];
}

// Cleaned entries -> tokscale `models` map (per-million keys), omitting unset fields.
function buildTokscaleModels(entries) {
  const models = {};
  for (const e of entries) {
    const m = {};
    if (e.inputPerM !== undefined) m.input_cost_per_million_tokens = e.inputPerM;
    if (e.outputPerM !== undefined) m.output_cost_per_million_tokens = e.outputPerM;
    if (e.cacheReadPerM !== undefined) m.cache_read_input_token_cost_per_million_tokens = e.cacheReadPerM;
    models[e.modelId] = m;
  }
  return models;
}

function mappingPricingRevision(mappings, customPricing, cacheRevision = '') {
  return crypto.createHash('sha256').update(JSON.stringify({
    cacheRevision: String(cacheRevision || ''),
    mappings: normalizeModelMappings(mappings),
    customPricing: normalizeCustomPricingSetting(customPricing)
  })).digest('hex');
}

function perMillion(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
  return Number((value * 1_000_000).toPrecision(15));
}

function mappedPricingEntry(modelId, value) {
  const pricing = value?.pricing && typeof value.pricing === 'object' ? value.pricing : value;
  if (!pricing || typeof pricing !== 'object') return null;
  const entry = {
    modelId,
    inputPerM: perMillion(pricing.inputCostPerToken),
    outputPerM: perMillion(pricing.outputCostPerToken),
    cacheReadPerM: perMillion(pricing.cacheReadInputTokenCost)
  };
  return entry.inputPerM === undefined && entry.outputPerM === undefined ? null : entry;
}

function customPricingByModel(value) {
  return new Map(normalizeCustomPricingSetting(value).map((entry) => [
    normalizeModelId(entry.modelId),
    entry
  ]));
}

async function resolveMappedPricing(mappings, customPricing, lookupModelPricing, options = {}) {
  const normalizedMappings = normalizeModelMappings(mappings);
  const resolve = modelMappingResolver(normalizedMappings);
  const customByModel = customPricingByModel(customPricing);
  const targets = [];
  const seenTargets = new Set();

  for (const { source } of normalizedMappings) {
    const target = resolve(source);
    if (!target || target === source || seenTargets.has(target)) continue;
    seenTargets.add(target);
    targets.push(target);
  }

  const pricingByTarget = new Map();
  const unresolvedTargets = new Set();
  const pendingTargets = [];
  for (const target of targets) {
    const custom = customByModel.get(normalizeModelId(target));
    if (custom) {
      pricingByTarget.set(target, custom);
    } else {
      pendingTargets.push(target);
    }
  }

  let cursor = 0;
  const concurrency = Math.max(1, Math.min(4, Number(options.concurrency) || 4));
  const worker = async () => {
    while (cursor < pendingTargets.length) {
      const target = pendingTargets[cursor];
      cursor += 1;
      try {
        const result = typeof lookupModelPricing === 'function'
          ? await lookupModelPricing(target)
          : null;
        const entry = mappedPricingEntry(target, result);
        if (entry) pricingByTarget.set(target, entry);
        else unresolvedTargets.add(target);
      } catch (_) {
        unresolvedTargets.add(target);
      }
    }
  };
  await Promise.all(Array.from(
    { length: Math.min(concurrency, pendingTargets.length) },
    () => worker()
  ));

  const entries = [];
  for (const { source } of normalizedMappings) {
    const target = resolve(source);
    const pricing = pricingByTarget.get(target);
    if (!pricing || target === source) continue;
    entries.push({
      modelId: source,
      inputPerM: pricing.inputPerM,
      outputPerM: pricing.outputPerM,
      cacheReadPerM: pricing.cacheReadPerM
    });
  }
  return { entries: normalizeCustomPricingSetting(entries), unresolvedTargets: [...unresolvedTargets].sort() };
}

// Merge our managed models into the existing file's models, preserving entries
// the user hand-added and dropping managed ids we no longer own.
function mergeManaged(existingModels, managedModels, previousManagedIds) {
  const result = { ...(existingModels || {}) };
  for (const id of previousManagedIds || []) {
    if (!Object.prototype.hasOwnProperty.call(managedModels, id)) delete result[id];
  }
  Object.assign(result, managedModels);
  return { models: result, managedIds: Object.keys(managedModels) };
}

// Orchestrate: read existing file + sidecar, merge, write both atomically.
// No-op (creates nothing) when there are no overrides and no prior state, so a
// fresh install with no overrides never litters tokscale's config dir.
function applyCustomPricing(settingValue, options) {
  const { pricingPath, sidecarPath } = options;
  const mappingPricing = normalizeCustomPricingSetting(options.mappingPricing);
  // A mapping declares the target to be canonical, including its price. Put the
  // derived aliases last so a source-specific custom price cannot silently win.
  const managedModels = buildTokscaleModels([
    ...normalizeCustomPricingSetting(settingValue),
    ...mappingPricing
  ]);

  const existing = readJson(pricingPath, null);
  const existingModels = (existing && typeof existing === 'object' && existing.models && typeof existing.models === 'object')
    ? existing.models
    : {};

  const sidecar = readJson(sidecarPath, null);
  const previousManagedIds = (sidecar && Array.isArray(sidecar.managedIds)) ? sidecar.managedIds : [];

  if (Object.keys(managedModels).length === 0 && previousManagedIds.length === 0 && existing === null) {
    return { models: {}, managedIds: [] };
  }

  const { models, managedIds } = mergeManaged(existingModels, managedModels, previousManagedIds);

  writeJsonAtomic(pricingPath, { models });
  if (options.writeSidecar === false) return { models, managedIds };
  const sidecarValue = Object.prototype.hasOwnProperty.call(options, 'mappingPricingRevision')
    ? {
        version: 2,
        managedIds,
        mappingPricingRevision: String(options.mappingPricingRevision || ''),
        mappingPricing
      }
    : { version: 1, managedIds };
  writeJsonAtomic(sidecarPath, sidecarValue);
  return { models, managedIds };
}

async function syncMappedPricing(settingValue, mappings, options) {
  const revision = mappingPricingRevision(mappings, settingValue, options.cacheRevision);
  const sidecar = readJson(options.sidecarPath, null);
  const cached = sidecar?.version === 2
    && sidecar.mappingPricingRevision === revision
    && Array.isArray(sidecar.mappingPricing);
  // A removed custom target must disappear before `tokscale pricing <target>`
  // runs, otherwise the lookup would read the stale managed value we are trying
  // to replace. Keep the old sidecar until resolution succeeds so a crash here
  // retries instead of blessing an empty cache.
  if (!cached) {
    applyCustomPricing(settingValue, {
      pricingPath: options.pricingPath,
      sidecarPath: options.sidecarPath,
      mappingPricing: [],
      writeSidecar: false
    });
  }
  const resolved = cached
    ? { entries: normalizeCustomPricingSetting(sidecar.mappingPricing), unresolvedTargets: [] }
    : await resolveMappedPricing(mappings, settingValue, options.lookupModelPricing, options);
  const applied = applyCustomPricing(settingValue, {
    pricingPath: options.pricingPath,
    sidecarPath: options.sidecarPath,
    mappingPricingRevision: revision,
    mappingPricing: resolved.entries
  });
  return {
    ...applied,
    cacheHit: cached,
    mappingPricing: resolved.entries,
    unresolvedTargets: resolved.unresolvedTargets
  };
}

module.exports = {
  normalizeCustomPricingSetting,
  buildTokscaleModels,
  mappingPricingRevision,
  mappedPricingEntry,
  resolveMappedPricing,
  mergeManaged,
  applyCustomPricing,
  syncMappedPricing
};
