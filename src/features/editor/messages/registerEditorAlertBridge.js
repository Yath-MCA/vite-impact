import { getAllEditorMessages, getEditorMessage } from './editorMessages.js';

/**
 * Expose legacy-compatible AlertMessages façade for GlobalBridge / LoadingDialog.
 * get() accepts legacy string keys (resolved via resolveEditorMessageKey in getEditorMessage).
 * getAll() returns the catalog keyed by EditorMessageKey values.
 * Safe to call multiple times.
 */
export function registerEditorAlertBridge(target = typeof window !== 'undefined' ? window : null) {
  if (!target) return;

  target.AlertMessages = {
    get(key) {
      return getEditorMessage(key) || null;
    },
    getAll() {
      return getAllEditorMessages();
    }
  };

  // Keep ALERT_MESSAGE in sync for any leftover legacy readers
  if (!target.ALERT_MESSAGE) {
    target.ALERT_MESSAGE = getAllEditorMessages();
  }
}

export default registerEditorAlertBridge;
