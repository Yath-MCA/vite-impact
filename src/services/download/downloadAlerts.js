import { showEditorMessage } from '../../features/editor/messages/editorMessages.js';
import { isJournal } from './downloadContext.js';

const TOAST_OVERRIDES = Object.freeze({
  toast: true,
  position: 'top-end',
  timer: 3500,
  showConfirmButton: false
});

export function notifyDownload(key, options = {}) {
  if (!key) return Promise.resolve(null);
  const useToast = options.toast === true || (options.toast !== false && isJournal());
  const overrides = {
    ...(useToast ? TOAST_OVERRIDES : {}),
    ...(options.type ? { icon: options.type } : {}),
    ...(options.overrides || {})
  };
  return showEditorMessage(key, options.vars || {}, overrides);
}

export function notifyPopupBlocked(url) {
  return showEditorMessage('PopupBlocker_New', { url }, { icon: 'warning' });
}
