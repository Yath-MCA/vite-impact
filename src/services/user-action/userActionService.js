import { apiService, API_ENDPOINTS } from '../api/apiService.js';
import { getDefaultMainBag, getDocId, getUserInfo, getWindowRef } from '../error/errorContext.js';
import { errorLogTrace } from '../error/errorLogTrace.js';
import {
  appendDialogActivity,
  createEmptyHistory,
  isHistoryEmpty,
  mergeHistory,
  normalizeHistoryData,
  serializedByteSize,
  trimHistory
} from './userActionHistory.js';

const RECORD_TYPE = 'user_action_history';
const MAX_BYTES = 4.5 * 1024 * 1024;
const RETRY_DELAY_MS = 2000;
const UNLOAD_ERROR_PATTERN = /NetworkError|Failed to fetch|Load failed/i;

function createRecordInfo(key, { addSessionId = false, ignoreLocalStorage = false, endpoint = API_ENDPOINTS.FIND_UPDATE_INSERT } = {}) {
  return {
    primary_key: key,
    ignore_local_storage: ignoreLocalStorage,
    set_endpoint: endpoint,
    add_in_find: addSessionId ? ['session_id'] : []
  };
}

const RECORD_INFO = {
  open_close_dialog: createRecordInfo('open_close_dialog', { addSessionId: true }),
  query_quick_answer: createRecordInfo('query_quick_answer'),
  insert_symbol: createRecordInfo('insert_symbol'),
  find_words: createRecordInfo('find_words'),
  replace_words: createRecordInfo('replace_words'),
  attachments_flow: createRecordInfo('attachments_flow'),
  video_tour: createRecordInfo('video_tour', { addSessionId: true, ignoreLocalStorage: true }),
  guided_tour: createRecordInfo('guided_tour', {
    addSessionId: true,
    ignoreLocalStorage: true,
    endpoint: API_ENDPOINTS.UPDATE_INSERT
  })
};

function storageKey(docid) {
  return `xmleditor:${RECORD_TYPE}:${docid || 'no-docid'}`;
}

function resolveDocIdFromQuery() {
  const win = getWindowRef();
  const params = new URLSearchParams(win?.location?.search || '');
  return params.get('docid') || '';
}

function isIgnorableUnloadError(err, keepalive) {
  if (!keepalive) return false;
  return err instanceof TypeError || UNLOAD_ERROR_PATTERN.test(err?.message || '');
}

