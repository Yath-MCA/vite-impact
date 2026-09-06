const COMMON_EDITOR_CSS = [
  'editor_common.css',
  'editor_ref_color.css',
  'editor_track_color.css',
  'editor_track_hide.css'
];

const loadedUrls = new Set();
const pendingUrls = new Map();

export function toRoleCssSlug(value) {
  return String(value || '')
    .trim()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

export function buildEditorCssUrls({ client, roleId, roleName, assetsBase = '/assets' } = {}) {
  const base = String(assetsBase || '/assets').replace(/\/+$/, '');
  const urls = COMMON_EDITOR_CSS.map((fileName) => `${base}/css/common/${fileName}`);
  const clientName = String(client || '').trim();
  if (clientName) {
    urls.push(`${base}/css/clients/${clientName.toUpperCase()}.css`);
  }

  const roleSlug = toRoleCssSlug(roleName || roleId);
  if (roleSlug) {
    urls.push(`${base}/css/roles/${roleSlug}.css`);
  }

  return urls;
}

function loadStylesheet(url) {
  if (loadedUrls.has(url)) return Promise.resolve(url);
  if (pendingUrls.has(url)) return pendingUrls.get(url);

  const existing = document.querySelector(`link[data-impact-editor-css][href="${url}"]`);
  if (existing) {
    loadedUrls.add(url);
    return Promise.resolve(url);
  }

  const promise = new Promise((resolve) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.dataset.impactEditorCss = 'true';
    link.onload = () => {
      loadedUrls.add(url);
      pendingUrls.delete(url);
      resolve(url);
    };
    link.onerror = () => {
      pendingUrls.delete(url);
      resolve(null);
    };
    document.head.appendChild(link);
  });

  pendingUrls.set(url, promise);
  return promise;
}

export async function loadEditorCss(options = {}) {
  if (typeof document === 'undefined') return [];
  const results = await Promise.all(buildEditorCssUrls(options).map(loadStylesheet));
  return results.filter(Boolean);
}

export function resetEditorCssLinks() {
  loadedUrls.clear();
  pendingUrls.clear();
}
