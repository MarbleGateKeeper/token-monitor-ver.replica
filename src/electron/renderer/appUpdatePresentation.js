'use strict';

(function exposeAppUpdatePresentation(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.TokenMonitorAppUpdatePresentation = api;
})(typeof window !== 'undefined' ? window : null, function createAppUpdatePresentationApi() {
  function releaseNoteGroupsForLocale(notes, locale) {
    if (!notes || typeof notes !== 'object') return [];
    const fallbackKeys = {
      'zh-TW': ['zh-TW', 'zh', 'en'],
      'zh-CN': ['zh', 'en'],
      ko: ['ko', 'en', 'zh'],
      ja: ['ja', 'en', 'zh']
    }[locale] || ['en', 'zh'];

    for (const key of fallbackKeys) {
      if (Array.isArray(notes[key]) && notes[key].length > 0) return notes[key];
    }
    return [];
  }

  function appUpdateErrorMessageKey(kind) {
    const keys = {
      githubUnavailable: 'settings.appUpdate.githubUnavailable',
      metadata: 'settings.appUpdate.metadataError',
      rateLimited: 'settings.appUpdate.rateLimited',
      timeout: 'settings.appUpdate.timeout'
    };
    return keys[kind] || 'settings.appUpdate.githubError';
  }

  function appUpdateStatusPresentation(updateState = null) {
    const displayVersion = updateState?.latest?.version || '';
    const hasCheckError = Boolean(updateState?.lastError);
    const latestStatusKey = !displayVersion
      ? ''
      : hasCheckError
        ? 'settings.appUpdate.lastKnownShort'
        : !updateState?.hasUpdate && displayVersion === updateState?.currentVersion
          ? 'settings.appUpdate.upToDateShort'
          : '';

    return {
      displayVersion,
      latestStatusKey,
      errorKey: hasCheckError ? appUpdateErrorMessageKey(updateState?.lastErrorKind) : '',
      lastSuccessfulCheckAt: hasCheckError ? updateState?.lastCheckedAt || null : null
    };
  }

  return {
    appUpdateErrorMessageKey,
    appUpdateStatusPresentation,
    releaseNoteGroupsForLocale
  };
});
