import {
  commitSessionForEditor,
  getStoredEditorSession
} from './sessionStorage.js';
import {
  recoverEditorSessionByDocId,
  verifySession
} from './sessionGateway.js';
import { LOCAL_STORAGE_KEYS } from './sessionConstants.js';
import { isLocalHost } from './runtimeFlags.js';
import { devLog } from '../../shared/utils/devLogger.js';

function readQueryDocId(locationSearch = '') {
  try {
    return new URLSearchParams(locationSearch).get('docid') || '';
  } catch {
    return '';
  }
}

function resolveSessionId(stored, docData) {
  return stored.sessionId || docData?.session_id || docData?.sessionId || '';
}

function resolveSessionStartTime(stored, docData) {
  return (
    stored.sessionStartTime ||
    docData?.session_start_time ||
    docData?.sessionStartTime ||
    ''
  );
}

function readLoginUsername() {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.LOGIN_USERNAME) || '';
  } catch {
    return '';
  }
}

function readLoginUserId() {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.LOGIN_USERID) || '';
  } catch {
    return '';
  }
}

function normalizeIdentity(value) {
  const normalized = String(value ?? '').trim();
  return /^(null|undefined)$/i.test(normalized) ? '' : normalized;
}

export function resolveEditorDocId({ docId, locationSearch } = {}) {
  return docId || readQueryDocId(locationSearch) || '';
}

export async function loadOrRecoverEditorSession({
  docId,
  allowRecovery = true
} = {}) {
  const stored = getStoredEditorSession(docId);
  let validateResponse = stored.validateResponse;
  let docData = validateResponse?.data ?? validateResponse ?? {};
  let sessionId = resolveSessionId(stored, docData);
  let sessionStartTime = resolveSessionStartTime(stored, docData);
  let recovered = false;

  if ((!validateResponse || !sessionId) && allowRecovery) {
    const recovery = await recoverEditorSessionByDocId(docId);
    if (!recovery.ok) {
      return {
        ok: false,
        reason: recovery.reason,
        message: recovery.message,
        redirectTo: '/validateurl'
      };
    }

    recovered = true;
    docData = { ...recovery.docData, docid: docId };
    validateResponse = { data: docData };
    sessionId = resolveSessionId(stored, docData);
    sessionStartTime = resolveSessionStartTime(stored, docData);

    commitSessionForEditor({
      docId,
      sessionId,
      sessionStartTime,
      validateResponse,
      accessKey: stored.validateKey || ''
    });
  }

  if (!sessionId) {
    return {
      ok: false,
      reason: 'missing_session_id',
      message: 'Missing editor session id.',
      redirectTo: '/validateurl'
    };
  }

  return {
    ok: true,
    stored,
    validateResponse,
    docData,
    sessionId,
    sessionStartTime,
    recovered,
    validateKey: stored.validateKey || ''
  };
}

export function resolveEditorUserInfo({ sessionSource, shareKeyCtx } = {}) {
  let username =
    normalizeIdentity(sessionSource?.emailId) ||
    normalizeIdentity(shareKeyCtx?.username);
  let uniqueId =
    sessionSource?.raw?.uniqueid ||
    sessionSource?.raw?._id ||
    sessionSource?.raw?.userid ||
    '';

  // Local login values are gate-only fallbacks for access/verification. They do
  // not populate window.USER_INFO or the identity used by error-mail reporting.
  if (!username && isLocalHost()) {
    const loginUser = readLoginUsername();
    if (loginUser) username = loginUser;
  }

  if ((!uniqueId || /^(null|undefined)$/i.test(String(uniqueId))) && isLocalHost()) {
    const loginId = readLoginUserId();
    if (loginId) uniqueId = loginId;
  }

  return {
    username: username || '',
    roleId: sessionSource?.roleId || shareKeyCtx?.roleid || '',
    roleName: sessionSource?.roleName || shareKeyCtx?.rolename || '',
    uniqueId: uniqueId || ''
  };
}

export function assertEditorAccess({ sessionId, userInfo } = {}) {
  if (!sessionId) {
    return {
      ok: false,
      reason: 'missing_session_id',
      message: 'Missing editor session id.',
      redirectTo: '/validateurl'
    };
  }

  if (!userInfo?.username) {
    devLog.warn('[assertEditorAccess] access denied: username was empty');
    return {
      ok: false,
      reason: 'access_denied',
      message: 'No user identity found for editor session.',
      redirectTo: '/validateurl'
    };
  }

  return { ok: true };
}

export async function verifyEditorSession(ctx) {
  const verify = await verifySession(ctx);
  if (!verify.ok) {
    return {
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    };
  }
  return {
    ok: true,
    bypassed: verify.bypassed === true
  };
}
