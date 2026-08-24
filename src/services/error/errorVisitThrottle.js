const WINDOW_MS = 5 * 60 * 1000;

/**
 * Meta-error visit throttle. Key = visitData_ + decodeURIComponent(searchQuery).
 * Returns true when count > 1 inside the 5-minute window.
 * On decodeURIComponent / JSON.parse failure, returns true (fail closed / skip send).
 * @param {string} searchQuery location.search without leading '?'
 * @param {number} [now]
 * @returns {boolean}
 */
export function shouldSkipMetaVisit(searchQuery, now = Date.now()) {
  try {
    const key = `visitData_${decodeURIComponent(searchQuery)}`;
    let data = { count: 0, lastVisit: 0 };
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') data = parsed;
    }

    // Fixed window from stored lastVisit (not sliding).
    if (data.lastVisit && now - data.lastVisit < WINDOW_MS) {
      data.count = (Number(data.count) || 0) + 1;
      localStorage.setItem(key, JSON.stringify(data));
      return data.count > 1;
    }

    data.count = 1;
    data.lastVisit = now;
    localStorage.setItem(key, JSON.stringify(data));
    return false;
  } catch {
    // Legacy checkRepeatedError: fail closed / skip send
    return true;
  }
}
