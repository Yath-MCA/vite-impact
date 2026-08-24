import { apiService, API_ENDPOINTS } from '../api/apiService.js';
import { getDefaultMainBag } from '../error/errorContext.js';
import {
  appendDialogActivity,
  createEmptyHistory,
  foldAliases,
  isHistoryEmpty,
  mergeHistory,
  serializedByteSize,
  trimHistory
} from './userActionHistory.js';

const MAX_BYTES = 4.5 * 1024 * 1024;
const RETRY_DELAY_MS = 2000;
const NETWORK_ERROR_MESSAGE = /Failed to fetch/i;

function getWindowRef() {
  return typeof window !== 'undefined' ? window : null;
}

function storageKey(docid) {
  return `xmleditor:user_action_history:${docid || 'no-docid'}`;
}

function resolveDocId() {
  const win = getWindowRef();
  const params = new URLSearchParams(win?.location?.search || '');
  return params.get('docid') || win?.DOC_ID || '';
}

function buildFindQuery(docid) {
  const bag = getDefaultMainBag();
  return {
    recordtype: 'user_action_history',
    username: bag.username,
    docid,
    rolename: bag.rolename,
    session_id: bag.session_id
  };
}

function isIgnorableUnloadError(err) {
  return err?.name === 'TypeError' || NETWORK_ERROR_MESSAGE.test(err?.message || '');
}

export function createUserActionService() {
  let history = createEmptyHistory();
  let currentDocId = 'no-docid';
  let retryTimer = null;

  function readFromStorage(docid) {
    try {
      const raw = localStorage.getItem(storageKey(docid));
      return raw ? foldAliases(JSON.parse(raw)) : createEmptyHistory();
    } catch {
      return createEmptyHistory();
    }
  }

  function writeToStorage() {
    try {
      localStorage.setItem(storageKey(currentDocId), JSON.stringify(history));
    } catch (err) {
      if (err?.name === 'QuotaExceededError') {
        history = trimHistory(history, 0.5);
        try {
          localStorage.setItem(storageKey(currentDocId), JSON.stringify(history));
        } catch {
          // storage still unavailable; keep in-memory history only
        }
      }
    }
  }

  function trimIfOversized() {
    if (serializedByteSize(history) > MAX_BYTES) {
      history = trimHistory(history, 0.8);
    }
  }

  function load() {
    const docid = resolveDocId();
    currentDocId = docid || 'no-docid';
    history = readFromStorage(currentDocId);

    if (!docid && !retryTimer) {
      retryTimer = setTimeout(() => {
        retryTimer = null;
        load();
      }, RETRY_DELAY_MS);
    }
  }

  function updateActivity(channel, update = {}) {
    if (channel === 'open_close_dialog') {
      history.open_close_dialog = appendDialogActivity(history.open_close_dialog, update);
    } else if (Object.prototype.hasOwnProperty.call(history, channel)) {
      history[channel] = [...(history[channel] || []), { ...update, timestamp: update.timestamp ?? Date.now() }];
    } else {
      return;
    }
    trimIfOversized();
    writeToStorage();
  }

  async function fetchServerHistory() {
    const response = await apiService.getAdminDocs({
      tbl: 'UserPreference',
      find: buildFindQuery(currentDocId)
    });
    const serverHistory = response?.data?.[0]?.history;
    return serverHistory ? foldAliases(serverHistory) : createEmptyHistory();
  }

  async function fetchAndMerge() {
    const server = await fetchServerHistory();
    history = mergeHistory(history, server);
    writeToStorage();
    return history;
  }

  async function syncUserActionHistory({ keepalive = false } = {}) {
    if (isHistoryEmpty(history)) return;

    const payload = {
      tbl: 'UserPreference',
      find: buildFindQuery(currentDocId),
      update: {
        recordtype: 'user_action_history',
        history,
        ...getDefaultMainBag()
      }
    };

    try {
      await apiService.makeRequest(
        API_ENDPOINTS.FIND_UPDATE_INSERT,
        payload,
        keepalive ? { keepalive: true } : {}
      );
    } catch (err) {
      if (isIgnorableUnloadError(err)) return;
      throw err;
    }
  }

  function trackDialogOpenClose(dialogId, action, extra = {}) {
    updateActivity('open_close_dialog', { dialog_id: dialogId, action, ...extra });
  }

  function trackAttachmentsFlow(entry = {}) {
    updateActivity('attachments_flow', entry);
  }

  function trackSuppFileWorkflow(entry = {}) {
    updateActivity('attachments_flow', entry);
  }

  load();

  return {
    get history() {
      return history;
    },
    load,
    updateActivity,
    fetchAndMerge,
    syncUserActionHistory,
    trackDialogOpenClose,
    trackAttachmentsFlow,
    trackSuppFileWorkflow
  };
}
