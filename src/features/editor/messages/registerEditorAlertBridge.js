import { getAllEditorMessages, getEditorMessage } from './editorMessages.js';

/**
 * Expose legacy-compatible AlertMessages façade for GlobalBridge / LoadingDialog.
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