export function createUserActionService() {
  let history = createEmptyHistory();
  let currentDocId = 'no-docid';
  let currentChannel = RECORD_INFO.open_close_dialog;
  let isSyncing = false;
  let retryTimer = null;

  function readFromStorage(docid) {
    try {
      const raw = localStorage.getItem(storageKey(docid));
      return raw ? normalizeHistoryData(JSON.parse(raw)) : createEmptyHistory();
    } catch {
      return createEmptyHistory();
    }
  }

  function writeToStorage() {
    try {
      if (serializedByteSize(history) > MAX_BYTES) {
        history = trimHistory(history, 0.8);
      }
      localStorage.setItem(storageKey(currentDocId), JSON.stringify(history));
    } catch (err) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        history = trimHistory(history, 0.5);
        try {
          localStorage.setItem(storageKey(currentDocId), JSON.stringify(history));
        } catch (retryErr) {
          errorLogTrace('UPDATE_LOCAL_STORAGE_TRIM', retryErr?.message || String(retryErr));
        }
      } else {
        errorLogTrace('UPDATE_LOCAL_STORAGE', err?.message || String(err));
      }
    }
  }

  function load() {
    const docid = resolveDocIdFromQuery();
    if (!docid) {
      currentDocId = 'no-docid';
      if (!retryTimer) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          load();
        }, RETRY_DELAY_MS);
      }
      return;
    }
    currentDocId = docid;
    history = readFromStorage(currentDocId);
  }

  function invoke(channelKey) {
    if (RECORD_INFO[channelKey]) {
      currentChannel = RECORD_INFO[channelKey];
    }
    return currentChannel;
  }

  function updateActivity(channelKey, update = {}) {
    const channel = channelKey ? invoke(channelKey) : currentChannel;
    if (channel.ignore_local_storage) return;

    const key = channel.primary_key;
    if (key === 'open_close_dialog') {
      history.open_close_dialog = appendDialogActivity(history.open_close_dialog, update);
    } else {
      if (!Array.isArray(history[key])) history[key] = [];
      history[key].push(update);
    }
    writeToStorage();
  }

  function payLoad() {
    const bag = getDefaultMainBag();
    return {
      tbl: 'UserPreference',
      find: {
        recordtype: RECORD_TYPE,
        username: bag.username,
        docid: getDocId(),
        rolename: bag.rolename,
        session_id: bag.session_id
      }
    };
  }

  async function fetchAndMerge() {
    try {
      const response = await apiService.getAdminDocs(payLoad());
      if (response?.data?.length) {
        const raw = response.data[0];
        const serverHistory = normalizeHistoryData(raw.history || raw);
        history = mergeHistory(history, serverHistory);
        writeToStorage();
      }
    } catch (err) {
      errorLogTrace('FETCH_DB', err?.message || String(err));
    }
    return history;
  }

  async function syncUserActionHistory({ keepalive = false } = {}) {
    if (isSyncing) return;
    if (isHistoryEmpty(history)) return;

    isSyncing = true;
    try {
      const bag = getDefaultMainBag();
      const json = {
        ...payLoad(),
        update: {
          recordtype: RECORD_TYPE,
          history,
          ...bag
        }
      };
      const endpoint = currentChannel.set_endpoint || API_ENDPOINTS.FIND_UPDATE_INSERT;
      const requestOptions = keepalive ? { keepalive: true } : {};

      await apiService.makeRequest(endpoint, json, requestOptions);
    } catch (err) {
      if (!isIgnorableUnloadError(err, keepalive)) {
        errorLogTrace('syncUserActionHistory', err?.message || String(err));
      }
    } finally {
      isSyncing = false;
    }
  }

  function trackDialogOpenClose(action, options = {}) {
    const now = options.timestamp instanceof Date ? options.timestamp : new Date();
    const dialogId = String(options.dialog_id || options.remark || 'unknown').trim() || 'unknown';
    const info = Object.prototype.hasOwnProperty.call(options, 'info')
      ? options.info
      : options.isDirectClose ? 'without any update' : '';

    updateActivity('open_close_dialog', {
      action,
      remark: options.remark || dialogId,
      info,
      dialog_id: dialogId,
      durationMs: typeof options.durationMs === 'number' ? Math.max(0, Math.round(options.durationMs)) : null,
      isDirectClose: !!options.isDirectClose,
      time_c: now.getTime(),
      time_iso: now.toISOString()
    });
  }

  function trackAttachmentsFlow(update = {}) {
    const now = update.timestamp instanceof Date ? update.timestamp : new Date();
    const user = getUserInfo();
    updateActivity('attachments_flow', {
      filename: update.filename || '',
      oldfilename: update.oldfilename || '',
      username: update.username || user.MAIL_ID,
      role: update.role || user.TRACK_ROLE_NAME,
      process: update.process || '',
      existing_payload: update.existing_payload || null,
      status: update.status || '',
      time_c: now.getTime(),
      time_iso: now.toISOString()
    });
  }

  function trackSuppFileWorkflow(update = {}) {
    return trackAttachmentsFlow(update);
  }

  load();
  invoke('open_close_dialog');

  return {
    get history() {
      return history;
    },
    load,
    invoke,
    payLoad,
    updateActivity,
    fetchAndMerge,
    syncUserActionHistory,
    trackDialogOpenClose,
    trackAttachmentsFlow,
    trackSuppFileWorkflow
  };
}
