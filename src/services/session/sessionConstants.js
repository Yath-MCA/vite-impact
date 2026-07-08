export const SESSION_PROCESS = {
  CHECK: 'check',
  UPDATE_REQSTATUS_TIME: 'update_reqstatus_time',
  UPDATE_DOCSTATUS_REQSTATUS_INSERT_TIME: 'update_docstatus_reqstatus_insert_time',
  GETREQUESTSTATUS_PROCESS: 'getrequeststatus_process'
};

export const DOC_STATUS = {
  ACTIVE: '1',
  INACTIVE: '0',
  STALE: '8'
};

export const REQUEST_STATUS = {
  PENDING: '1',
  DELIVERED_TO_EDITOR: '2',
  RESOLVED: '3',
  REJECTED: '4',
  STALE: '7'
};

/** sessionStorage keys used by landing/editor handshake */
export const SESSION_STORAGE_KEYS = {
  VALIDATE_RESPONSE: 'xmleditor:validateuserpost',
  REDIRECT: 'redirect',
  SESSION_ID_PREFIX: 'xmleditor:sessionid:',
  DOC_ID: 'docid',
  LANDING_TAB_ID: 'xmleditor:landing:tabid'
};

/**
 * localStorage keys aligned with legacy saveLocalStorageData / StorageService.
 * SHARED_PREFIX + docId stores the full shared payload JSON.
 */
export const LOCAL_STORAGE_KEYS = {
  APP_KEY: 'xmleditor:appkey',
  API_KEY: 'xmleditor:apikey',
  SHARED_PREFIX: 'xmleditor:shared:',
  USERNAME_PREFIX: 'xmleditor:username:',
  USER_ROLE_PREFIX: 'xmleditor:userRole:',
  USER_COLOR_PREFIX: 'xmleditor:usercolor:',
  COLLAB_ENABLED_PREFIX: 'xmleditor:collabEnabled:'
};

export const DEFAULT_EDITOR_ROLE = 'Author';
