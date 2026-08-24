/**
 * User action history shape, normalize, merge, and trim (impactweb
 * UserActionRecord_Handler.js parity — field names time_c/time_iso, not timestamp).
 */

export const HISTORY_CHANNELS = [
  'open_close_dialog',
  'query_quick_answer',
  'insert_symbol',
  'video_tour',
  'guided_tour',
  'find_words',
  'replace_words',
  'attachments_flow'
];

const ARRAY_CHANNELS = HISTORY_CHANNELS.filter((channel) => channel !== 'open_close_dialog');

export function createEmptyHistory() {
  return {
    open_close_dialog: {},
    query_quick_answer: [],
    insert_symbol: [],
    video_tour: [],
    guided_tour: [],
    find_words: [],
    replace_words: [],
    attachments_flow: []
  };
}

function normalizeDialogGroupKey(update = {}) {
  return String(update.dialog_id || update.module_name || 'unknown').trim() || 'unknown';
}

function normalizeOpenCloseHistory(entries) {
  const grouped = {};
  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const key = normalizeDialogGroupKey(entry);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });
  return grouped;
}

/** Normalize a raw (possibly stringified) history blob: canonical channels + open_close_dialog shape + supp_file_workflow fold. */
export function normalizeHistoryData(raw) {
  const normalized = createEmptyHistory();
  let parsed = raw;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return normalized;

  HISTORY_CHANNELS.forEach((key) => {
    if (key === 'open_close_dialog') {
      if (Array.isArray(parsed[key])) {
        normalized[key] = normalizeOpenCloseHistory(parsed[key]);
      } else if (parsed[key] && typeof parsed[key] === 'object') {
        const openClose = {};
        Object.keys(parsed[key]).forEach((dialogId) => {
          if (Array.isArray(parsed[key][dialogId])) {
            openClose[dialogId] = parsed[key][dialogId];
          }
        });
        normalized[key] = openClose;
      }
    } else if (Array.isArray(parsed[key])) {
      normalized[key] = parsed[key];
    }
  });

  if (Array.isArray(parsed.supp_file_workflow) && parsed.supp_file_workflow.length) {
    normalized.attachments_flow = [...normalized.attachments_flow, ...parsed.supp_file_workflow];
  }

  return normalized;
}

function getTime(entry) {
  const raw = (entry && entry.time_c && entry.time_c.$numberLong) || (entry && entry.time_c) || 0;
  return parseInt(raw, 10) || 0;
}

function getEntryKey(entry) {
  const sessionId = (entry && entry._session) || 'no_session';
  const action = (entry && entry.action) || 'unknown';
  return `${sessionId}_${action}`;
}

function getArrayEntryKey(entry = {}, index = 0) {
  const t = getTime(entry);
  const signature = [
    t,
    entry.action || '',
    entry.process || '',
    entry.filename || '',
    entry.oldfilename || '',
    entry.dialog_id || '',
    entry._session || '',
    entry.time_iso || '',
    entry.info || ''
  ].join('|');
  if (signature === `${t}||||||||`) return `${t}|idx:${index}`;
  return signature;
}

function mergeByKey(localArr = [], serverArr = [], keyFn) {
  const map = new Map();
  localArr.forEach((entry, index) => {
    map.set(keyFn(entry, index), entry);
  });
  serverArr.forEach((entry, index) => {
    const key = keyFn(entry, index);
    const existing = map.get(key);
    if (!existing || getTime(entry) >= getTime(existing)) {
      map.set(key, entry);
    }
  });
  return [...map.values()].sort((a, b) => getTime(a) - getTime(b));
}

/** Merge local vs server history; newer time_c wins per entry key (mirrors impactweb mergeHistoryByTimestamp). */
export function mergeHistory(localHistory = createEmptyHistory(), serverHistory = createEmptyHistory()) {
  const merged = createEmptyHistory();

  const localOCD = localHistory.open_close_dialog || {};
  const serverOCD = serverHistory.open_close_dialog || {};
  const dialogKeys = new Set([...Object.keys(localOCD), ...Object.keys(serverOCD)]);
  dialogKeys.forEach((dialogKey) => {
    merged.open_close_dialog[dialogKey] = mergeByKey(localOCD[dialogKey], serverOCD[dialogKey], getEntryKey);
  });

  ARRAY_CHANNELS.forEach((key) => {
    merged[key] = mergeByKey(localHistory[key], serverHistory[key], getArrayEntryKey);
  });

  return merged;
}

export function serializedByteSize(history) {
  return new TextEncoder().encode(JSON.stringify(history)).length;
}

/** Keep newest `ratio` share of each channel; also folds a raw supp_file_workflow present on the input group. */
export function trimHistory(history, ratio) {
  const trimmed = createEmptyHistory();

  Object.keys(history.open_close_dialog || {}).forEach((dialogKey) => {
    const entries = history.open_close_dialog[dialogKey] || [];
    const keep = Math.ceil(entries.length * ratio);
    trimmed.open_close_dialog[dialogKey] = entries.slice(-keep);
  });

  ARRAY_CHANNELS.forEach((key) => {
    const entries = history[key] || [];
    const keep = Math.ceil(entries.length * ratio);
    trimmed[key] = entries.slice(-keep);
  });

  if (Array.isArray(history.supp_file_workflow) && history.supp_file_workflow.length) {
    const legacyEntries = history.supp_file_workflow;
    const keep = Math.ceil(legacyEntries.length * ratio);
    trimmed.attachments_flow = [...trimmed.attachments_flow, ...legacyEntries.slice(-keep)];
  }

  return trimmed;
}

function getLatestOpenSession(entries = []) {
  const closedSessions = new Set();
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index] || {};
    if (entry.action === 'close' && entry._session != null) {
      closedSessions.add(entry._session);
      continue;
    }
    if (entry.action === 'open' && entry._session != null && !closedSessions.has(entry._session)) {
      return entry;
    }
  }
  return null;
}

/**
 * Bucket open_close_dialog entries by dialog_id||module_name.
 * open: _session = (count of prior 'open' entries in this bucket) + 1.
 * close: _session = the nearest prior unclosed open's _session (walk backward, skip closed sessions).
 */
export function appendDialogActivity(dialogMap = {}, update = {}) {
  const dialogKey = normalizeDialogGroupKey(update);
  const next = { ...dialogMap };
  const sessions = [...(next[dialogKey] || [])];
  const entry = { ...update };

  if (entry.action === 'open') {
    entry._session = sessions.filter((e) => e && e.action === 'open').length + 1;
  } else if (entry.action === 'close') {
    const lastOpen = getLatestOpenSession(sessions);
    entry._session = lastOpen ? lastOpen._session : null;
  }

  sessions.push(entry);
  next[dialogKey] = sessions;
  return next;
}

export function isHistoryEmpty(history) {
  const dialogEmpty = Object.keys(history?.open_close_dialog || {}).length === 0;
  const arraysEmpty = ['query_quick_answer', 'insert_symbol', 'attachments_flow'].every(
    (channel) => !(history?.[channel] || []).length
  );
  return dialogEmpty && arraysEmpty;
}
