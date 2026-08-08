'use strict';

const semver = require('semver');

const GITHUB_REPO = 'MarbleGateKeeper/token-monitor-ver.replica';
const RELEASES_LATEST_URL = `https://github.com/${GITHUB_REPO}/releases/latest`;
const REQUEST_TIMEOUT_MS = 10 * 1000;
const APP_UPDATE_BACKGROUND_COOLDOWN_MS = 24 * 60 * 60 * 1000;
const APP_UPDATE_OUTDATED_COOLDOWN_MS = 60 * 60 * 1000;
const MAX_RELEASE_BODY_CHARS = 128 * 1024;
const MAX_RELEASE_NOTE_GROUPS = 4;
const MAX_RELEASE_NOTE_ITEMS = 12;
const MAX_RELEASE_NOTE_ITEM_CHARS = 600;
const MAX_RELEASE_NOTE_HTML_MARKUP_CHARS = 1024;
const TRAILING_PULL_REQUEST_REFERENCES_RE = /\s*(?:\(\s*#\d+(?:\s*,\s*#\d+)*\s*\)|（\s*#\d+(?:\s*[、，,]\s*#\d+)*\s*）)\s*$/;
const RELEASE_NOTE_HTML_TAGS = new Set([
  'a', 'abbr', 'article', 'aside', 'b', 'blockquote', 'br', 'caption', 'cite', 'code',
  'col', 'colgroup', 'dd', 'del', 'details', 'div', 'dl', 'dt', 'em', 'figcaption',
  'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i',
  'img', 'ins', 'kbd', 'li', 'main', 'mark', 'ol', 'p', 'picture', 'pre', 'q',
  's', 'samp', 'script', 'section', 'small', 'source', 'span', 'strong', 'style',
  'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time',
  'tr', 'u', 'ul', 'var'
]);
const RELEASE_NOTE_VOID_HTML_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);

function parseTag(tag) {
  if (typeof tag !== 'string') return null;
  const trimmed = tag.trim();
  if (!trimmed) return null;
  const stripped = trimmed.replace(/^v/i, '');
  return semver.valid(stripped) ? stripped : null;
}

function truncateReleaseNoteText(value, maxChars) {
  const characters = Array.from(value);
  if (characters.length <= maxChars) return value;
  return `${characters.slice(0, maxChars - 1).join('').trimEnd()}…`;
}

function decodeHtmlEntities(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"'
  };
  return String(value || '').replace(/&(#x[0-9a-f]+|#\d+|amp|apos|gt|lt|nbsp|quot);/gi, (match, entity) => {
    const lower = entity.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(named, lower)) return named[lower];
    const codePoint = lower.startsWith('#x')
      ? Number.parseInt(lower.slice(2), 16)
      : Number.parseInt(lower.slice(1), 10);
    if (!Number.isInteger(codePoint) || codePoint < 0 || codePoint > 0x10FFFF) return match;
    try {
      return String.fromCodePoint(codePoint);
    } catch (_) {
      return match;
    }
  });
}

