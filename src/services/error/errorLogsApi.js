import { apiService, API_ENDPOINTS } from '../api/apiService.js';
import { getDefaultDocBag, getDocId, getUserInfo, getWindowRef } from './errorContext.js';

const ONE_TIME_MODULES = ['WORK_FLOW', 'editor_initialize_events'];
const QUERY_SPAN_FIND = /QUERY_SPAN|ORG_QUERY_SPAN/i;
const QUERY_SPAN_SKIP_SEND = /QUERY_SPAN|ORG_QUERY_SPAN|RESTORE_QUERY/i;

const ERROR_LOGS_FILTER = [
  'docid',
  'module',
  'username',
  'client',
  'projectname',
  'errormsg',
  'function',
  'iversion',
  'domain'
];

/**
 * @param {{
 *   module: string,
 *   errormsg?: string,
 *   fnTrack?: string|null,
 *   stack?: string,
 *   track?: string,
 *   repeatCount?: number,
 *   timestamp?: string
 * }} fields
 */
export async function insertErrorLog({
  module,
  errormsg,
  fnTrack,
  stack,
  track,
  repeatCount,
  timestamp
} = {}) {
  const win = getWindowRef() || {};
  const payload = {
    ...getDefaultDocBag(),
    tbl: 'ErrorLogs',
    docid: getDocId(),
    module,
    iversion: win.VERSION || '',
    domain: win.location?.hostname || '',
    function: fnTrack != null ? fnTrack : null,
    errormsg
  };
  if (stack != null) payload.stack = stack;
  if (track != null) payload.track = track;
  if (repeatCount != null) payload.repeatCount = repeatCount;
  if (timestamp != null) payload.timestamp = timestamp;
  return apiService.makeRequest(API_ENDPOINTS.UPDATE_INSERT, payload);
}

/**
 * ErrorLogs lookup — must use makeRequest (getDocs forces length 2500).
 * @param {{ module: string, errormsg?: string }} fields
 */
export async function fetchErrorLogs({ module, errormsg } = {}) {
  const find = {
    module,
    docid: getDocId(),
    username: getUserInfo().MAIL_ID,
    errormsg
  };
  if (QUERY_SPAN_FIND.test(module || '')) {
    delete find.username;
  }
  const payload = {
    tbl: 'ErrorLogs',
    find,
    length: 10,
    sort: {},
    filter: [...ERROR_LOGS_FILTER]
  };
  return apiService.makeRequest(API_ENDPOINTS.GET_DOCS, payload);
}

/**
 * Existence gate from last ErrorLogs row.
 * @param {{ data?: unknown[] }} response
 * @param {number} [now]
 */
export function shouldSendAfterLookup(response, now = Date.now()) {
  const data = response?.data;
  if (!Array.isArray(data) || data.length === 0) return true;

  const last = data[data.length - 1];
  const raw = last?.time_c?.$numberLong ?? last?.time_c?.numberLong;
  const time = parseInt(raw, 10);
  if (!Number.isFinite(time)) return false;

  const ageMin = Math.floor((now - time) / 60000);
  const dateDiff = Math.floor((now - time) / 86400000) > 3;
  let isCheck = ageMin > 10;
  isCheck = isCheck
    ? ONE_TIME_MODULES.includes(last.module) && last.docid == getDocId() && !dateDiff
      ? false
      : true
    : false;

  if (QUERY_SPAN_SKIP_SEND.test(last.module || '') && isCheck) {
    isCheck = false;
  }
  return isCheck;
}
