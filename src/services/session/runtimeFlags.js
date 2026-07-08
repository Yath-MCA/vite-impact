const runtimeWindow = typeof window !== 'undefined' ? window : { location: { href: '' } };

/** True when current page URL is local development (localhost, 127.0.0.1, etc.). */
export function isLocalHost(href = runtimeWindow.location?.href) {
  const url = String(href || '').toLowerCase();
  return (
    url.includes('local') ||
    url.includes('127.0.0.1') ||
    url.includes('0.0.0.0')
  );
}
