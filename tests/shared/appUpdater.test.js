'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const {
  checkLatestRelease,
  checkLatestUpstreamRelease,
  classifyAppUpdateError,
  deriveAppUpdateAvailability,
  deriveUpstreamUpdateAvailability,
  extractReleaseNotes,
  forkReleaseIsNewer,
  isReplicaReleaseVersion,
  mergeLatestReleaseMetadata,
  parseLatestReleasePayload,
  parseTag,
  replicaVersionInfo,
  RELEASES_LATEST_URL,
  resolveAppUpdateCheckError,
  shouldSkipAppUpdateCheck,
  shouldSkipUpstreamUpdateCheck,
  trackedUpstreamVersion,
  UPSTREAM_RELEASES_LATEST_URL
} = require('../../src/shared/appUpdater');

const trailingPullRequestReference = /(?:\(\s*#\d+(?:\s*,\s*#\d+)*\s*\)|（\s*#\d+(?:\s*[、，,]\s*#\d+)*\s*）)$/;

test('fork and upstream checks use their public GitHub release pages', () => {
  assert.equal(RELEASES_LATEST_URL, 'https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/latest');
  assert.equal(UPSTREAM_RELEASES_LATEST_URL, 'https://github.com/Javis603/token-monitor/releases/latest');
});

test('source-mode release checks negotiate public release JSON without authentication', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    assert.equal(url, RELEASES_LATEST_URL);
    assert.equal(options.headers.accept, 'application/json');
    assert.equal(Object.hasOwn(options.headers, 'authorization'), false);
    return { ok: true, json: async () => ({ tag_name: 'v0.40.0-replica.2' }) };
  };
  try {
    const result = await checkLatestRelease('0.40.0-replica.1');
    assert.equal(result.ok, true);
    assert.equal(result.newer, true);
    assert.equal(result.latest.version, '0.40.0-replica.2');
  } finally {
    global.fetch = originalFetch;
  }
});

test('fork checks ignore plain upstream-style releases on the fork repository', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, json: async () => ({ tag_name: 'v0.42.0' }) });
  try {
    const result = await checkLatestRelease('0.42.0-replica.1');
    assert.equal(result.ok, true);
    assert.equal(result.newer, false);
    assert.equal(result.latest, null);
    assert.equal(result.ignoredLatest.version, '0.42.0');
  } finally {
    global.fetch = originalFetch;
  }
});

test('upstream checks compare against the highest fork base and use the upstream release URL', async () => {
  const originalFetch = global.fetch;
  global.fetch = async (url) => {
    assert.equal(url, UPSTREAM_RELEASES_LATEST_URL);
    return { ok: true, json: async () => ({ tag_name: 'v0.43.0' }) };
  };
  try {
    const result = await checkLatestUpstreamRelease(
      '0.41.0-replica.3',
      { version: '0.42.0-replica.2' }
    );
    assert.equal(result.ok, true);
    assert.equal(result.trackedVersion, '0.42.0');
    assert.equal(result.newer, true);
    assert.equal(result.latest.htmlUrl, 'https://github.com/Javis603/token-monitor/releases/tag/v0.43.0');
  } finally {
    global.fetch = originalFetch;
  }
});

test('source-mode release checks classify public endpoint throttling', async () => {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: false, status: 429 });
  try {
    const result = await checkLatestRelease('0.39.0');
    assert.equal(result.ok, false);
    assert.equal(result.errorKind, 'rateLimited');
  } finally {
    global.fetch = originalFetch;
  }
});

test('parseTag strips a leading v from valid semver tags', () => {
  assert.equal(parseTag('v1.2.3'), '1.2.3');
  assert.equal(parseTag('V0.1.0'), '0.1.0');
});

test('parseTag accepts tags without a v prefix', () => {
  assert.equal(parseTag('1.2.3'), '1.2.3');
});

test('parseTag returns null for invalid or empty input', () => {
  assert.equal(parseTag(''), null);
  assert.equal(parseTag(null), null);
  assert.equal(parseTag(undefined), null);
  assert.equal(parseTag('release-foo'), null);
  assert.equal(parseTag('v1.2'), null);
  assert.equal(parseTag(123), null);
});

