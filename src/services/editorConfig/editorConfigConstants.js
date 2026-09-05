const runtimeWindow = typeof window !== 'undefined' ? window : { ENV: {} };

const env = (windowKey, viteKey, defaultVal) => {
  if (runtimeWindow.ENV && runtimeWindow.ENV[windowKey] !== undefined) {
    return runtimeWindow.ENV[windowKey];
  }
  return import.meta.env[viteKey] ?? defaultVal;
};

export const editorConfigEnv = {
  bucketUrl: env('BUCKET_URL', 'VITE_BUCKET_URL', 'http://localhost/xmleditor/'),
  assetsBase: env('EDITOR_CONFIG_ASSETS_BASE', 'VITE_EDITOR_CONFIG_ASSETS_BASE', '/assets'),
  configVersion: env('EDITOR_CONFIG_VERSION', 'VITE_EDITOR_CONFIG_VERSION', 'v1')
};

export function buildDocumentContentUrl(docId) {
  const base = editorConfigEnv.bucketUrl.endsWith('/')
    ? editorConfigEnv.bucketUrl
    : `${editorConfigEnv.bucketUrl}/`;
  return `${base}${docId}/${docId}.html`;
}

export function buildClientConfigBasePath({ dtd, client }) {
  const dtdFolder = String(dtd || '').toUpperCase() === 'BITS' ? 'books' : 'journals';
  const clientLower = String(client || '').toLowerCase();
  return `${editorConfigEnv.assetsBase}/${editorConfigEnv.configVersion}/config/${dtdFolder}/${clientLower}/`;
}
