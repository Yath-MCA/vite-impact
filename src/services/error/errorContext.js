const ACL_TEAM_IDS = ['5af956974b4bb40a34648f8e'];

export function getWindowRef() {
  return typeof window !== 'undefined' ? window : null;
}

export function getDocId() {
  const win = getWindowRef();
  return win?.DOC_ID || win?.SHARED_KEY?.docid || '';
}

export function getSharedKey() {
  const win = getWindowRef();
  return win?.SHARED_KEY && typeof win.SHARED_KEY === 'object' ? win.SHARED_KEY : {};
}

export function getUserInfo() {
  const win = getWindowRef();
  return win?.USER_INFO && typeof win.USER_INFO === 'object' ? win.USER_INFO : {};
}

export function isJournal() {
  const win = getWindowRef();
  const shared = getSharedKey();
  return Boolean(win?.IS_JOURNAL) || shared.dtd === 'JATS';
}

export function isLiveDomain() {
  return Boolean(getWindowRef()?.IS_LIVE_DOMAIN);
}

export function isUatDomain() {
  return Boolean(getWindowRef()?.IS_UAT_DOMAIN);
}

export function isLocalHost() {
  const win = getWindowRef();
  if (typeof win?.IS_LOCAL_HOST === 'boolean') return win.IS_LOCAL_HOST;
  const host = win?.location?.hostname || '';
  return host === 'localhost' || host === '127.0.0.1';
}

function resolveSessionId() {
  const win = getWindowRef();
  if (typeof win?.getSessionId === 'function') {
    try {
      return String(win.getSessionId() || '');
    } catch {
      // fall through
    }
  }
  return win?.SESSION_ID || '';
}

function resolveShortTitle(shared) {
  if (!isJournal()) return '';
  return (
    shared.shortitle ||
    shared.shorttitle ||
    shared.titleinfo?.cover ||
    ''
  );
}

/**
 * Session default bag equivalent to impactweb GET_JSON("default") / ADD_DEFAULT_KEYS.
 * @param {{ stripAcl?: boolean }} [options]
 */
export function getDefaultDocBag({ stripAcl = false } = {}) {
  const shared = getSharedKey();
  const user = getUserInfo();

  const bag = {
    client: shared.client,
    docid: getDocId() || shared.docid || '',
    username: user.MAIL_ID,
    role: shared.role || user.ROLE_ID,
    rolename: user.TRACK_ROLE_NAME || shared.rolename || 'null',
    roleid: user.ROLE_ID || shared.role || 'null',
    identifier: shared.identifier,
    session_id: resolveSessionId(),
    dtd: shared.dtd,
    linkinfo: shared.linkinfo,
    type: shared.type,
    projecttitle: shared.projecttitle,
    vendor: shared.vendor,
    shorttitle: resolveShortTitle(shared),
    projectname: shared.projectname || shared.titleinfo?.projectname || '',
    _r: [...ACL_TEAM_IDS],
    _w: [...ACL_TEAM_IDS]
  };

  if (stripAcl) {
    delete bag._w;
    delete bag._r;
  }

  return bag;
}

/**
 * Same field bag as GET_JSON("default_main") (legacy matches /default/i → ADD_DEFAULT_KEYS).
 */
export function getDefaultMainBag({ stripAcl = false } = {}) {
  return getDefaultDocBag({ stripAcl });
}
