import { SESSION_STORAGE_KEYS } from './sessionConstants.js';

export function getValidateResponse() {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setValidateResponse(response) {
  sessionStorage.setItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE, JSON.stringify(response));
}

export function commitSessionForEditor({ docId, sessionId, redirectUrl }) {
  if (docId && sessionId) {
    sessionStorage.setItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}${docId}`, String(sessionId));
    sessionStorage.setItem(SESSION_STORAGE_KEYS.DOC_ID, String(docId));
  }
  if (redirectUrl) {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.REDIRECT, redirectUrl);
  }
}

export function buildSessionContextFromDocData(docData, overrides = {}) {
  const validateResponse = getValidateResponse();
  const resData = validateResponse?.data ?? validateResponse ?? {};

  return {
    docId: docData?.docid || docData?.identifier || resData.docid || resData.identifier || '',
    client: docData?.client || resData.client || '',
    username: docData?.username || resData.username || resData.mail_id || resData.MAIL_ID || '',
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
