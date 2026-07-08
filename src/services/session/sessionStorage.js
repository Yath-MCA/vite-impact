import {
  DEFAULT_EDITOR_ROLE,
  LOCAL_STORAGE_KEYS,
  SESSION_STORAGE_KEYS
} from './sessionConstants.js';

/** In-memory validate payload until grant+verify succeeds (legacy pendingCommitResData). */
let pendingValidateResponse = null;

export function getPendingValidateResponse() {
  return pendingValidateResponse;
}

export function setPendingValidateResponse(response) {
  pendingValidateResponse = response ?? null;
}

export function clearPendingValidateResponse() {
  pendingValidateResponse = null;
}

/** Persist validate URL access key so editor can renew tab lock with key match. */
export function setValidateAccessKey(accessKey) {
  if (typeof sessionStorage === 'undefined') return;
  if (accessKey) {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.VALIDATE_KEY, String(accessKey));
  }
}

export function getValidateAccessKey() {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(SESSION_STORAGE_KEYS.VALIDATE_KEY) || '';
}

export function clearValidateAccessKey() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.VALIDATE_KEY);
}

/** Clear handshake keys so a fresh validateurl can start after logout. */
export function clearEditorSessionHandshake({ clearValidateKey = false } = {}) {
  if (typeof sessionStorage === 'undefined') return;
  const docId = sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID);
  if (docId) {
    sessionStorage.removeItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}${docId}`);
  }
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.DOC_ID);
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.REDIRECT);
  if (clearValidateKey) {
    clearValidateAccessKey();
  }
}

export function getEditorSessionContextFromStorage() {
  if (typeof sessionStorage === 'undefined') {
    return { docId: '', sessionId: '', accessKey: '' };
  }
  const docId = sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID) || '';
  const sessionId = docId
    ? sessionStorage.getItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}${docId}`) || ''
    : '';
  const accessKey = getValidateAccessKey();
  return { docId, sessionId, accessKey };
}

export function getValidateResponse() {
  if (pendingValidateResponse) return pendingValidateResponse;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist validate response only after session grant (or explicit force). */
export function setValidateResponse(response, { persist = false } = {}) {
  pendingValidateResponse = response ?? null;
  if (!persist || !response) return;
  sessionStorage.setItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE, JSON.stringify(response));
}

function resolveEmailId(resData) {
  const emailto = resData?.emailto;
  if (Array.isArray(emailto)) {
    if (emailto.length === 1) return emailto[0];
    return resData.username || resData.mail_id || resData.MAIL_ID || emailto[0] || '';
  }
  return emailto || resData?.username || resData?.mail_id || resData?.MAIL_ID || '';
}

function isCollabEnabled(resData) {
  const client = String(resData?.client || '').toLowerCase();
  const collaborative = String(resData?.collaborative || '').toLowerCase();
  return client === 'oso' && collaborative === 'yes';
}

function resolveUserColor(resData, emailId, isCollab) {
  const status = String(resData?.status || '').toLowerCase();
  const isActive = !status || status === 'active' || status === '1';
  if (!isActive) return 0;

  if (isCollab && Array.isArray(resData?.emailto)) {
    const index = resData.emailto.indexOf(emailId);
    return index >= 0 ? index + 1 : 55;
  }
  return resData?.sharedcolor || 99;
}

/**
 * Legacy-compatible localStorage commit used by editor SharedKeyService / StorageService.
 */
export function saveLegacyLocalStorageData(resData) {
  console.log("saveLegacyLocalStorageData");
  if (window.location.href.includes("local")) debugger;
  if (!resData) return { ok: false, reason: 'missing_res_data' };

  const docid = resData.docid || resData.docId;
  const apikey = resData.apikey;
  const emailto = resData.emailto;

  if (!(apikey || (docid && emailto))) {
    return { ok: false, reason: 'missing_apikey_or_email' };
  }

  const emailId = resolveEmailId(resData);
  const isCollab = isCollabEnabled(resData);
  const userColor = resolveUserColor(resData, emailId, isCollab);

  localStorage.setItem(LOCAL_STORAGE_KEYS.APP_KEY, 'xmleditor');
  if (apikey) {
    localStorage.setItem(LOCAL_STORAGE_KEYS.API_KEY, String(apikey));
  }
  if (docid) {
    localStorage.setItem(`${LOCAL_STORAGE_KEYS.SHARED_PREFIX}${docid}`, JSON.stringify(resData));
    localStorage.setItem(`${LOCAL_STORAGE_KEYS.USERNAME_PREFIX}${docid}`, String(emailId || ''));
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.USER_ROLE_PREFIX}${docid}`,
      String(resData.role || DEFAULT_EDITOR_ROLE)
    );
    localStorage.setItem(`${LOCAL_STORAGE_KEYS.USER_COLOR_PREFIX}${docid}`, String(userColor));
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.COLLAB_ENABLED_PREFIX}${docid}`,
      isCollab ? 'true' : 'false'
    );
  }

  return { ok: true, docid };
}

export function commitSessionForEditor({
  docId,
  sessionId,
  redirectUrl,
  validateResponse,
  accessKey
} = {}) {
  const response = validateResponse || getValidateResponse();
  const resData = response?.data ?? response ?? null;

  if (response) {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE, JSON.stringify(response));
    pendingValidateResponse = response;
  }

  if (resData) {
    saveLegacyLocalStorageData({
      ...resData,
      docid: docId || resData.docid
    });
  }

  const resolvedDocId = docId || resData?.docid || resData?.identifier;
  if (resolvedDocId && sessionId) {
    sessionStorage.setItem(
      `${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}${resolvedDocId}`,
      String(sessionId)
    );
    sessionStorage.setItem(SESSION_STORAGE_KEYS.DOC_ID, String(resolvedDocId));
  }

  if (accessKey) {
    setValidateAccessKey(accessKey);
  }

  if (redirectUrl) {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.REDIRECT, redirectUrl);
  }

  return { ok: true, docId: resolvedDocId };
}

export function buildSessionContextFromDocData(docData, overrides = {}) {
  console.log("---buildSessionContextFromDocData----");
  const validateResponse = getValidateResponse();
  const resData = validateResponse?.data ?? validateResponse ?? {};
  const username = resolveEmailId(resData);

  return {
    docId: docData?.docid || docData?.identifier || resData.docid || resData.identifier || '',
    client: docData?.client || resData.client || '',
    username: username || '',
    role: docData?.role || resData.role || resData.roleid || resData.ROLE_ID || '',
    rolename: docData?.rolename || resData.rolename || resData.ROLENAME || '',
    roleid: docData?.roleid || resData.roleid || resData.ROLE_ID || '',
    identifier: docData?.identifier || resData.identifier || '',
    dtd: docData?.dtd || resData.dtd || '',
    linkinfo: docData?.linkinfo || resData.linkinfo || '',
    type: docData?.type || resData.type || '',
    projecttitle: docData?.projecttitle || resData.projecttitle || '',
    vendor: docData?.vendor || resData.vendor || '',
    shorttitle: docData?.shorttitle || resData.shorttitle || '',
    collaborative: docData?.collaborative || resData.collaborative,
    ...overrides
  };
}