test('replica versions compare revisions without letting a plain base outrank them', () => {
  assert.deepEqual(replicaVersionInfo('v0.42.0-replica.2'), {
    version: '0.42.0-replica.2',
    baseVersion: '0.42.0',
    revision: 2
  });
  assert.equal(isReplicaReleaseVersion('0.42.0-replica.1'), true);
  assert.equal(isReplicaReleaseVersion('0.42.0'), false);
  assert.equal(isReplicaReleaseVersion('0.42.0-replica.0'), false);
  assert.equal(forkReleaseIsNewer('0.42.0', '0.42.0-replica.1'), false);
  assert.equal(forkReleaseIsNewer('0.42.0-replica.2', '0.42.0-replica.1'), true);
  assert.equal(forkReleaseIsNewer('0.42.0-replica.1', '0.42.0-replica.2'), false);
  assert.equal(forkReleaseIsNewer('0.43.0-replica.1', '0.42.0-replica.9'), true);
});

test('upstream tracking uses the higher base from the installed and latest fork versions', () => {
  assert.equal(trackedUpstreamVersion('0.42.0-replica.1', null), '0.42.0');
  assert.equal(trackedUpstreamVersion('0.42.0-replica.1', { version: '0.43.0-replica.1' }), '0.43.0');
  assert.equal(trackedUpstreamVersion('0.44.0-replica.1', { version: '0.43.0-replica.9' }), '0.44.0');
});

test('shouldSkipAppUpdateCheck refreshes cached update prompts sooner than the normal cooldown', () => {
  const nowMs = Date.parse('2026-07-02T18:30:00Z');
  const twoHoursAgo = '2026-07-02T16:30:00Z';
  const tenMinutesAgo = '2026-07-02T18:20:00Z';
  const latest = { version: '0.18.0-replica.1' };

  assert.equal(shouldSkipAppUpdateCheck({
    currentVersion: '0.17.0-replica.1',
    latest,
    lastCheckedAt: twoHoursAgo,
    nowMs
  }), false);

  assert.equal(shouldSkipAppUpdateCheck({
    currentVersion: '0.17.0-replica.1',
    latest,
    lastCheckedAt: tenMinutesAgo,
    nowMs
  }), true);
});

test('shouldSkipAppUpdateCheck uses normal cooldown for dismissed cached updates', () => {
  const nowMs = Date.parse('2026-07-02T18:30:00Z');
  const twoHoursAgo = '2026-07-02T16:30:00Z';

  assert.equal(shouldSkipAppUpdateCheck({
    currentVersion: '0.17.0-replica.1',
    latest: { version: '0.18.0-replica.1' },
    dismissedVersion: '0.18.0-replica.1',
    lastCheckedAt: twoHoursAgo,
    nowMs
  }), true);
});

test('deriveAppUpdateAvailability keeps availability separate from notification dismissal', () => {
  assert.deepEqual(deriveAppUpdateAvailability({
    currentVersion: '0.28.0-replica.1',
    latest: { version: '0.28.0-replica.2' },
    dismissedVersion: '0.28.0-replica.2'
  }), {
    hasUpdate: true,
    dismissed: true,
    showUpdateNotice: false
  });
});

test('upstream availability is independent from replica revision ordering', () => {
  assert.deepEqual(deriveUpstreamUpdateAvailability({
    currentVersion: '0.42.0-replica.1',
    latestForkRelease: { version: '0.42.0-replica.2' },
    latest: { version: '0.42.0' }
  }), {
    trackedVersion: '0.42.0',
    hasUpdate: false,
    dismissed: false,
    showUpdateNotice: false
  });
  assert.deepEqual(deriveUpstreamUpdateAvailability({
    currentVersion: '0.42.0-replica.1',
    latestForkRelease: { version: '0.42.0-replica.2' },
    latest: { version: '0.43.0' },
    dismissedVersion: '0.43.0'
  }), {
    trackedVersion: '0.42.0',
    hasUpdate: true,
    dismissed: true,
    showUpdateNotice: false
  });
  assert.equal(shouldSkipUpstreamUpdateCheck({
    currentVersion: '0.42.0-replica.1',
    latestForkRelease: { version: '0.42.0-replica.2' },
    latest: { version: '0.43.0' },
    lastCheckedAt: '2026-07-02T16:30:00Z',
    nowMs: Date.parse('2026-07-02T18:30:00Z')
  }), false);
});

