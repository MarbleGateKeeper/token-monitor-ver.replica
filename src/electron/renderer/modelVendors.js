'use strict';

// Model-family ownership used by charts, model-row icons, and the appearance
// picker. Keep this renderer-only: it classifies presentation labels and never
// rewrites collector output or the Hub wire shape.
(function exposeModelVendors(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TokenMonitorModelVendors = api;
})(typeof window !== 'undefined' ? window : null, function createModelVendorsApi() {
  const LOBE_ICON_SOURCE = 'lobe-icons-1.94.0';

  function vendor(id, label, color, patterns, icon = null, iconSource = null) {
    return Object.freeze({ id, label, color, patterns: Object.freeze(patterns), icon, iconSource });
  }

  // Order is significant. Publisher-specific derivatives must win before the
  // base architecture embedded in their names (for example Llama-Nemotron and
  // Skywork-...-Llama), while broad foundation-model rules stay near the end.
  const MODEL_VENDOR_DEFINITIONS = Object.freeze([
    vendor('opencode', 'OpenCode', '#B85F00', [/^big-pickle$/], 'opencode'),
    vendor('nvidia', 'NVIDIA', '#76B900', [/(?:^|[/:_.-])(?:nvidia|nemotron)(?:$|[/:_.-])/], 'nvidia', LOBE_ICON_SOURCE),
    vendor('skywork', 'Skywork', '#4D5EFF', [/(?:^|[/:_.-])skywork(?:$|[/:_.-])/], 'skywork', LOBE_ICON_SOURCE),
    vendor('microsoft', 'Microsoft', '#00A4EF', [
      /(?:^|[/:_.-])microsoft(?:$|[/:_.-])/,
      /(?:^|[/:_.-])phi(?:[-_.]?(?:\d|mini|small|medium))(?:$|[/:_.-])/,
      /(?:^|[/:_.-])wizardlm(?:$|[/:_.-])/
    ], 'microsoft', LOBE_ICON_SOURCE),
    vendor('stepfun', 'StepFun', '#0160FF', [
      /(?:^|[/:])stepfun(?:-ai)?(?:$|[/:])/,
      /(?:^|[/:_.-])step(?:[-_.]?(?:\d|r1|router|audio|video|omni|tts|asr))(?:$|[/:_.-])/
    ], 'stepfun', LOBE_ICON_SOURCE),
    vendor('huawei', 'Huawei / Pangu', '#C7000B', [
      /(?:^|[/:])huawei(?:cloud)?(?:$|[/:])/,
      /(?:^|[/:_.-])pangu(?:$|[/:_.-])/
    ], 'huawei', LOBE_ICON_SOURCE),
    vendor('rednote', 'RedNote / dots', '#FF2442', [
      /(?:^|[/:])rednote(?:-hilab)?(?:$|[/:])/,
      /(?:^|[/:])dots/
    ]),
    vendor('baidu', 'Baidu / ERNIE', '#2932E1', [
      /(?:^|[/:_.-])baidu(?:$|[/:_.-])/,
      /(?:^|[/:_.-])ernie(?:$|[/:_.-])/,
      /(?:^|[/:_.-])cobuddy(?:$|[/:_.-])/,
      /(?:^|[/:_.-])qianfan[-_.](?:code|ocr)(?:$|[/:_.-])/
    ], 'baidu', LOBE_ICON_SOURCE),
    vendor('yi', '01.AI / Yi', '#00C853', [
      /(?:^|[/:])01-ai(?:$|[/:])/,
      /(?:^|[/:_.-])yi[-_.](?:\d|coder|lightning|vision|vl|large|medium|small)(?:$|[/:_.-])/
    ], 'yi', LOBE_ICON_SOURCE),
    vendor('baichuan', 'Baichuan', '#FF8A33', [/(?:^|[/:_.-])baichuan(?:$|\d|[/:_.-])/], 'baichuan', LOBE_ICON_SOURCE),
    vendor('internlm', 'Shanghai AI Lab / InternLM', '#858599', [/(?:^|[/:_.-])intern(?:lm|vl)(?:$|[/:_.-]?\d|[/:_.-])/], 'internlm', LOBE_ICON_SOURCE),
    vendor('openbmb', 'OpenBMB / MiniCPM', '#3B82F6', [/(?:^|[/:_.-])(?:openbmb|minicpm)(?:$|[/:_.-]?\d|[/:_.-])/]),
    vendor('inclusionai', 'InclusionAI', '#1677FF', [
      /(?:^|[/:_.-])inclusionai(?:$|[/:_.-])/,
      /(?:^|[/:_.-])(?:ling|ring)[-_.]?(?:\d|flash|coder|reasoning)(?:$|[/:_.-])/
    ]),
    vendor('kwai', 'Kuaishou / Kwai', '#FF4906', [
      /(?:^|[/:_.-])(?:kuaishou|kwaipilot|kwaikat)(?:$|[/:_.-])/,
      /(?:^|[/:_.-])kat[-_.](?:coder|dev|flash|thinking)(?:$|[/:_.-])/
    ], 'kwai', LOBE_ICON_SOURCE),
    vendor('sensenova', 'SenseNova', '#5B2AD8', [/(?:^|[/:_.-])sense(?:nova|chat)(?:$|[/:_.-])/], 'sensenova', LOBE_ICON_SOURCE),
    vendor('amazon', 'Amazon', '#FF9900', [
      /(?:^|[/:_.-])(?:amazon|aws)(?:$|[/:_.-])/,
      /(?:^|[/:_.-])nova[-_.](?:micro|lite|pro|premier|canvas|reel|sonic|omni)(?:$|[/:_.-])/,
      /(?:^|[/:_.-])titan[-_.](?:text|embed|image|multimodal)(?:$|[/:_.-])/
    ], 'amazon', LOBE_ICON_SOURCE),
    vendor('ibm', 'IBM / Granite', '#0F62FE', [
      /(?:^|[/:_.-])ibm(?:$|[/:_.-])/,
      /(?:^|[/:_.-])granite(?:$|[/:_.-])/
    ], 'ibm', LOBE_ICON_SOURCE),
    vendor('perplexity', 'Perplexity', '#22B8CD', [
      /(?:^|[/:_.-])perplexity(?:$|[/:_.-])/,
      /(?:^|[/:_.-])sonar(?:$|[-_.](?:pro|reasoning|deep-research|small|medium|large|online))/,
      /(?:^|[/:_.-])pplx[-_.]\d/
    ], 'perplexity', LOBE_ICON_SOURCE),
    vendor('poolside', 'Poolside', '#4137FF', [
      /(?:^|[/:_.-])poolside(?:$|[/:_.-])/,
      /(?:^|[/:_.-])laguna[-_.](?:m|mini|xs|instruct|base|\d)(?:$|[/:_.-])/
    ], 'poolside', LOBE_ICON_SOURCE),
    vendor('arcee', 'Arcee AI', '#008C8C', [
      /(?:^|[/:])arcee(?:-ai)?(?:$|[/:])/,
      /(?:^|[/:_.-])afm[-_.]\d/,
      /(?:^|[/:_.-])trinity[-_.](?:large|mini|nano|small|preview)(?:$|[/:_.-])/
    ], 'arcee', LOBE_ICON_SOURCE),
    vendor('inception', 'Inception', '#7C3AED', [
      /(?:^|[/:_.-])inception(?:$|[/:_.-])/,
      /(?:^|[/:_.-])mercury[-_.](?:coder|2|small|mini|diffusion)(?:$|[/:_.-])/
    ], 'inception', LOBE_ICON_SOURCE),
    vendor('ai21', 'AI21 Labs', '#E85D75', [
      /(?:^|[/:_.-])ai21(?:$|[/:_.-])/,
      /(?:^|[/:_.-])jamba(?:$|[/:_.-])/
    ], 'ai21', LOBE_ICON_SOURCE),
    vendor('allenai', 'Ai2 / AllenAI', '#F0529C', [
      /(?:^|[/:_.-])(?:allenai|ai2)(?:$|[/:_.-])/,
      /(?:^|[/:_.-])(?:olmo|molmo|t[uü]lu)(?:$|[/:_.-])/
    ], 'allenai', LOBE_ICON_SOURCE),
    vendor('liquid', 'Liquid AI', '#7C3AED', [
      /(?:^|[/:])liquid(?:-ai)?(?:$|[/:])/,
      /(?:^|[/:_.-])lfm(?:2)?(?:$|[-_.]\d)/
    ], 'liquid', LOBE_ICON_SOURCE),
    vendor('hermes', 'Hermes Agent', '#d4af37', [/(?:^|[/:_.-])(?:nousresearch|nous-hermes|hermes)(?:$|[/:_.-])/], 'hermes'),
    vendor('deepseek', 'DeepSeek', '#4d6bfe', [/deepseek/], 'deepseek'),
    vendor('meituan', 'Meituan', '#FFD100', [/(?:^|[/:_.-])(?:meituan|longcat)(?:$|[/:_.-])/], 'meituan'),
    vendor('kimi', 'Kimi', '#1783FF', [/kimi|moonshot/, /^k3(?:-256)?$/], 'kimi'),
    vendor('hunyuan', 'Hunyuan', '#0053E0', [/hy3|hunyuan/], 'hunyuan'),
    vendor('zai', 'GLM', '#3859FF', [/chatglm|\bglm-|\bzai\b|z\.ai|zhipu/], 'zai'),
    vendor('cohere', 'Cohere', '#39594d', [
      /cohere|command-(?:r|a)(?:$|[/:_.-])/,
      /(?:^|[/:_.-])aya[-_.](?:23|expanse|vision|command)(?:$|[/:_.-])/
    ], 'cohere'),
    vendor('xiaomi', 'Xiaomi', '#ff6700', [/mimo|xiaomi/], 'xiaomi'),
    vendor('minimax', 'MiniMax', '#f23f5d', [/minimax|\babab/], 'minimax'),
    vendor('doubao', 'Doubao', '#1E37FC', [/doubao|\bseed(?:-|$)/], 'doubao'),
    vendor('cursor', 'Cursor', '#000000', [/^(?:cursor-)?auto$/], 'cursor'),
    vendor('claude', 'Claude Code', '#cc7c5e', [/claude|anthropic|sonnet|opus|haiku/], 'claude'),
    vendor('codex', 'Codex', '#007CCB', [/gpt|openai|codex|^o[134](?:-|$)|o[134]-(?:mini|pro|preview)|chatgpt/], 'codex'),
    vendor('gemini', 'Gemini', '#4285f4', [/gemini|gemma|google/], 'gemini'),
    vendor('xai', 'xAI', '#64748B', [/grok|xai/], 'xai'),
    vendor('meta', 'Meta', '#1d65c1', [/llama|meta/], 'meta'),
    vendor('mistral', 'Mistral', '#fa520f', [/mistral|mixtral|codestral/], 'mistral'),
    vendor('qwen', 'Qwen', '#615ced', [/qwen|qwq|qvq/], 'qwen')
  ]);

  const MODEL_VENDOR_ORDER = Object.freeze(MODEL_VENDOR_DEFINITIONS.map((item) => item.id));
  const MODEL_VENDOR_LABELS = Object.freeze(Object.fromEntries(MODEL_VENDOR_DEFINITIONS.map((item) => [item.id, item.label])));
  const MODEL_VENDOR_COLORS = Object.freeze(Object.fromEntries(MODEL_VENDOR_DEFINITIONS.map((item) => [item.id, item.color])));
  const MODEL_VENDOR_ICON_IDS = Object.freeze(MODEL_VENDOR_DEFINITIONS.filter((item) => item.icon).map((item) => item.id));

  function modelVendorDefinitionFor(model) {
    const name = String(model || '').trim().toLowerCase();
    if (!name) return null;
    return MODEL_VENDOR_DEFINITIONS.find((item) => item.patterns.some((pattern) => pattern.test(name))) || null;
  }

  function modelVendorFor(model) {
    return modelVendorDefinitionFor(model)?.id || null;
  }

  return {
    LOBE_ICON_SOURCE,
    MODEL_VENDOR_DEFINITIONS,
    MODEL_VENDOR_ORDER,
    MODEL_VENDOR_LABELS,
    MODEL_VENDOR_COLORS,
    MODEL_VENDOR_ICON_IDS,
    modelVendorDefinitionFor,
    modelVendorFor
  };
});
