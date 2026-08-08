'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  applyModelMappingsToHistory,
  applyModelMappingsToPeriod,
  applyModelMappingsToStats,
  inUseModelIds,
  normalizeModelMappings,
  removeModelMapping,
  upsertModelMapping,
  validateModelMapping
} = require('../../src/shared/modelMappings');

test('normalizeModelMappings canonicalizes ids and keeps the last source rule', () => {
  assert.deepEqual(normalizeModelMappings([
    { source: ' K3 ', target: ' Kimi-K3 ' },
    { from: 'k3-256', to: 'KIMI-K3' },
    { source: 'k3', target: 'kimi-k3-latest' },
    { source: 'same', target: ' SAME ' },
    { source: '', target: 'missing' }
  ]), [
    { source: 'k3', target: 'kimi-k3-latest' },
    { source: 'k3-256', target: 'kimi-k3' }
  ]);
});

test('mapping editor helpers reject duplicates and loops without mutating input', () => {
  const original = [
    { source: 'k3', target: 'kimi-k3' },
    { source: 'kimi-k3', target: 'moonshot-k3' }
  ];
  assert.equal(validateModelMapping(original, { source: '', target: 'x' }), 'missing');
  assert.equal(validateModelMapping(original, { source: 'x', target: 'X' }), 'same');
  assert.equal(validateModelMapping(original, { source: 'k3', target: 'x' }), 'duplicate');
  assert.equal(validateModelMapping(original, { source: 'moonshot-k3', target: 'k3' }), 'cycle');
  assert.equal(validateModelMapping(original, { source: 'k3-256', target: 'k3' }), null);

  const replaced = upsertModelMapping(original, { source: 'k3-direct', target: 'moonshot-k3' }, 'k3');
  assert.deepEqual(replaced, [
    { source: 'kimi-k3', target: 'moonshot-k3' },
    { source: 'k3-direct', target: 'moonshot-k3' }
  ]);
  assert.deepEqual(removeModelMapping(replaced, 'K3-DIRECT'), [
    { source: 'kimi-k3', target: 'moonshot-k3' }
  ]);
  assert.equal(original[0].source, 'k3');
});

test('applyModelMappingsToPeriod combines every model-keyed token and cost map', () => {
  const period = {
    totalTokens: 35,
    models: { k3: 10, 'k3-256': 20, 'kimi-k3': 5 },
    modelCosts: { k3: 0.1, 'k3-256': 0.2, 'kimi-k3': 0.05 },
    modelCacheReads: { k3: 4, 'k3-256': 8, 'kimi-k3': 2 },
    modelCacheWrites: { k3: 1, 'k3-256': 2, 'kimi-k3': 1 },
    modelOutputs: { k3: 3, 'k3-256': 6, 'kimi-k3': 1 },
    clientModels: { kimi: { k3: 10, 'k3-256': 20, 'kimi-k3': 5 } },
    clientModelCosts: { kimi: { k3: 0.1, 'k3-256': 0.2, 'kimi-k3': 0.05 } },
    sessions: {
      'kimi:one': {
        models: { k3: 2, 'k3-256': 3 },
        modelCosts: { k3: 0.02, 'k3-256': 0.03 }
      }
    }
  };
  const mappings = [
    { source: 'k3', target: 'kimi-k3' },
    { source: 'k3-256', target: 'kimi-k3' }
  ];
  const mapped = applyModelMappingsToPeriod(period, mappings);

  assert.equal(mapped.totalTokens, 35);
  assert.deepEqual(mapped.models, { 'kimi-k3': 35 });
  assert.deepEqual(mapped.modelCosts, { 'kimi-k3': 0.35000000000000003 });
  assert.deepEqual(mapped.modelCacheReads, { 'kimi-k3': 14 });
  assert.deepEqual(mapped.modelCacheWrites, { 'kimi-k3': 4 });
  assert.deepEqual(mapped.modelOutputs, { 'kimi-k3': 10 });
  assert.deepEqual(mapped.clientModels, { kimi: { 'kimi-k3': 35 } });
  assert.deepEqual(mapped.clientModelCosts, { kimi: { 'kimi-k3': 0.35000000000000003 } });
  assert.deepEqual(mapped.sessions['kimi:one'].models, { 'kimi-k3': 5 });
  assert.deepEqual(mapped.sessions['kimi:one'].modelCosts, { 'kimi-k3': 0.05 });
  assert.deepEqual(period.models, { k3: 10, 'k3-256': 20, 'kimi-k3': 5 });
});

test('applyModelMappingsToStats maps aggregate, device, and all-time session views', () => {
  const stats = {
    periods: { today: { models: { alias: 4, canonical: 6 } } },
    devices: [{ deviceId: 'one', periods: { today: { models: { alias: 4 } } } }],
    allTimeSessionsView: {
      'kimi:one': { models: { alias: 4 }, modelCosts: { alias: 0.4 } }
    }
  };
  const mapped = applyModelMappingsToStats(stats, [{ source: 'alias', target: 'canonical' }]);
  assert.deepEqual(mapped.periods.today.models, { canonical: 10 });
  assert.deepEqual(mapped.devices[0].periods.today.models, { canonical: 4 });
  assert.deepEqual(mapped.allTimeSessionsView['kimi:one'].models, { canonical: 4 });
  assert.deepEqual(mapped.allTimeSessionsView['kimi:one'].modelCosts, { canonical: 0.4 });
  assert.deepEqual(stats.periods.today.models, { alias: 4, canonical: 6 });
});

test('applyModelMappingsToHistory combines stacks and recomputes the favorite model', () => {
  const history = {
    daily: [
      { date: '2026-08-01', perModel: { k3: { tokens: 6, cost: 0.1 }, other: { tokens: 10, cost: 0.2 } } },
      { date: '2026-08-02', perModel: { 'k3-256': { tokens: 6, cost: 0.1 } } }
    ],
    monthly: [
      { month: '2026-08', perModel: { k3: { tokens: 6, cost: 0.1 }, 'k3-256': { tokens: 6, cost: 0.1 }, other: { tokens: 10, cost: 0.2 } } }
    ],
    summary: { favoriteModel: 'other' }
  };
  const mapped = applyModelMappingsToHistory(history, [
    { source: 'k3', target: 'kimi-k3' },
    { source: 'k3-256', target: 'kimi-k3' }
  ]);
  assert.deepEqual(mapped.monthly[0].perModel['kimi-k3'], { tokens: 12, cost: 0.2 });
  assert.equal(mapped.summary.favoriteModel, 'kimi-k3');
  assert.equal(history.summary.favoriteModel, 'other');
});

test('mapping chains resolve to their final target while invalid cycles stay inert', () => {
  assert.deepEqual(applyModelMappingsToPeriod({ models: { a: 2, b: 3, c: 4 } }, [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' }
  ]).models, { c: 9 });
  assert.deepEqual(applyModelMappingsToPeriod({ models: { a: 2, b: 3 } }, [
    { source: 'a', target: 'b' },
    { source: 'b', target: 'a' }
  ]).models, { a: 2, b: 3 });
});

test('inUseModelIds returns the sorted union of displayed periods', () => {
  assert.deepEqual(inUseModelIds({ periods: {
    today: { models: { k3: 1 } },
    month: { models: { 'kimi-k3': 2, k3: 3 } }
  } }), ['k3', 'kimi-k3']);
});