test('extractReleaseNotes reads marked localized summaries as plain text', () => {
  const body = `
## What's changed
<!-- app-update-notes:en:start -->
### Added
- **Projects view:** Track usage by \`workspace\` with [setup notes](https://example.com).
### Fixed
- <strong>Updater:</strong> Keeps the action available.
<!-- app-update-notes:en:end -->

## 更新内容
<!-- app-update-notes:zh:start -->
### 新增
- **项目视图：** 按工作区追踪用量。
<!-- app-update-notes:zh:end -->

<!-- app-update-notes:zh-TW:start -->
### 新增
- **專案檢視：** 按工作區追蹤用量。
<!-- app-update-notes:zh-TW:end -->

<!-- app-update-notes:ko:start -->
### 추가
- **프로젝트 보기:** 작업 공간별 사용량을 추적합니다.
<!-- app-update-notes:ko:end -->

<!-- app-update-notes:ja:start -->
### 追加
- **プロジェクトビュー：** ワークスペース別に使用量を追跡します。
<!-- app-update-notes:ja:end -->
`;

  assert.deepEqual(extractReleaseNotes(body), {
    en: [
      { title: 'Added', items: ['Projects view: Track usage by workspace with setup notes.'] },
      { title: 'Fixed', items: ['Updater: Keeps the action available.'] }
    ],
    zh: [
      { title: '新增', items: ['项目视图：按工作区追踪用量。'] }
    ],
    'zh-TW': [
      { title: '新增', items: ['專案檢視：按工作區追蹤用量。'] }
    ],
    ko: [
      { title: '추가', items: ['프로젝트 보기: 작업 공간별 사용량을 추적합니다.'] }
    ],
    ja: [
      { title: '追加', items: ['プロジェクトビュー：ワークスペース別に使用量を追跡します。'] }
    ]
  });
});

test('extractReleaseNotes hides trailing PR references from App summaries', () => {
  const body = `
<!-- app-update-notes:en:start -->
### Added
- Projects view tracks workspace usage. (#122, #138, #144)
- Issue #150 remains visible when it is part of the sentence.
<!-- app-update-notes:en:end -->
<!-- app-update-notes:zh:start -->
### 新增
- 项目视图可按工作区追踪用量。（#122、#138、#144）
- 问题 #150 是句子内容的一部分，应该保留。
<!-- app-update-notes:zh:end -->
<!-- app-update-notes:zh-TW:start -->
### 新增
- 專案檢視可按工作區追蹤用量。（#122、#138、#144）
- 問題 #150 是句子內容的一部分，應該保留。
<!-- app-update-notes:zh-TW:end -->
<!-- app-update-notes:ko:start -->
### 추가
- 프로젝트 보기에서 작업 공간별 사용량을 추적합니다. (#122, #138, #144)
- 문장 안의 Issue #150은 그대로 보존해야 합니다.
<!-- app-update-notes:ko:end -->
<!-- app-update-notes:ja:start -->
### 追加
- プロジェクトビューでワークスペース別に使用量を追跡します。（#122、#138、#144）
- 文中の Issue #150 はそのまま残す必要があります。
<!-- app-update-notes:ja:end -->
`;

  assert.deepEqual(extractReleaseNotes(body), {
    en: [{
      title: 'Added',
      items: [
        'Projects view tracks workspace usage.',
        'Issue #150 remains visible when it is part of the sentence.'
      ]
    }],
    zh: [{
      title: '新增',
      items: [
        '项目视图可按工作区追踪用量。',
        '问题 #150 是句子内容的一部分，应该保留。'
      ]
    }],
    'zh-TW': [{
      title: '新增',
      items: [
        '專案檢視可按工作區追蹤用量。',
        '問題 #150 是句子內容的一部分，應該保留。'
      ]
    }],
    ko: [{
      title: '추가',
      items: [
        '프로젝트 보기에서 작업 공간별 사용량을 추적합니다.',
        '문장 안의 Issue #150은 그대로 보존해야 합니다.'
      ]
    }],
    ja: [{
      title: '追加',
      items: [
        'プロジェクトビューでワークスペース別に使用量を追跡します。',
        '文中の Issue #150 はそのまま残す必要があります。'
      ]
    }]
  });
});

test('extractReleaseNotes ignores unmarked release sections', () => {
  const body = `
## What's changed

### Improved
- Clearer update status.

## Download
- Installer

## 更新内容

### 改进
- 更新状态更清楚。

## 下载
- 安装包
`;

  assert.deepEqual(extractReleaseNotes(body), {});
});

