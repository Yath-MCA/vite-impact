import { normalizeSessionSource, toSessionContext } from '../session/sessionSource.js';
import { verifySession, recoverEditorSessionByDocId } from '../session/sessionGateway.js';
import { resolveShareKeyContext } from './shareKeyEntry.js';
import { getStoredEditorSession, commitSessionForEditor } from './editorSessionStorage.js';
import { LOCAL_STORAGE_KEYS } from '../session/sessionConstants.js';
import { isLocalHost } from '../session/runtimeFlags.js';
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

function resolveEditorUserInfo({ sessionSource, shareKeyCtx } = {}) {
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

function assertEditorAccess({ sessionId, userInfo } = {}) {
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

/**
 * Steps 1-5 of the editor entry gate: docId -> stored/recovered session ->
 * shareKey -> user info -> access assertion. Does not call verifySession --
 * see verifyEditorEntry, called separately so useEditorEntry can expose
 * entry-ready state before the DB verify round trip completes.
 */
export async function resolveEditorEntryState({
  docId,
  locationSearch = typeof window !== 'undefined' ? window.location.search : '',
  allowRecovery = true
} = {}) {
  const resolvedDocId = resolveEditorDocId({ docId, locationSearch });

  if (!resolvedDocId) {
    return {
      ok: false,
      reason: 'no_doc_id',
      message: 'Missing document id.',
      redirectTo: '/validateurl'
    };
  }

  const stored = getStoredEditorSession(resolvedDocId);
  let validateResponse = stored.validateResponse;
  let docData = validateResponse?.data ?? validateResponse ?? {};
  let sessionId = resolveSessionId(stored, docData);
  let sessionStartTime = resolveSessionStartTime(stored, docData);
  let recovered = false;

  if ((!validateResponse || !sessionId) && allowRecovery) {
    const recovery = await recoverEditorSessionByDocId(resolvedDocId);
    if (!recovery.ok) {
      return {
        ok: false,
        reason: recovery.reason,
        message: recovery.message,
        redirectTo: '/validateurl'
      };
    }

    recovered = true;
    docData = { ...recovery.docData, docid: resolvedDocId };
    validateResponse = { data: docData };
    sessionId = resolveSessionId(stored, docData);
    sessionStartTime = resolveSessionStartTime(stored, docData);

    commitSessionForEditor({
      docId: resolvedDocId,
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

  const shareKey = await resolveShareKeyContext(resolvedDocId);
  if (!shareKey.ok) {
    return {
      ok: false,
      reason: 'missing_share_key',
      message: shareKey.message || 'ShareKey details are required.',
      redirectTo: '/validateurl'
    };
  }

  const sessionSource = normalizeSessionSource(docData, validateResponse);
  const userInfo = resolveEditorUserInfo({ sessionSource, shareKeyCtx: shareKey.ctx });

  const access = assertEditorAccess({ sessionId, userInfo });
  if (!access.ok) {
    return access;
  }

  return {
    ok: true,
    docId: resolvedDocId,
    sessionId,
    sessionStartTime,
    validateKey: stored.validateKey || '',
    sessionSource,
    shareKeyCtx: shareKey.ctx,
    userInfo,
    recovered
  };
}

/**
 * Step 6b: the DB-match verify call, owned by services/session. Takes the
 * resolved entry state from resolveEditorEntryState and calls into
 * session/sessionGateway.verifySession.
 */
export async function verifyEditorEntry(entry) {
  const verify = await verifySession({
    ...toSessionContext(entry.sessionSource),
    ...entry.shareKeyCtx,
    docId: entry.docId,
    sessionId: entry.sessionId,
    sessionStartTime: entry.sessionStartTime,
    username: entry.userInfo.username || entry.shareKeyCtx.username
  });
  if (!verify.ok) {
    return {
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    };
  }
  return { ok: true, bypassed: verify.bypassed === true };
}
