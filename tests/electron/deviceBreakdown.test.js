'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const {
  clientModelRowsForPeriod,
  deviceBreakdownForPeriod,
  devicePlatformLabel
} = require('../../src/electron/renderer/deviceBreakdown');

test('clientModelRowsForPeriod returns every positive model in stable usage order', () => {
  const period = {
    clientModels: {
      codex: {
        zeta: 25,
        alpha: 25,
        biggest: 50,
        zero: 0,
        negative: -10
      }
    }
  };

  assert.deepEqual(clientModelRowsForPeriod(period, 'codex'), [
    { key: 'biggest', name: 'biggest', value: 50 },
    { key: 'alpha', name: 'alpha', value: 25 },
    { key: 'zeta', name: 'zeta', value: 25 }
  ]);
  assert.deepEqual(clientModelRowsForPeriod(period, 'missing'), []);
  assert.deepEqual(clientModelRowsForPeriod(null, 'codex'), []);
});

test('deviceBreakdownForPeriod nests sorted models under each tool', () => {
  const result = deviceBreakdownForPeriod({ periods: { month: {
    totalTokens: 1000,
    clients: { claude: 300, codex: 700 },
    clientCosts: { claude: 1.5, codex: 4 },
    clientModels: {
      claude: { 'claude-opus': 100, 'claude-sonnet': 200 },
      codex: { 'gpt-5.4': 500, 'gpt-5.3-codex': 200 }
    },
    clientModelCosts: {
      claude: { 'claude-opus': 1, 'claude-sonnet': 0.5 },
      codex: { 'gpt-5.4': 3, 'gpt-5.3-codex': 1 }
    }
  } } }, 'month', {
    clientLabels: { claude: 'Claude Code', codex: 'Codex' },
    clientColors: { claude: '#cc7755', codex: '#00aabb' }
  });

  assert.equal(result.totalTokens, 1000);
  assert.deepEqual(result.tools.map(({ key, value, percent, color }) => ({ key, value, percent, color })), [
    { key: 'codex', value: 700, percent: 70, color: '#00aabb' },
    { key: 'claude', value: 300, percent: 30, color: '#cc7755' }
  ]);
  assert.deepEqual(result.tools[0].models, [
    { key: 'gpt-5.4', name: 'gpt-5.4', value: 500 },
    { key: 'gpt-5.3-codex', name: 'gpt-5.3-codex', value: 200 }
  ]);
});

test('deviceBreakdownForPeriod tolerates shared models and legacy device records', () => {
  const result = deviceBreakdownForPeriod({ periods: { today: {
    totalTokens: 75,
    clients: { codex: 50, opencode: 25 },
    clientModels: { codex: { shared: 50 }, opencode: { shared: 25 } }
  } } }, 'today');

  assert.equal(result.tools.length, 2);
  assert.equal(result.tools[0].color, '#73bdf5');
  assert.deepEqual(deviceBreakdownForPeriod({ periods: { today: { totalTokens: 20 } } }, 'today', {
    unattributedLabel: '未分類'
  }), {
    totalTokens: 20,
    tools: [{
      key: '__unattributed',
      client: '__unattributed',
      name: '未分類',
      value: 20,
      percent: 100,
      color: '#73bdf5',
      models: []
    }]
  });
});

test('devicePlatformLabel appends OS versions without exposing architecture', () => {
  assert.equal(devicePlatformLabel('darwin-arm64', 'macOS', '26.0'), 'macOS 26.0');
  assert.equal(devicePlatformLabel('win32-x64', 'Windows 11', '24H2'), 'Windows 11 24H2');
  assert.equal(devicePlatformLabel('linux-x64', 'Ubuntu', '24.04.2 LTS'), 'Ubuntu 24.04.2 LTS');
  assert.equal(devicePlatformLabel('linux-x64', '', ''), 'Linux');
});

test('device breakdown browser helper loads before app.js and keeps reduced-motion coverage', () => {
  const rendererDir = path.join(__dirname, '..', '..', 'src', 'electron', 'renderer');
  const html = fs.readFileSync(path.join(rendererDir, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(rendererDir, 'styles.css'), 'utf8');
  const app = fs.readFileSync(path.join(rendererDir, 'app.js'), 'utf8');
  assert.ok(html.indexOf('<script src="deviceBreakdown.js"></script>') < html.indexOf('<script src="app.js"></script>'));
  assert.match(css, /\.device-model-list \{/);
  assert.match(css, /\.device-model-row \{[\s\S]*justify-content: space-between;/);
  assert.match(css, /\.tool-model-list \{[\s\S]*display: grid;/);
  assert.match(css, /\.tool-model-name \{[\s\S]*text-overflow: ellipsis;/);
  assert.match(css, /\.tool-model-value \{[\s\S]*font-variant-numeric: tabular-nums;/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.row-accordion/);
  assert.match(app, /const signature = JSON\.stringify\(\[\s*toolIconsEnabled\(state\.settings\?\.showToolIcons\),/);
  assert.match(app, /deviceDetail: \{[\s\S]*emptyText: breakdown\.totalTokens > 0 \? t\('devices\.detailsUnavailable'\) : t\('home\.noTools'\)/);
  assert.match(app, /toolModels: deviceBreakdownApi\.clientModelRowsForPeriod\(period, client\)/);
  assert.match(app, /const existing = new Map\(Array\.from\(list\.children\)/, 'tool model rows are reconciled by model id');
  assert.match(app, /const modelSummary = Array\.isArray\(toolModels\)/, 'button rows expose their nested model totals to assistive technology');
  assert.doesNotMatch(app, /deviceDetail: breakdown\.totalTokens > 0 \?/);
});