test('extractReleaseNotes bounds groups, items, and item length', () => {
  const added = Array.from({ length: 5 }, (_, index) => (
    `- Added ${index + 1}${index === 0 ? ` ${'😀'.repeat(700)}` : ''}`
  )).join('\n');
  const notes = extractReleaseNotes(`
<!-- app-update-notes:en:start -->
### Added
${added}
### Changed
- Changed 1
- Changed 2
- Changed 3
### Improved
- Improved 1
- Improved 2
- Improved 3
### Fixed
- Fixed 1
- Fixed 2
- Fixed 3
### Extra
- Extra
<!-- app-update-notes:en:end -->
`);

  assert.deepEqual(notes.en.map((group) => group.title), ['Added', 'Changed', 'Improved', 'Fixed']);
  assert.deepEqual(notes.en.map((group) => group.items.length), [5, 3, 3, 1]);
  assert.equal(notes.en.reduce((total, group) => total + group.items.length, 0), 12);
  assert.equal(Array.from(notes.en[0].items[0]).length, 600);
  assert.match(notes.en[0].items[0], /…$/);
});

test('release-note text preserves literal, encoded, unclosed, and inline-code less-than signs', () => {
  const notes = extractReleaseNotes(`
<!-- app-update-notes:en:start -->
### Fixed
- Cost comparison 5 < 10 remains correct.
- Supports <5 requests without truncation.
- Works when value<limit and no space is used.
- Match a<b has later > here.
- 值<limit 時仍保留完整內容。
- 値<limit の場合も保持します。
- 값이 value<limit인 경우도 유지합니다.
- 值<a has later > 的比較內容仍保留。
- Generic <limit> placeholder remains.
- Adjacent<strong>markup</strong> is still stripped.
- Encoded &lt; text remains visible.
- Inline \`x < y\` comparison remains visible.
<!-- app-update-notes:en:end -->
`);

  assert.deepEqual(notes.en[0].items, [
    'Cost comparison 5 < 10 remains correct.',
    'Supports <5 requests without truncation.',
    'Works when value<limit and no space is used.',
    'Match a<b has later > here.',
    '值<limit 時仍保留完整內容。',
    '値<limit の場合も保持します。',
    '값이 value<limit인 경우도 유지합니다.',
    '值<a has later > 的比較內容仍保留。',
    'Generic <limit> placeholder remains.',
    'Adjacentmarkup is still stripped.',
    'Encoded < text remains visible.',
    'Inline x < y comparison remains visible.'
  ]);
});

test('release-note text ignores false closing tags in comments and quoted markup', () => {
  const notes = extractReleaseNotes(`
<!-- app-update-notes:en:start -->
### Fixed
- Compare x <a and later > here.
- Compare x<a and later > here <!-- </a> -->
- Compare x<a and later > here <span title="</a>">label</span>.
<!-- app-update-notes:en:end -->
`);

  assert.deepEqual(notes.en[0].items, [
    'Compare x <a and later > here.',
    'Compare x<a and later > here',
    'Compare x<a and later > here label.'
  ]);
});

