'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  LOBE_ICON_SOURCE,
  MODEL_VENDOR_DEFINITIONS,
  MODEL_VENDOR_ORDER,
  MODEL_VENDOR_LABELS,
  MODEL_VENDOR_COLORS,
  MODEL_VENDOR_ICON_IDS,
  modelVendorFor
} = require('../../src/electron/renderer/modelVendors');
const { clientColors, modelColor } = require('../../src/electron/renderer/usageCharts');
const { VENDOR_ORDER, VENDOR_LABELS } = require('../../src/electron/renderer/themePresets');

const ROOT = path.join(__dirname, '..', '..');

test('curated model families match bare and publisher-scoped ids', () => {
  const cases = {
    stepfun: ['STEP-3.5-Flash', 'stepfun-ai/Step-R1-V-Mini'],
    nvidia: ['Llama-3.1-Nemotron-Ultra-253B-v1', 'nvidia/Nemotron-3-Super'],
    huawei: ['pangu-nlp-n2-reasoner-32k', 'HuaweiCloud/Pangu-Pro-MoE'],
    rednote: ['dots.llm1.inst', 'rednote-hilab/dots.vlm1.inst'],
    baidu: ['ERNIE-4.5-300B-A47B', 'baidu/Qianfan-Code-Latest'],
    yi: ['Yi-1.5-34B-Chat', '01-ai/Yi-Coder-9B-Chat'],
    baichuan: ['Baichuan2-13B-Chat', 'baichuan-inc/Baichuan-M2-32B'],
    internlm: ['InternVL3-78B', 'internlm/InternLM3-8B-Instruct'],
    openbmb: ['MiniCPM-V-4_5', 'openbmb/MiniCPM3-4B'],
    inclusionai: ['Ling-2.6-1T', 'inclusionAI/Ring-1T'],
    kwai: ['KAT-Coder-Pro-V1', 'Kwaipilot/KAT-Coder-Air-V1'],
    skywork: ['Skywork-OR1-32B', 'Skywork/Skywork-Reward-Llama-3.1-8B'],
    sensenova: ['SenseChat-5', 'sensenova/SenseNova-V6-5-Pro'],
    microsoft: ['Phi-4-mini-instruct', 'microsoft/WizardLM-2-8x22B'],
    amazon: ['Nova-Micro', 'amazon/Titan-Text-Express-v1'],
    ibm: ['Granite-3.3-8B-Instruct', 'ibm/Granite-4.1-Micro'],
    perplexity: ['Sonar-Pro', 'perplexity/sonar-deep-research'],
    poolside: ['Laguna-XS-2.1', 'poolside/Laguna-M.1'],
    arcee: ['Trinity-Large-Preview', 'arcee-ai/AFM-4.5B'],
    inception: ['Mercury-Coder-Small', 'inception/Mercury-2'],
    ai21: ['Jamba-1.5-Large', 'ai21/Jamba-Mini-1.7'],
    allenai: ['OLMo-2-32B-Instruct', 'allenai/Tulu-3.1-8B'],
    liquid: ['LFM2-24B-A2B', 'liquid-ai/LFM-7B']
  };

  for (const [vendor, modelIds] of Object.entries(cases)) {
    for (const modelId of modelIds) {
      assert.equal(modelVendorFor(modelId), vendor, `${modelId} should map to ${vendor}`);
    }
  }
});

test('existing families retain their mappings and expanded aliases', () => {
  const cases = {
    kimi: ['kimi-k3', 'k3', 'k3-256', 'moonshot-v1-128k'],
    meituan: ['LongCat-Flash-Chat', 'meituan-longcat/LongCat-2.0'],
    hunyuan: ['hy3-fp8', 'Tencent-Hunyuan/Hy3'],
    cohere: ['Command-A-03-2025', 'cohere/Aya-Expanse-32B'],
    hermes: ['Nous-Hermes-3-Llama-3.1-70B', 'NousResearch/Hermes-4-70B']
  };

  for (const [vendor, modelIds] of Object.entries(cases)) {
    for (const modelId of modelIds) assert.equal(modelVendorFor(modelId), vendor, modelId);
  }
});

