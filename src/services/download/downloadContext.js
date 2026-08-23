export function lastSegment(value) {
  const parts = String(value || '').split('/').filter(Boolean);
  return parts[parts.length - 1] || String(value || '');
}

export function slugifyRoleName(roleName) {
  return String(roleName || '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_.-]/g, '_');
}

export function joinUrl(base, filePath) {
  return `${String(base || '').replace(/\/+$/, '')}/${String(filePath || '').replace(/^\/+/, '')}`;
}

export function getWindowRef() {
  return typeof window !== 'undefined' ? window : null;
}

export function getApiPath() {
  const win = getWindowRef();
  return win?.API_PATH || '/api/';
}

export function getBucketUrl() {
  const win = getWindowRef();
  return win?.BUCKET_URL || win?.LOCAL_CONNECT_SERVER?.BUCKET_URL || '';
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

export function isEditorPage() {
  const win = getWindowRef();
  if (typeof win?.IS_EDITOR_PAGE === 'boolean') return win.IS_EDITOR_PAGE;
  return Boolean(win?.location?.pathname?.includes('/editor'));
}

export function isTrackView() {
  const win = getWindowRef();
  return Boolean(win?.IS_TRACK_VIEW);
}

export function isJournal() {
  const win = getWindowRef();
  return Boolean(win?.IS_JOURNAL);
}

export function getHost() {
  const win = getWindowRef();
  return win?.location?.host || '';
}

export function getSupportClientCode() {
  try {
    const shared = getSharedKey();
    if (shared.client) return String(shared.client).toUpperCase();
    const win = getWindowRef();
    const path = decodeURIComponent(win?.location?.pathname || '');
    const fromHtml = path.match(/validateurl(\w+)\.html/i);
    if (fromHtml?.[1]) return fromHtml[1].toUpperCase();
    const fromRoute = path.match(/validateurl\/([^/]+)/i);
    if (fromRoute?.[1]) return fromRoute[1].toUpperCase();
  } catch (err) {
    console.warn(err.message);
  }
  return '';
}

export function getRoleDetails() {
  const shared = getSharedKey();
  const user = getUserInfo();
  const editor = isEditorPage();
  const roleName = !editor && shared.rolename ? shared.rolename : (user.ROLE_NAME || '');
  const roleId = !editor && shared.role ? shared.role : (user.ROLE_ID || '');
  return {
    roleName: slugifyRoleName(roleName),
    roleId: slugifyRoleName(roleId)
  };
}

export function safeProjectName(sharedKey = getSharedKey()) {
  if (!sharedKey || typeof sharedKey !== 'object') return '';
  if (sharedKey.projectname) return sharedKey.projectname;
  if (sharedKey.titleinfo?.projectname) return sharedKey.titleinfo.projectname;
  if (sharedKey.manuscriptno) return sharedKey.manuscriptno;
  if (sharedKey.fileid) return sharedKey.fileid;
  if (sharedKey.identifier) return lastSegment(sharedKey.identifier);
  return '';
}

export function normalizeDownloadOptions(options = {}) {
  return {
    list: options?.list || '',
    name: options?.name || '',
    dirlist: options?.dirlist || '',
    org_name_list: options?.org_name_list || ''
  };
}

export function logDownloadError(source, err) {
  const message = err?.message || String(err || '');
  console.warn(`[download:${source}]`, message);
}
