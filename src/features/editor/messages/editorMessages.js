import { interpolateMessageEntry } from '../../../services/alerts/interpolateAlertText.js';
import { showAlertMessage } from '../../../services/alerts/showAlertMessage.js';
import { EDITOR_MESSAGES } from './editorMessageStore.js';

function cloneEntry(entry) {
  return JSON.parse(JSON.stringify(entry));
}

/**
 * Unique editor getter — never index EDITOR_MESSAGES outside this module.
 * @param {string} key legacy editor alert key
 * @param {object} [vars]
 * @param {{ phase?: 'prompt'|'success'|'cancel' }} [options]
 * @returns {object|null}
 */
export function getEditorMessage(key, vars = {}, options = {}) {
  const entry = EDITOR_MESSAGES[key];
  if (!entry) {
    console.warn(`[editor/messages] unknown key: ${key}`);
    return null;
  }

  const cloned = cloneEntry(entry);
  const phase = options.phase;

  if (phase && cloned[phase]) {
    return interpolateMessageEntry(cloned[phase], vars);
  }

  return interpolateMessageEntry(cloned, vars);
}

/**
 * Unique editor shower. Pass `phase` in overrides for triad prompts.
 */
export function showEditorMessage(key, vars = {}, swalOverrides = {}) {
  const entry = EDITOR_MESSAGES[key];
  if (!entry) {
    console.warn(`[editor/messages] unknown key: ${key}`);
    return Promise.resolve({ isConfirmed: false, isDismissed: true });
  }
  return showAlertMessage(cloneEntry(entry), vars, swalOverrides);
}

export function getAllEditorMessages() {
  return cloneEntry(EDITOR_MESSAGES);
}

export { EDITOR_MESSAGES };
