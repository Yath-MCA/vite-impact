const SEEN_KEY_PREFIX = 'xmleditor:tourSeen:';

export function hasSeenTour(docId) {
  if (!docId || typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(`${SEEN_KEY_PREFIX}${docId}`) === 'true';
  } catch {
    return false;
  }
}

export function setHasSeenTour(docId, seen = true) {
  if (!docId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${SEEN_KEY_PREFIX}${docId}`, seen ? 'true' : 'false');
  } catch {
    // Quota exceeded or private-browsing restriction — silently no-op,
    // the tour just shows again next visit, never a hard failure.
  }
}
