// SessionGuard validates that required sessionStorage items are present and consistent
// with the current document initialization stage.
class SessionGuard {
  constructor() {}

  /**
   * Validate required keys for the given stage.
   * @param {string} stage - One of 'init', 'adminInit', 'loading', 'editorInit'.
   * @returns {boolean} true if validation passes, false otherwise.
   */
  checkStage(stage) {
    const docId = sessionStorage.getItem('DOC_ID');
    if (!docId) {
      console.warn(`[SessionGuard] Missing DOC_ID for stage ${stage}`);
      return false;
    }
    const sharedKeyRaw = sessionStorage.getItem(`xmleditor:shared:${docId}`);
    if (!sharedKeyRaw) {
      console.warn(`[SessionGuard] Missing sharedKey for DOC_ID ${docId}`);
      return false;
    }
    try {
      const sharedKey = JSON.parse(sharedKeyRaw);
      if (!sharedKey.docid || sharedKey.docid !== docId) {
        console.warn('[SessionGuard] sharedKey.docid mismatch', { docId, sharedKey });
        return false;
      }
    } catch (e) {
      console.warn('[SessionGuard] Invalid JSON in sharedKey', e);
      return false;
    }
    // Per‑stage additional checks can be added here.
    return true;
  }
}

export default SessionGuard;
