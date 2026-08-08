'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const projectRoot = path.join(__dirname, '..', '..');
const main = fs.readFileSync(path.join(projectRoot, 'src', 'electron', 'main.js'), 'utf8');
const preload = fs.readFileSync(path.join(projectRoot, 'src', 'electron', 'preload.js'), 'utf8');
const renderer = fs.readFileSync(path.join(projectRoot, 'src', 'electron', 'renderer', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(projectRoot, 'src', 'electron', 'renderer', 'index.html'), 'utf8');

function sourceBetween(startMarker, endMarker) {
  const start = main.indexOf(startMarker);
  const end = main.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(start, -1, `${startMarker} should exist`);
  assert.notEqual(end, -1, `${endMarker} should exist after ${startMarker}`);
  return main.slice(start, end);
}

test('manual update checks restore a matching dismissed version', () => {
  const check = sourceBetween('async function runAppUpdateCheck', 'async function runUpstreamUpdateCheck');
  assert.match(check, /if \(force && result\.newer\) restoreDismissedAppUpdate\(result\.latest\?\.version\)/);
});

test('manual checks preserve feedback when reusing an in-flight background check', () => {
  const check = sourceBetween('async function runAppUpdateCheck', 'async function runUpstreamUpdateCheck');
  assert.match(check, /if \(force\) sendAppUpdatePush\(\);\s*const activeResult = await appUpdateCheckPromise/);
  assert.match(check, /if \(activeResult\.newer\) restoreDismissedAppUpdate\(activeResult\.latest\?\.version\)/);
  assert.match(check, /resolveAppUpdateCheckError\(appUpdateLastError, activeResult, \{ force: true \}\)/);
});

test('background failures preserve the last visible update-check error', () => {
  const check = sourceBetween('async function runAppUpdateCheck', 'async function runUpstreamUpdateCheck');
  assert.doesNotMatch(check, /appUpdateCheckInFlight = true;\s*appUpdateLastError = null/);
  assert.match(check, /resolveAppUpdateCheckError\(appUpdateLastError, result, \{ force \}\)/);
  assert.match(check, /resolveAppUpdateCheckError\(appUpdateLastError, \{\s*ok: false,[\s\S]*\}, \{ force \}\)/);
});

test('all builds use the public release-tag check without a packaged updater', () => {
  const provider = sourceBetween('async function checkAppUpdateProvider', 'function rememberSuccessfulUpstreamUpdateCheck');
  assert.match(provider, /return checkLatestRelease\(app\.getVersion\(\)\)/);
  assert.doesNotMatch(provider, /app\.isPackaged|autoUpdater|electron-updater|latest\.yml/);
  assert.doesNotMatch(main, /autoUpdater|electron-updater/);
});

test('update state contains notification metadata and no download or install state', () => {
  const derive = sourceBetween('function deriveAppUpdateState', 'function restoreDismissedAppUpdate');
  assert.match(derive, /hasUpdate: availability\.hasUpdate/);
  assert.match(derive, /showUpdateNotice: availability\.showUpdateNotice/);
  assert.match(derive, /lastCheckedAt: block\.lastCheckedAt \|\| null/);
  assert.match(derive, /lastAttemptAt: appUpdateLastAttemptAt/);
  assert.match(derive, /lastError: appUpdateLastError\?\.message \|\| null/);
  assert.doesNotMatch(derive, /install|download|progress|phase/);
});

test('successful checks cache the release and clear stale errors', () => {
  const success = sourceBetween('function rememberSuccessfulAppUpdateCheck', 'async function checkAppUpdateProvider');
  const check = sourceBetween('async function runAppUpdateCheck', 'async function runUpstreamUpdateCheck');
  assert.match(success, /const remembered = latest[\s\S]*\? mergeLatestReleaseMetadata[\s\S]*: null/);
  assert.match(success, /lastKnownLatest: remembered/);
  assert.match(success, /appUpdateLastAttemptAt = checkedAt/);
  assert.match(success, /appUpdateLastError = null/);
  assert.match(check, /rememberSuccessfulAppUpdateCheck\(result\.latest, result\.checkedAt\)/);
});

test('the renderer exposes release notices only and the bridge has no installer IPC', () => {
  assert.match(html, /data-i18n="settings\.appUpdate\.notificationOnly"/);
  assert.doesNotMatch(html, /automaticAppUpdates|appUpdatePillRestart/);
  assert.match(renderer, /async function runAppUpdateAction\(\)[\s\S]*mode !== 'release'[\s\S]*openExternal\(latest\.htmlUrl\)/);
  assert.doesNotMatch(renderer, /downloadAppUpdate|installAppUpdate|automaticAppUpdate/);
  assert.doesNotMatch(preload, /appUpdate:(?:download|install)|downloadAppUpdate|installAppUpdate/);
  assert.doesNotMatch(main, /ipcMain\.handle\('appUpdate:(?:download|install)'/);
});

test('upstream tracking has independent state, IPC, dismissal, and renderer controls', () => {
  const derive = sourceBetween('function deriveAppUpdateState', 'function restoreDismissedAppUpdate');
  const upstreamCheck = sourceBetween('async function runUpstreamUpdateCheck', 'function maybeRunBackgroundUpdateCheck');
  assert.match(derive, /deriveUpstreamUpdateAvailability\(/);
  assert.match(derive, /upstream: \{[\s\S]*trackedVersion: upstreamAvailability\.trackedVersion[\s\S]*showUpdateNotice: upstreamAvailability\.showUpdateNotice/);
  assert.match(upstreamCheck, /shouldSkipUpstreamUpdateCheck\(/);
  assert.match(upstreamCheck, /rememberSuccessfulUpstreamUpdateCheck\(result\.latest, result\.checkedAt\)/);
  assert.match(main, /ipcMain\.handle\('appUpdate:checkUpstream'/);
  assert.match(main, /ipcMain\.handle\('appUpdate:dismissUpstream'/);
  assert.match(preload, /checkUpstreamUpdateNow: \(\) => ipcRenderer\.invoke\('appUpdate:checkUpstream'\)/);
  assert.match(preload, /dismissUpstreamUpdate: \(version\) => ipcRenderer\.invoke\('appUpdate:dismissUpstream', version\)/);
  assert.match(html, /id="upstreamUpdatePill"[\s\S]*id="upstreamUpdateCheckButton"|id="upstreamUpdateCheckButton"[\s\S]*id="upstreamUpdatePill"/);
  assert.match(renderer, /function renderUpstreamUpdatePill\(\)[\s\S]*s\.showUpdateNotice/);
  assert.match(renderer, /function renderSettingsUpstreamUpdateRow\(\)/);
});

test('legacy automatic-download settings are ignored and stripped on save', () => {
  assert.match(main, /delete merged\.automaticAppUpdates/);
  assert.match(main, /delete normalizedPatch\.automaticAppUpdates/);
  assert.match(main, /delete settings\.automaticAppUpdates/);
});
