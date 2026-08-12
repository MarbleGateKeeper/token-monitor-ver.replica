'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.join(__dirname, '..', '..');
const read = (file) => fs.readFileSync(path.join(rootDir, file), 'utf8');
const exists = (file) => fs.existsSync(path.join(rootDir, file));
const readmeFile = 'README.md';
const retiredLocalizedReadmes = [
  'README.zh-TW.md',
  'README.zh-CN.md',
  'README.ja.md',
  'README.ko.md',
  'worker/README.zh-TW.md',
  'worker/README.zh-CN.md'
];

// The supported-tools table is what a reader can verify, so prose counts are
// checked against it rather than provider enums with implementation-only ids.
const supportedToolCounts = (text, file) => {
  const rows = text.split('\n').filter((line) => line.startsWith('| <img'));
  assert.ok(rows.length > 0, `${file}: no supported-tools rows found`);

  const counts = { tools: rows.length, usage: 0, limits: 0 };
  for (const row of rows) {
    const cells = row.split('|').map((cell) => cell.trim());
    assert.equal(cells.length, 8, `${file}: unexpected column count in row: ${row}`);
    if (cells[4] === '✅') counts.usage += 1;
    if (cells[5] === '✅') counts.limits += 1;
  }
  return counts;
};

const supportedToolNames = (text) => text
  .split('\n')
  .filter((line) => line.startsWith('| <img'))
  .map((row) => row.split('|')[2].trim());