test('release template exposes marked summaries for every bundled locale', () => {
  const template = fs.readFileSync(path.join(__dirname, '..', '..', '.github', 'RELEASE_TEMPLATE.md'), 'utf8');
  const notes = extractReleaseNotes(template);
  const categoryPairs = new Map([
    ['Added', '新增'],
    ['Changed', '变更'],
    ['Improved', '改进'],
    ['Fixed', '修复']
  ]);
  const traditionalCategoryPairs = new Map([
    ['Added', '新增'],
    ['Changed', '變更'],
    ['Improved', '改進'],
    ['Fixed', '修復']
  ]);
  const koreanCategoryPairs = new Map([
    ['Added', '추가'],
    ['Changed', '변경'],
    ['Improved', '개선'],
    ['Fixed', '수정']
  ]);
  const japaneseCategoryPairs = new Map([
    ['Added', '追加'],
    ['Changed', '変更'],
    ['Improved', '改善'],
    ['Fixed', '修正']
  ]);
  assert.ok(notes.en.length > 0);
  assert.deepEqual(
    notes.zh.map((group) => group.title),
    notes.en.map((group) => categoryPairs.get(group.title))
  );
  assert.deepEqual(
    notes['zh-TW'].map((group) => group.title),
    notes.en.map((group) => traditionalCategoryPairs.get(group.title))
  );
  assert.deepEqual(
    notes.ko.map((group) => group.title),
    notes.en.map((group) => koreanCategoryPairs.get(group.title))
  );
  assert.deepEqual(
    notes.ja.map((group) => group.title),
    notes.en.map((group) => japaneseCategoryPairs.get(group.title))
  );
  for (const locale of ['zh', 'zh-TW', 'ko', 'ja']) {
    assert.deepEqual(
      notes[locale].map((group) => group.items.length),
      notes.en.map((group) => group.items.length),
      `${locale} notes should keep the English item counts per category`
    );
  }
  assert.ok(notes.en.every((group) => categoryPairs.has(group.title)));
  assert.ok(notes.en.every((group) => group.items.length > 0));
  assert.ok(notes.zh.every((group) => group.items.length > 0));
  assert.ok(notes['zh-TW'].every((group) => group.items.length > 0));
  assert.ok(notes.ko.every((group) => group.items.length > 0));
  assert.ok(notes.ja.every((group) => group.items.length > 0));
  for (const locale of ['en', 'zh', 'zh-TW', 'ko', 'ja']) {
    assert.ok(
      notes[locale].every((group) => group.items.every((item) => !trailingPullRequestReference.test(item))),
      `${locale} notes should not end with a PR reference`
    );
  }
  assert.match(
    template,
    /<details>\s*<summary><strong>繁體中文<\/strong><\/summary>\s*## 繁體中文[\s\S]*<!-- app-update-notes:zh-TW:start -->[\s\S]*<!-- app-update-notes:zh-TW:end -->[\s\S]*<\/details>/
  );
  assert.match(
    template,
    /<details>\s*<summary><strong>한국어<\/strong><\/summary>\s*## 한국어[\s\S]*<!-- app-update-notes:ko:start -->[\s\S]*<!-- app-update-notes:ko:end -->[\s\S]*<\/details>/
  );
  assert.match(
    template,
    /<details>\s*<summary><strong>日本語<\/strong><\/summary>\s*## 日本語[\s\S]*<!-- app-update-notes:ja:start -->[\s\S]*<!-- app-update-notes:ja:end -->[\s\S]*<\/details>/
  );
  assert.match(
    template,
    /<details>\s*<summary>繁體中文 · 한국어 · 日本語<\/summary>[\s\S]*<details>\s*<summary><strong>繁體中文<\/strong><\/summary>[\s\S]*<details>\s*<summary><strong>한국어<\/strong><\/summary>[\s\S]*<details>\s*<summary><strong>日本語<\/strong><\/summary>/
  );
  assert.doesNotMatch(template, /其他語言|user-content-release-notes-/);
  assert.doesNotMatch(
    template,
    /^- \*\*[^*\n]+\*\*\S/gm,
    'bold release-note labels should be separated from their body text'
  );
  assert.match(template, /## 繁體中文[\s\S]*## 從原始碼建置/);
  assert.match(template, /## 한국어[\s\S]*## 소스에서 빌드/);
  assert.match(template, /## 日本語[\s\S]*## ソースからビルド/);
  assert.match(template, /\(#\d+(?:, #\d+)*\)/);
  assert.match(template, /（#\d+(?:、#\d+)*）/);
});

test('mergeLatestReleaseMetadata preserves notes when refreshed metadata omits them', () => {
  const releaseNotes = { en: [{ title: 'Fixed', items: ['An updater fix.'] }] };
  assert.deepEqual(
    mergeLatestReleaseMetadata(
      { version: '0.28.0', name: 'GitHub release', releaseNotes },
      { version: '0.28.0', name: 'Refreshed release' }
    ),
    { version: '0.28.0', name: 'Refreshed release', releaseNotes }
  );
  assert.deepEqual(
    mergeLatestReleaseMetadata(
      { version: '0.28.0', releaseNotes },
      { version: '0.29.0', name: 'Next release' }
    ),
    { version: '0.29.0', name: 'Next release' }
  );
});

test('parseLatestReleasePayload returns normalized object for valid payload', () => {
  const result = parseLatestReleasePayload({
    tag_name: 'v0.1.3',
    name: 'Token Monitor 0.1.3',
    html_url: 'https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/tag/v0.1.3',
    published_at: '2026-05-26T12:00:00Z',
    body: `
## What's changed
<!-- app-update-notes:en:start -->
### Added
- Release summaries in the app.
<!-- app-update-notes:en:end -->
## Download
`
  });
  assert.deepEqual(result, {
    version: '0.1.3',
    tag: 'v0.1.3',
    name: 'Token Monitor 0.1.3',
    htmlUrl: 'https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/tag/v0.1.3',
    publishedAt: '2026-05-26T12:00:00Z',
    releaseNotes: {
      en: [{ title: 'Added', items: ['Release summaries in the app.'] }]
    }
  });
});

test('parseLatestReleasePayload falls back to tag when name is missing', () => {
  const result = parseLatestReleasePayload({
    tag_name: 'v0.1.3',
    html_url: 'https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/tag/v0.1.3'
  });
  assert.equal(result.name, 'v0.1.3');
  assert.equal(result.publishedAt, '');
});

test('parseLatestReleasePayload returns null for invalid or missing tag', () => {
  assert.equal(parseLatestReleasePayload({}), null);
  assert.equal(parseLatestReleasePayload({ tag_name: 'release-foo' }), null);
  assert.equal(parseLatestReleasePayload({ tag_name: '' }), null);
  assert.equal(parseLatestReleasePayload(null), null);
  assert.equal(parseLatestReleasePayload('not an object'), null);
});

test('parseLatestReleasePayload builds a trusted release URL from the validated tag', () => {
  assert.equal(parseLatestReleasePayload({
    tag_name: 'v0.1.3',
    html_url: 'http://example.com'
  }).htmlUrl, 'https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/tag/v0.1.3');
  assert.equal(parseLatestReleasePayload({
    tag_name: 'v0.1.3'
  }).htmlUrl, 'https://github.com/MarbleGateKeeper/token-monitor-ver.replica/releases/tag/v0.1.3');
});

test('classifyAppUpdateError separates actionable failures including nested causes', () => {
  assert.equal(classifyAppUpdateError(Object.assign(new Error('rate limit exceeded'), { status: 429 })).kind, 'rateLimited');
  assert.equal(classifyAppUpdateError(Object.assign(new Error('aborted'), { name: 'AbortError' })).kind, 'timeout');
  assert.equal(classifyAppUpdateError(new Error('net::ERR_TIMED_OUT')).kind, 'timeout');
  assert.equal(classifyAppUpdateError(Object.assign(new Error('getaddrinfo ENOTFOUND github.com'), { code: 'ENOTFOUND' })).kind, 'network');
  assert.equal(classifyAppUpdateError(new Error('net::ERR_PROXY_CONNECTION_FAILED')).kind, 'network');
  assert.equal(classifyAppUpdateError(Object.assign(new Error('GitHub responded 503'), { status: 503 })).kind, 'githubUnavailable');
  assert.equal(classifyAppUpdateError(new SyntaxError('Unexpected token < in JSON')).kind, 'metadata');
  assert.equal(classifyAppUpdateError(Object.assign(new Error('Cannot find latest.yml'), { code: 'ERR_UPDATER_CHANNEL_FILE_NOT_FOUND' })).kind, 'metadata');
  assert.equal(classifyAppUpdateError(Object.assign(new Error('fetch failed'), {
    cause: Object.assign(new Error('getaddrinfo ENOTFOUND github.com'), { code: 'ENOTFOUND' })
  })).kind, 'network');
  assert.equal(classifyAppUpdateError(new Error('unexpected')).kind, 'unknown');
});

test('background update failures preserve a visible manual error until a success', () => {
  const manualFailure = {
    ok: false,
    error: 'Unable to connect',
    errorKind: 'network'
  };
  const backgroundFailure = {
    ok: false,
    error: 'Timed out',
    errorKind: 'timeout'
  };

  let visibleError = resolveAppUpdateCheckError(null, manualFailure, { force: true });
  assert.deepEqual(visibleError, { kind: 'network', message: 'Unable to connect' });
  visibleError = resolveAppUpdateCheckError(visibleError, backgroundFailure, { force: false });
  assert.deepEqual(visibleError, { kind: 'network', message: 'Unable to connect' });
  visibleError = resolveAppUpdateCheckError(visibleError, { ok: true }, { force: false });
  assert.equal(visibleError, null);
});
