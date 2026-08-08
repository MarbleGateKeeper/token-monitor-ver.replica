'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.join(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), 'utf8');
}

test('tag workflow publishes release notes without building or uploading binaries', () => {
  const workflow = read('.github/workflows/release.yml');
  assert.match(workflow, /tags: \['v\*-replica\.\*'\]/);
  assert.match(workflow, /name: Publish source-only release/);
  assert.match(workflow, /body_path: \.github\/RELEASE_TEMPLATE\.md/);
  assert.match(workflow, /make_latest: true/);
  assert.doesNotMatch(workflow, /electron-builder|setup-node|matrix:|upload-artifact|download-artifact|\bfiles:|SignPath|APPLE_|notariz|blockmap/i);
});

test('desktop package keeps local build commands but has no packaged updater or forced signing', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.version, '0.42.1-replica.1');
  assert.equal(pkg.repository.url, 'git+https://github.com/MarbleGateKeeper/token-monitor-ver.replica.git');
  assert.equal(pkg.dependencies['electron-updater'], undefined);
  assert.equal(pkg.build.publish, undefined);
  assert.equal(pkg.build.releaseInfo, undefined);
  assert.equal(pkg.build.mac.forceCodeSigning, undefined);
  assert.equal(pkg.build.win.verifyUpdateCodeSignature, undefined);
  assert.equal(pkg.build.win.signtoolOptions, undefined);
  assert.equal(pkg.scripts['verify:release-artifact-names'], undefined);
  assert.equal(pkg.scripts['dist:win'].includes('electron-builder'), true);
  assert.equal(pkg.scripts['dist:mac'].includes('electron-builder'), true);
  assert.equal(pkg.scripts['dist:linux'].includes('electron-builder'), true);
  assert.deepEqual(pkg.build.extraResources, ['LICENSE']);
});

test('release notes tell every bundled locale to build from source', () => {
  const template = read('.github/RELEASE_TEMPLATE.md');
  for (const locale of ['en', 'zh', 'zh-TW', 'ko', 'ja']) {
    assert.match(template, new RegExp(`<!-- app-update-notes:${locale}:start -->[\\s\\S]*<!-- app-update-notes:${locale}:end -->`));
  }
  assert.match(template, /## Build from source/);
  assert.match(template, /## 从源码构建/);
  assert.match(template, /## 從原始碼建置/);
  assert.match(template, /## 소스에서 빌드/);
  assert.match(template, /## ソースからビルド/);
  assert.doesNotMatch(template, /releases\/download|\.dmg\b|\.AppImage\b|Token-Monitor-Setup|signed and notarized|均已签名/i);
});

test('obsolete signing and release-artifact helpers stay removed', () => {
  const removed = [
    '.github/signpath/artifact-configuration.xml',
    '.github/signpath/application-artifact-configuration.xml',
    'docs/code-signing.md',
    'scripts/signpath-windows-artifacts.js',
    'scripts/verify-updater-artifact-names.js',
    'scripts/merge-mac-updater-metadata.js'
  ];
  for (const relativePath of removed) {
    assert.equal(fs.existsSync(path.join(projectRoot, relativePath)), false, relativePath);
  }
});
