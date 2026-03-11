/**
 * @file alertDispatcher.js
 * @description Pure function for dispatching alerts to toast or dialog
 * Can be called from non-React code via module-level ref
 */

import { toast } from 'react-hot-toast';

/**
 * Module-level ref for the alert dispatcher
 * Populated by EditorAlertProvider on mount
 */
export const alertDispatcherRef = { current: null };

/**
 * Message map for i18n resolution
 */
const MESSAGE_MAP = {
  deleteMutliPara: 'Cannot delete across multiple paragraphs',
  curOptRevertError: 'Current option cannot be reverted',
  Ignore_KeyEvent_Math: 'Editing not allowed in math elements',
  Ignore_KeyEvent_FM: 'Editing restricted in front matter',
  Ignore_KeyEvent_NoteQry: 'Cannot edit query comments',
  Ignore_KeyEvent_XREFS: 'Use the citation dialog to edit references',
  Ignore_Full_Format: 'Full formatting not allowed here',
  Last_char: 'Cannot delete the last character in {addText}',
  Ignore_ref_action: 'Reference action not allowed',
  Ignore_KeyEvent_Link: 'Use the link dialog to edit links',
  'FORMAT_REF_WARN': 'Formatting restricted in references',
  'Ignore_paste_full_text': 'Paste operation not allowed',
  'Dialog_Opened': 'A dialog is already open',
  'common-placeholder': 'Template placeholder: {text}',
  'Alt-txt': 'Alternate text: {text}'
};

/**
 * Resolve message key to human-readable text
 * @param {string} key - Message key
 * @param {Object} opts - Options with text substitutions
 * @returns {string}
 */
export const resolveMessage = (key, opts = {}) => {
  let message = MESSAGE_MAP[key] || key;
  
  // Replace placeholders
  if (opts.text) {
    message = message.replace('{text}', opts.text);
  }
  if (opts.addText) {
    message = message.replace('{addText}', opts.addText);
  }
  
  return message;
};

/**
 * Dispatch alert to appropriate channel
 * @param {Object} alert - Alert object { kind, msg, opts }
 */
export const dispatchAlert = (alert) => {
  if (!alert) return;
  
  const { kind, msg, opts = {} } = alert;
  const message = resolveMessage(msg, opts);
  
  try {
    if (kind === 'dialog') {
      // Dialog - use the ref to trigger modal
      if (alertDispatcherRef.current?.showDialog) {
        alertDispatcherRef.current.showDialog({
          title: opts.title || 'Warning',
          message,
          confirmBtn: opts.confirmBtn || 'OK',
          override: opts.override,
          text: opts.text
        });
      } else {
        // Fallback to toast if dialog not ready
        toast(message, { type: 'warning' });
      }
    } else {
      // Toaster - non-blocking
      const toastType = opts.type || 'info';
      toast(message, { type: toastType });
    }
  } catch (err) {
    console.warn('dispatchAlert error:', err.message);
  }
};

export default dispatchAlert;
