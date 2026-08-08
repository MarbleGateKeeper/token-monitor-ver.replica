'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

const {
  appUpdateErrorMessageKey,
  appUpdateStatusPresentation
} = require('../../src/electron/renderer/appUpdatePresentation');

test('failed checks mark cached versions as last known instead of up to date', () => {
  assert.deepEqual(appUpdateStatusPresentation({
    currentVersion: '0.39.0',
    latest: { version: '0.39.0' },
    hasUpdate: false,
    lastCheckedAt: '2026-08-03T08:00:00.000Z',
    lastError: 'network down',
    lastErrorKind: 'network'
  }), {
    displayVersion: '0.39.0',
    latestStatusKey: 'settings.appUpdate.lastKnownShort',
    errorKey: 'settings.appUpdate.githubError',
    lastSuccessfulCheckAt: '2026-08-03T08:00:00.000Z'
  });
});

test('successful current-version checks retain the up-to-date status', () => {
  assert.deepEqual(appUpdateStatusPresentation({
    currentVersion: '0.39.0',
    latest: { version: '0.39.0' },
    hasUpdate: false,
    lastCheckedAt: '2026-08-03T08:00:00.000Z',
    lastError: null
  }), {
    displayVersion: '0.39.0',
    latestStatusKey: 'settings.appUpdate.upToDateShort',
    errorKey: '',
    lastSuccessfulCheckAt: null
  });
});

test('failed checks without cached data do not invent a latest version', () => {
  assert.deepEqual(appUpdateStatusPresentation({
    currentVersion: '0.39.0',
    latest: null,
    lastCheckedAt: null,
    lastError: 'rate limited',
    lastErrorKind: 'rateLimited'
  }), {
    displayVersion: '',
    latestStatusKey: '',
    errorKey: 'settings.appUpdate.rateLimited',
    lastSuccessfulCheckAt: null
  });
});

test('update error presentation distinguishes actionable failure classes', () => {
  assert.equal(appUpdateErrorMessageKey('rateLimited'), 'settings.appUpdate.rateLimited');
  assert.equal(appUpdateErrorMessageKey('timeout'), 'settings.appUpdate.timeout');
  assert.equal(appUpdateErrorMessageKey('githubUnavailable'), 'settings.appUpdate.githubUnavailable');
  assert.equal(appUpdateErrorMessageKey('metadata'), 'settings.appUpdate.metadataError');
  assert.equal(appUpdateErrorMessageKey('network'), 'settings.appUpdate.githubError');
  assert.equal(appUpdateErrorMessageKey('unknown'), 'settings.appUpdate.githubError');
});