const supportedToolIds = (text, file) => text
  .split('\n')
  .filter((line) => line.startsWith('| <img'))
  .map((row) => {
    const id = row.match(/tools-icon\/([^".]+)\.[a-z]+"/i)?.[1];
    assert.ok(id, `${file}: no tool icon id found in row: ${row}`);
    return id;
  });

const supportedToolOrder = [
  'Claude Code',
  'Codex',
  'OpenCode',
  'Hermes Agent',
  'OpenClaw',
  'Cursor',
  'Antigravity',
  'Cline',
  'Kimi CLI / Kimi Code',
  'Qwen CLI',
  'Grok Build',
  'GitHub Copilot',
  'Pi',
  'Zed',
  'Kilo Code',
  'MiMo Code',
  'ZCode / GLM',
  'Kiro',
  'CodeBuddy',
  'WorkBuddy',
  'Proma',
  'Reasonix',
  'DeepSeek',
  'OpenRouter',
  'Minimax',
  'Volcengine',
  'Qoder',
  'Ollama',
  'Third-party APIs'
];

const supportedToolIdOrder = [
  'claude',
  'codex',
  'opencode',
  'hermes-agent',
  'openclaw',
  'cursor',
  'antigravity',
  'cline',
  'kimi',
  'qwen',
  'xai',
  'copilot',
  'pi',
  'zed',
  'kilocode',
  'mimo-code',
  'zcode',
  'kiro',
  'codebuddy',
  'workbuddy',
  'proma',
  'reasonix',
  'deepseek',
  'openrouter',
  'minimax',
  'volcengine',
  'qoder',
  'ollama',
  'newapi'
];

test('configuration reference env keys all exist in .env.example', () => {
  const envKeys = (text) => {
    const block = text.match(/```env\n([\s\S]*?)```/)?.[1] || '';
    return [...block.matchAll(/^(TOKEN_MONITOR_[A-Z0-9_]+)=/gm)].map((match) => match[1]);
  };
  const docKeys = envKeys(read('docs/configuration.md'));
  assert.ok(docKeys.length > 0, 'docs/configuration.md should list env keys');

  const exampleKeys = new Set(
    [...read('.env.example').matchAll(/^(TOKEN_MONITOR_[A-Z0-9_]+)=/gm)].map((match) => match[1])
  );
  for (const key of docKeys) assert.ok(exampleKeys.has(key), `${key} missing from .env.example`);
});

test('the repository keeps one bilingual main README and no translated copies', () => {
  const readme = read(readmeFile);
  assert.match(readme, /^## 中文$/m);
  assert.match(readme, /^## English$/m);
  for (const file of retiredLocalizedReadmes) {
    assert.equal(exists(file), false, `${file} should stay removed`);
  }
  assert.doesNotMatch(read('worker/README.md'), /README\.(?:zh-CN|zh-TW|ja|ko)\.md/);
});

test('the bilingual README documents upstream identity and fork functionality', () => {
  const readme = read(readmeFile);
  assert.match(readme, /Javis603\/token-monitor/);
  assert.match(readme, /MarbleGateKeeper\/token-monitor-ver\.replica/);
  assert.match(readme, /本 fork 的功能改动/);
  assert.match(readme, /Functional changes in this fork/);
  assert.match(readme, /`k3`/);
  assert.match(readme, /`k3-256`/);
  assert.match(readme, /手动模型映射/);
  assert.match(readme, /Manual model mappings/);
  assert.match(readme, /不改写采集器原始数据/);
  assert.match(readme, /Collector output, Hub device records, and retained raw snapshots are not rewritten/);
});

test('the main README lists every supported tool in canonical order', () => {
  const readme = read(readmeFile);
  assert.deepEqual(supportedToolNames(readme), supportedToolOrder);
  assert.deepEqual(supportedToolIds(readme, readmeFile), supportedToolIdOrder);
});

test('Chinese and English README counts match the supported-tools table', () => {
  const readme = read(readmeFile);
  const counts = supportedToolCounts(readme, readmeFile);
  const claims = [
    ['Chinese tools', /工具表列出 (\d+) 种工具/, 'tools'],
    ['Chinese usage', /其中 (\d+) 种提供 token 用量/, 'usage'],
    ['Chinese limits', /(\d+) 种提供 AI 工具额度/, 'limits'],
    ['English tools', /table below lists (\d+) tools/, 'tools'],
    ['English usage', /: (\d+) provide token usage/, 'usage'],
    ['English limits', /and (\d+) provide AI Tool Limits/, 'limits']
  ];
  for (const [label, pattern, key] of claims) {
    const match = readme.match(pattern);
    assert.ok(match, `${label} claim is missing`);
    assert.equal(Number(match[1]), counts[key], `${label} should be ${counts[key]}`);
  }
});

test('the bilingual README links configuration and keeps credentials under AI Tool Limits', () => {
  const readme = read(readmeFile);
  assert.match(readme, /docs\/configuration\.md/);
  assert.match(readme, /AI 工具额度（提供方选择、额度与凭据）/);
  assert.match(readme, /AI Tool Limits \(provider selection, limits, and credentials\)/);
});

test('both README WSL explanations disclose the SQLite agent boundary', () => {
  const lines = read(readmeFile).split('\n').filter((line) => line.startsWith('- **WSL'));
  assert.equal(lines.length, 2);
  for (const line of lines) assert.match(line, /SQLite/);
  assert.match(lines[0], /docs\/wsl-sqlite-setup\.zh-CN\.md/);
  assert.match(lines[1], /docs\/wsl-sqlite-setup\.md/);
});

test('WSL SQLite guides keep English and Chinese entry points connected', () => {
  assert.match(read('docs/wsl-sqlite-setup.md'), /\[简体中文\]\(wsl-sqlite-setup\.zh-CN\.md\)/);
  assert.match(read('docs/wsl-sqlite-setup.zh-CN.md'), /\[English\]\(wsl-sqlite-setup\.md\)/);
});

test('WSL SQLite guides state and verify the Node.js prerequisite', () => {
  for (const file of ['docs/wsl-sqlite-setup.md', 'docs/wsl-sqlite-setup.zh-CN.md']) {
    const guide = read(file);
    assert.match(guide, /Node\.js 22\.13\.0/, file);
    assert.match(guide, /node --version\nnpm --version\n/, file);
  }
});

test('legacy Hermes guide keeps published links working', () => {
  assert.match(read('docs/hermes-wsl-setup.md'), /\(wsl-sqlite-setup\.zh-CN\.md\)/);
});