test('publisher-specific derivatives win over their base architecture', () => {
  assert.equal(modelVendorFor('nvidia/Llama-3.1-Nemotron-70B-Instruct'), 'nvidia');
  assert.equal(modelVendorFor('Skywork/Skywork-OR1-Llama-3.1-70B'), 'skywork');
  assert.equal(modelVendorFor('inclusionAI/Ling-2.6-Qwen3-1T'), 'inclusionai');
  assert.equal(modelVendorFor('Kwaipilot/KAT-Coder-Pro-Qwen3'), 'kwai');
  assert.equal(modelVendorFor('DeepSeek-R1-Distill-Qwen-32B'), 'deepseek');
});

test('short or ordinary words do not create accidental vendor matches', () => {
  for (const modelId of [
    'nextstep', 'step-by-step', 'polkadot', 'ringtone', 'linguist',
    'nova', 'mercury', 'longcaterpillar', 'holiday-dots', 'yi'
  ]) {
    assert.equal(modelVendorFor(modelId), null, modelId);
  }
});

test('model vendor registry is internally complete and ordered once', () => {
  const ids = MODEL_VENDOR_DEFINITIONS.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, 'vendor ids must be unique');
  assert.deepEqual(MODEL_VENDOR_ORDER, ids);
  assert.deepEqual(MODEL_VENDOR_ICON_IDS, MODEL_VENDOR_DEFINITIONS.filter((item) => item.icon).map((item) => item.id));

  for (const item of MODEL_VENDOR_DEFINITIONS) {
    assert.ok(item.label, `${item.id} needs a label`);
    assert.match(item.color, /^#[0-9a-f]{6}$/i, `${item.id} needs a six-digit hex color`);
    assert.equal(MODEL_VENDOR_LABELS[item.id], item.label);
    assert.equal(MODEL_VENDOR_COLORS[item.id], item.color);
    assert.ok(item.patterns.length > 0, `${item.id} needs at least one matcher`);
  }
});

test('charts and appearance settings consume every registry color and label', () => {
  for (const item of MODEL_VENDOR_DEFINITIONS) {
    assert.equal(clientColors[item.id], item.color, `${item.id} color did not reach charts`);
    assert.equal(VENDOR_LABELS[item.id], item.label, `${item.id} label did not reach settings`);
    assert.equal(VENDOR_ORDER.filter((id) => id === item.id).length, 1, `${item.id} must appear once in settings`);
  }
  assert.equal(modelColor('step-3.5-flash'), clientColors.stepfun);
  assert.equal(modelColor('llama-3.1-nemotron-ultra'), clientColors.nvidia);
});

test('pinned Lobe model-vendor icons have an asset, CSS mask, and notice', () => {
  const css = fs.readFileSync(path.join(ROOT, 'src/electron/renderer/styles.css'), 'utf8');
  const notice = fs.readFileSync(path.join(ROOT, 'assets/icons/THIRD_PARTY_NOTICES.md'), 'utf8');
  assert.match(notice, /@lobehub\/icons-static-svg` 1\.94\.0/);

  for (const item of MODEL_VENDOR_DEFINITIONS.filter((entry) => entry.iconSource === LOBE_ICON_SOURCE)) {
    const assetName = `${item.icon}.svg`;
    assert.equal(fs.existsSync(path.join(ROOT, 'assets/icons', assetName)), true, `${assetName} is missing`);
    assert.match(css, new RegExp(`\\.row-icon-${item.id}\\s*\\{[^}]*assets/icons/${assetName}`), `${item.id} CSS mask is missing`);
    assert.ok(notice.includes(`\`${assetName}\``), `${assetName} is absent from the notice`);
  }
});

test('renderer entry points load the vendor registry before its consumers', () => {
  for (const file of ['index.html', 'dashboard.html']) {
    const html = fs.readFileSync(path.join(ROOT, 'src/electron/renderer', file), 'utf8');
    const registry = html.indexOf('src="modelVendors.js"');
    assert.ok(registry >= 0, `${file} must load modelVendors.js`);
    assert.ok(registry < html.indexOf('src="usageCharts.js"'), `${file} must load the registry before usageCharts.js`);
    assert.ok(registry < html.indexOf('src="themePresets.js"'), `${file} must load the registry before themePresets.js`);
  }

  const app = fs.readFileSync(path.join(ROOT, 'src/electron/renderer/app.js'), 'utf8');
  assert.match(app, /TokenMonitorModelVendors\?\.MODEL_VENDOR_ICON_IDS/);
});
