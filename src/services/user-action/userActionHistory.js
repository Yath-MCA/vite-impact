/**
 * User action history shape, alias folding, merge, and trim (impactweb
 * UserActionRecord_Handler parity).
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

const ALIAS_TO_CHANNEL = {
  supp_file_workflow: 'attachments_flow'
};

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

/** Fold legacy alias keys (e.g. supp_file_workflow) into their canonical channel on load. */
export function foldAliases(raw = {}) {
  const history = createEmptyHistory();
  for (const key of HISTORY_CHANNELS) {
    if (raw[key] !== undefined) {
      history[key] = key === 'open_close_dialog' ? { ...raw[key] } : [...(raw[key] || [])];
    }
  }
  for (const [alias, channel] of Object.entries(ALIAS_TO_CHANNEL)) {
    if (Array.isArray(raw[alias]) && raw[alias].length) {
      history[channel] = [...(history[channel] || []), ...raw[alias]];
    }
  }
  return history;
}

function entryKey(entry) {
  return entry?.id ?? JSON.stringify(entry);
}

function entryTime(entry) {
  return entry?.timestamp ?? entry?.time_c ?? 0;
}

function mergeArrays(localArr = [], serverArr = []) {
  const byKey = new Map();
  [...serverArr, ...localArr].forEach((entry) => {
    const key = entryKey(entry);
    const existing = byKey.get(key);
    if (!existing || entryTime(entry) >= entryTime(existing)) {
      byKey.set(key, entry);
    }
  });
  return [...byKey.values()].sort((a, b) => entryTime(a) - entryTime(b));
}

/** Merge local vs server history by per-entry timestamp; newer entry wins on key collision. */
export function mergeHistory(local = createEmptyHistory(), server = createEmptyHistory()) {
  const merged = createEmptyHistory();
  for (const channel of HISTORY_CHANNELS) {
    if (channel === 'open_close_dialog') {
      const dialogIds = new Set([
        ...Object.keys(local.open_close_dialog || {}),
        ...Object.keys(server.open_close_dialog || {})
      ]);
      const dialogs = {};
      dialogIds.forEach((id) => {
        dialogs[id] = mergeArrays(local.open_close_dialog?.[id], server.open_close_dialog?.[id]);
      });
      merged.open_close_dialog = dialogs;
    } else {
      merged[channel] = mergeArrays(local[channel], server[channel]);
    }
  }
  return merged;
}

export function serializedByteSize(history) {
  return new TextEncoder().encode(JSON.stringify(history)).length;
}

/** Keep the newest `ratio` share of each channel (dialog map trimmed per dialog id). */
export function trimHistory(history, ratio) {
  const trimmed = createEmptyHistory();
  for (const channel of HISTORY_CHANNELS) {
    if (channel === 'open_close_dialog') {
      const dialogs = {};
      for (const [id, entries] of Object.entries(history.open_close_dialog || {})) {
        const keep = Math.ceil((entries?.length || 0) * ratio);
        dialogs[id] = (entries || []).slice(-keep);
      }
      trimmed.open_close_dialog = dialogs;
    } else {
      const entries = history[channel] || [];
      const keep = Math.ceil(entries.length * ratio);
      trimmed[channel] = entries.slice(-keep);
    }
  }
  return trimmed;
}

/** Bucket open_close_dialog entries by dialog_id||module_name; open assigns next _session, close copies latest open's _session. */
export function appendDialogActivity(dialogMap = {}, update = {}) {
  const bucketKey = update.dialog_id || update.module_name;
  if (!bucketKey) return dialogMap;

  const next = { ...dialogMap };
  const entries = [...(next[bucketKey] || [])];
  const timestamp = update.timestamp ?? Date.now();

  if (update.action === 'open') {
    const lastSession = entries.reduce((max, entry) => Math.max(max, entry._session || 0), 0);
    entries.push({ ...update, timestamp, _session: lastSession + 1 });
  } else if (update.action === 'close') {
    const lastOpen = [...entries].reverse().find((entry) => entry.action === 'open');
    entries.push({ ...update, timestamp, _session: lastOpen?._session });
  } else {
    entries.push({ ...update, timestamp });
  }

  next[bucketKey] = entries;
  return next;
}

export function isHistoryEmpty(history) {
  const dialogEmpty = Object.keys(history?.open_close_dialog || {}).length === 0;
  const arraysEmpty = ['query_quick_answer', 'insert_symbol', 'attachments_flow'].every(
    (channel) => !(history?.[channel] || []).length
  );
  return dialogEmpty && arraysEmpty;
}