function isAsciiLetterAt(value, index) {
  const code = value.charCodeAt(index);
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isAsciiAlphaNumericAt(value, index) {
  const code = value.charCodeAt(index);
  return isAsciiLetterAt(value, index)
    || (code >= 48 && code <= 57);
}

function isAsciiHtmlWhitespaceAt(value, index) {
  return value[index] === '\t'
    || value[index] === '\n'
    || value[index] === '\f'
    || value[index] === '\r'
    || value[index] === ' ';
}

function htmlMarkupEnd(value, index) {
  let quote = '';
  const limit = Math.min(value.length, index + MAX_RELEASE_NOTE_HTML_MARKUP_CHARS);
  for (let cursor = index + 1; cursor < limit; cursor += 1) {
    if (quote) {
      if (value[cursor] === quote) quote = '';
    } else if (value[cursor] === '"' || value[cursor] === "'") {
      quote = value[cursor];
    } else if (value[cursor] === '>') {
      return cursor;
    }
  }
  return -1;
}

function containsNestedHtmlMarkup(value, index, end) {
  for (let cursor = index + 1; cursor < end; cursor += 1) {
    if (value[cursor] === '<' && startsHtmlMarkup(value, cursor)) return true;
  }
  return false;
}

function hasMatchingHtmlClosingTag(value, index, tagName) {
  const lower = value.toLowerCase();
  const prefix = `</${tagName}`;
  let cursor = index;
  while (cursor < value.length) {
    const markupStart = value.indexOf('<', cursor);
    if (markupStart < 0) return false;
    if (value.startsWith('<!--', markupStart)) {
      const commentEnd = value.indexOf('-->', markupStart + 4);
      if (commentEnd < 0) return false;
      cursor = commentEnd + 3;
      continue;
    }

    if (lower.startsWith(prefix, markupStart)) {
      let closingEnd = markupStart + prefix.length;
      while (isAsciiHtmlWhitespaceAt(value, closingEnd)) closingEnd += 1;
      if (value[closingEnd] === '>') return true;
    }

    const tagLike = isAsciiLetterAt(value, markupStart + 1)
      || (value[markupStart + 1] === '/' && isAsciiLetterAt(value, markupStart + 2))
      || value[markupStart + 1] === '!'
      || value[markupStart + 1] === '?';
    if (!tagLike) {
      cursor = markupStart + 1;
      continue;
    }
    const markupEnd = htmlMarkupEnd(value, markupStart);
    if (markupEnd < 0) return false;
    cursor = markupEnd + 1;
  }
  return false;
}

function startsHtmlMarkup(value, index) {
  if (value[index] !== '<') return false;
  if (value.startsWith('<!--', index)) {
    const commentEnd = value.indexOf('-->', index + 4);
    return commentEnd >= 0 && commentEnd - index < MAX_RELEASE_NOTE_HTML_MARKUP_CHARS;
  }

  const end = htmlMarkupEnd(value, index);
  if (end < 0) return false;
  if (value[index + 1] === '!' || value[index + 1] === '?') return true;

  const closing = value[index + 1] === '/';
  const nameStart = index + (closing ? 2 : 1);
  if (!isAsciiLetterAt(value, nameStart)) return false;
  let nameEnd = nameStart + 1;
  while (isAsciiAlphaNumericAt(value, nameEnd) || value[nameEnd] === '-') nameEnd += 1;
  const tagName = value.slice(nameStart, nameEnd).toLowerCase();
  if (!RELEASE_NOTE_HTML_TAGS.has(tagName) && !RELEASE_NOTE_VOID_HTML_TAGS.has(tagName)) {
    return containsNestedHtmlMarkup(value, index, end);
  }
  if (closing) return true;
  if (RELEASE_NOTE_VOID_HTML_TAGS.has(tagName)) return true;
  return hasMatchingHtmlClosingTag(value, end + 1, tagName);
}

function textOutsideHtmlMarkup(value) {
  const input = String(value || '');
  let output = '';
  let mode = 'text';
  let tagQuote = '';
  for (let index = 0; index < input.length; index += 1) {
    if (mode === 'comment') {
      if (input[index] === '-' && input[index + 1] === '-' && input[index + 2] === '>') {
        mode = 'text';
        index += 2;
      }
      continue;
    }
    if (mode === 'tag') {
      if (tagQuote) {
        if (input[index] === tagQuote) tagQuote = '';
      } else if (input[index] === '"' || input[index] === "'") {
        tagQuote = input[index];
      } else if (input[index] === '>') {
        mode = 'text';
      }
      continue;
    }
    if (startsHtmlMarkup(input, index)) {
      if (input[index + 1] === '!' && input[index + 2] === '-' && input[index + 3] === '-') {
        mode = 'comment';
        index += 3;
      } else {
        mode = 'tag';
        tagQuote = '';
      }
      continue;
    }
    output += input[index];
  }
  return decodeHtmlEntities(output);
}

function plainReleaseNoteText(value, maxChars = MAX_RELEASE_NOTE_ITEM_CHARS) {
  const text = textOutsideHtmlMarkup(value)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\s+/g, ' ')
    .replace(/([：。！？])\s+/g, '$1')
    .trim()
    .replace(TRAILING_PULL_REQUEST_REFERENCES_RE, '')
    .trimEnd();
  return truncateReleaseNoteText(text, maxChars);
}

