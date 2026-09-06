import { normalizeSessionSource, toSessionContext } from './sessionSource.js';
import {
  commitSessionForEditor,
  getStoredEditorSession
} from './sessionStorage.js';
import {
  recoverEditorSessionByDocId,
  verifySession
} from './sessionGateway.js';

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
  return stored.sessionStartTime || docData?.session_start_time || docData?.sessionStartTime || '';
}

function buildUserInfo(sessionSource) {
  return {
    username: sessionSource.emailId || '',
    roleId: sessionSource.roleId || '',
    roleName: sessionSource.roleName || '',
    uniqueId: sessionSource.raw?.uniqueid || sessionSource.raw?._id || sessionSource.raw?.userid || ''
  };
}

export function resolveEditorDocId({ docId, locationSearch } = {}) {
  return docId || readQueryDocId(locationSearch) || '';
}

export async function bootstrapEditorSession({
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

  const sessionSource = normalizeSessionSource(docData, validateResponse);
  const userInfo = buildUserInfo(sessionSource);
  const verify = await verifySession({
    ...toSessionContext(sessionSource),
    docId: resolvedDocId,
    sessionId,
    sessionStartTime,
    username: userInfo.username
  });

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
    docId: resolvedDocId,
    sessionId,
    sessionStartTime,
    validateKey: stored.validateKey || '',
    sessionSource,
    userInfo,
    recovered
  };
}
