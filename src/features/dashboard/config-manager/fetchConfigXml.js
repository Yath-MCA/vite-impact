/** Shared XML config loads — dedupes StrictMode remount storms for the same path. */
const xmlInflight = new Map();

/**
 * Load config XML once per path while in flight.
 * Returns a plain result so remounts can safely re-read the body
 * (Response bodies are single-consume).
 */
export function fetchConfigXml(path) {
  const existing = xmlInflight.get(path);
  if (existing) return existing;

  const request = fetch(path)
    .then(async (response) => {
      const text = response.ok ? await response.text() : '';
      return {
        ok: response.ok,
        status: response.status,
        text
      };
    })
    .finally(() => {
      xmlInflight.delete(path);
    });

  xmlInflight.set(path, request);
  return request;
}