function markedReleaseNoteSection(body, locale) {
  const startMarker = `<!-- app-update-notes:${locale}:start -->`;
  const endMarker = `<!-- app-update-notes:${locale}:end -->`;
  const start = body.indexOf(startMarker);
  if (start < 0) return '';
  const contentStart = start + startMarker.length;
  const end = body.indexOf(endMarker, contentStart);
  return end < 0 ? '' : body.slice(contentStart, end);
}

function parseReleaseNoteGroups(section) {
  const groups = [];
  let current = null;
  let itemCount = 0;

  function finishCurrent() {
    if (!current?.title || current.items.length === 0 || groups.length >= MAX_RELEASE_NOTE_GROUPS) return;
    groups.push(current);
  }

  for (const line of section.split(/\r?\n/)) {
    const heading = /^\s*###\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      finishCurrent();
      current = groups.length < MAX_RELEASE_NOTE_GROUPS
        ? { title: plainReleaseNoteText(heading[1], 80), items: [] }
        : null;
      continue;
    }
    const bullet = /^\s*[-*]\s+(.+?)\s*$/.exec(line);
    if (!bullet || !current || itemCount >= MAX_RELEASE_NOTE_ITEMS) continue;
    const text = plainReleaseNoteText(bullet[1]);
    if (!text) continue;
    current.items.push(text);
    itemCount += 1;
  }
  finishCurrent();
  return groups;
}

function extractReleaseNotes(value) {
  if (typeof value !== 'string' || !value.trim()) return {};
  const body = value.slice(0, MAX_RELEASE_BODY_CHARS);
  const notes = {};
  for (const locale of ['en', 'zh', 'zh-TW', 'ko', 'ja']) {
    const section = markedReleaseNoteSection(body, locale);
    const groups = section ? parseReleaseNoteGroups(section) : [];
    if (groups.length > 0) notes[locale] = groups;
  }
  return notes;
}

function mergeLatestReleaseMetadata(existing, incoming) {
  if (!incoming || typeof incoming !== 'object') return null;
  if (!existing || existing.version !== incoming.version) return incoming;
  const releaseNotes = incoming.releaseNotes || existing.releaseNotes;
  return {
    ...existing,
    ...incoming,
    ...(releaseNotes ? { releaseNotes } : {})
  };
}

function parseLatestReleasePayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const tag = typeof payload.tag_name === 'string' ? payload.tag_name : '';
  const version = parseTag(tag);
  if (!version) return null;
  const htmlUrl = `https://github.com/${GITHUB_REPO}/releases/tag/${encodeURIComponent(tag)}`;
  const releaseNotes = extractReleaseNotes(payload.body);
  return {
    version,
    tag,
    name: (typeof payload.name === 'string' && payload.name.trim()) ? payload.name : tag,
    htmlUrl,
    publishedAt: typeof payload.published_at === 'string' ? payload.published_at : '',
    ...(Object.keys(releaseNotes).length > 0 ? { releaseNotes } : {})
  };
}

function errorDetails(error) {
  const details = [];
  const seen = new Set();
  let current = error;
  while (current && !seen.has(current) && details.length < 4) {
    seen.add(current);
    details.push({
      name: String(current.name || ''),
      code: String(current.code || ''),
      status: Number(current.status || current.statusCode || 0),
      message: current.message || String(current)
    });
    current = current.cause;
  }
  return details;
}

function classifyAppUpdateError(error) {
  const details = errorDetails(error);
  const message = details[0]?.message || 'Update check failed';
  const haystack = details.map((detail) => `${detail.name} ${detail.code} ${detail.message}`).join(' ').toLowerCase();
  const statuses = details.map((detail) => detail.status);
  if (statuses.includes(429) || (statuses.includes(403) && /rate.?limit/.test(haystack)) || /rate.?limit/.test(haystack)) {
    return { kind: 'rateLimited', message };
  }
  if (/abort|timed?[\s_]?out|etimedout/.test(haystack)) {
    return { kind: 'timeout', message };
  }
  if (/enotfound|eai_again|econnrefused|econnreset|fetch failed|network|socket hang up|err_(?:address_unreachable|connection_closed|connection_refused|connection_reset|internet_disconnected|name_not_resolved|network_changed|proxy_connection_failed)/.test(haystack)) {
    return { kind: 'network', message };
  }
  if (statuses.some((status) => status >= 500) || /github responded 5\d\d/.test(haystack)) {
    return { kind: 'githubUnavailable', message };
  }
  if (details.some((detail) => detail.name === 'SyntaxError')
    || /err_updater_(?:channel_file_not_found|invalid_release_feed|latest_version_not_found|no_published_versions)|payload missing|metadata missing|invalid payload/.test(haystack)) {
    return { kind: 'metadata', message };
  }
  return { kind: 'unknown', message };
}

