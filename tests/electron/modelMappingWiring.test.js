'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..', '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('model alias settings expose an editable source-to-target form', () => {
  const html = read('src/electron/renderer/index.html');
  assert.match(html, /id="modelMappingAccountGroup"[\s\S]*id="modelMappingSettingsToggle"/);
  assert.match(html, /id="modelMappingSourceInput"[\s\S]*id="modelMappingTargetInput"/);
  assert.match(html, /<script src="\.\.\/\.\.\/shared\/modelMappings\.js"><\/script>/);

  const app = read('src/electron/renderer/app.js');
  assert.match(app, /const modelMappingsApi = window\.TokenMonitorModelMappings;/);
  assert.match(app, /saveSettings\(\{ modelMappings: next \}\)/);
  assert.match(app, /validateModelMapping\(state\.settings\?\.modelMappings, entry, editingSource\)/);
  assert.match(app, /setupModelMappingUI\(\);/);
});

test('main process persists aliases, maps display data, and prices sources through canonical targets', () => {
  const main = read('src/electron/main.js');
  assert.match(main, /modelMappings: \[\]/);
  assert.match(main, /merged\.modelMappings = normalizeModelMappings\(merged\.modelMappings\)/);
  assert.match(main, /modelMappings: patch\.modelMappings !== undefined[\s\S]*normalizeModelMappings\(settings\.modelMappings\)/);
  assert.match(main, /applyModelMappingsToStats\(stats, mappings\)/);
  assert.match(main, /applyModelMappingsToHistory\(history, settings\?\.modelMappings\)/);
  assert.match(main, /syncMappedPricing\(customModelPricing, modelMappings, \{/);
  assert.match(main, /ensureSettingsLoaded\(\);\s*await regenerateTokscalePricing\(\);[\s\S]*createWindow\(\);[\s\S]*startMode\(\);/);
  assert.match(main, /customModelPricingChanged \|\| modelMappingsChanged[\s\S]*regenerateTokscalePricing\(\)\.then\(refreshAfterPricingChange\)/);
  assert.match(main, /refreshAfterModelMappingChange\(\)/);

  const pricing = read('src/shared/tokscaleCustomPricing.js');
  assert.doesNotMatch(pricing, /sessionUsageArchive|clientUsageArchive/);

  const previewBuilder = main.match(/function withHistoryPreview\(stats, devices\) \{([\s\S]*?)\n\}/)?.[1] || '';
  assert.doesNotMatch(previewBuilder, /applyModelMappings/, 'the retained stats snapshot must stay raw so removing an alias is reversible');
});