function resolveAppUpdateCheckError(previousError, result, { force = false } = {}) {
  if (result?.ok) return null;
  if (!force) return previousError || null;
  return {
    kind: result?.errorKind || 'unknown',
    message: result?.error || 'Update check failed'
  };
}

function shouldSkipAppUpdateCheck({
  force = false,
  lastCheckedAt,
  latest,
  dismissedVersion,
  currentVersion,
  nowMs = Date.now()
} = {}) {
  if (force || !lastCheckedAt) return false;
  const last = Date.parse(lastCheckedAt);
  if (!Number.isFinite(last)) return false;
  const availability = deriveAppUpdateAvailability({ currentVersion, latest, dismissedVersion });
  const cachedUpdate = availability.hasUpdate && !availability.dismissed;
  const cooldownMs = cachedUpdate ? APP_UPDATE_OUTDATED_COOLDOWN_MS : APP_UPDATE_BACKGROUND_COOLDOWN_MS;
  return nowMs - last < cooldownMs;
}

function deriveAppUpdateAvailability({
  currentVersion,
  latest,
  dismissedVersion
} = {}) {
  const current = semver.valid(currentVersion);
  const latestVersion = semver.valid(latest?.version);
  const hasUpdate = Boolean(current && latestVersion && semver.gt(latestVersion, current));
  const dismissed = Boolean(hasUpdate && latestVersion === dismissedVersion);
  return {
    hasUpdate,
    dismissed,
    showUpdateNotice: hasUpdate && !dismissed
  };
}

async function withTimeout(ms, task) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await task(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

async function checkLatestRelease(currentVersion) {
  const checkedAt = new Date().toISOString();
  try {
    const payload = await withTimeout(REQUEST_TIMEOUT_MS, async (signal) => {
      const response = await fetch(RELEASES_LATEST_URL, {
        signal,
        headers: {
          // GitHub's public web route returns release JSON through content negotiation,
          // avoiding authenticated API credentials and api.github.com quotas.
          'accept': 'application/json',
          'user-agent': `token-monitor/${currentVersion || '0.0.0'}`
        }
      });
      if (!response.ok) {
        const responseError = new Error(`GitHub responded ${response.status}`);
        responseError.status = response.status;
        throw responseError;
      }
      return response.json();
    });
    const latest = parseLatestReleasePayload(payload);
    if (!latest) {
      return { ok: false, newer: false, latest: null, error: 'Release payload missing or invalid', errorKind: 'metadata', checkedAt };
    }
    const current = semver.valid(currentVersion) ? currentVersion : '0.0.0';
    const newer = semver.gt(latest.version, current);
    return { ok: true, newer, latest, error: null, errorKind: null, checkedAt };
  } catch (error) {
    const classified = classifyAppUpdateError(error);
    return { ok: false, newer: false, latest: null, error: classified.message, errorKind: classified.kind, checkedAt };
  }
}

module.exports = {
  parseTag,
  parseLatestReleasePayload,
  classifyAppUpdateError,
  resolveAppUpdateCheckError,
  shouldSkipAppUpdateCheck,
  deriveAppUpdateAvailability,
  extractReleaseNotes,
  mergeLatestReleaseMetadata,
  checkLatestRelease,
  RELEASES_LATEST_URL,
  GITHUB_REPO,
  APP_UPDATE_BACKGROUND_COOLDOWN_MS,
  APP_UPDATE_OUTDATED_COOLDOWN_MS
};
