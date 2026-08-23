/**
 * Map catalog dialog entry → SweetAlert2 via the project plugin.
 * Supports flat dialog config and triad prompt/success/cancel shapes.
 */
import { Swal } from '../../shared/plugins/sweetalert/index.js';
import { interpolateMessageEntry } from './interpolateAlertText.js';

/**
 * @returns {Promise<object>} Swal result
 */
export async function showAlertMessage(entry, vars = {}, swalOverrides = {}) {
  if (!entry || typeof entry !== 'object') {
    console.warn('[alerts] showAlertMessage: missing entry');
    return { isConfirmed: false, isDismissed: true };
  }

  const { phase, ...overrides } = swalOverrides;
  let config = entry;

  if (entry.prompt && (phase || !entry.type)) {
    config = entry[phase || 'prompt'] || entry.prompt;
  }

  config = interpolateMessageEntry(config, vars);

  const title = config.title || '';
  const text = config.text || '';
  const iconRaw = config.icon || config.type || 'info';
  const icon = ['success', 'error', 'warning', 'info', 'question'].includes(iconRaw)
    ? iconRaw
    : 'info';

  const button1 = config.okText ?? config.button1 ?? '';
  const button2 = config.canText ?? config.button2 ?? '';
  const hideOutside = config.Options?.hide !== false;
  const hasHtml = /<[a-z][\s\S]*>/i.test(text);
  const body = hasHtml ? { html: text } : { text };

  // Both empty — informational with no buttons (e.g. unsupported browser)
  if (!button1 && !button2) {
    return Swal.fire({
      title,
      ...body,
      icon,
      showConfirmButton: false,
      allowOutsideClick: !hideOutside,
      ...overrides
    });
  }

  // Confirm + cancel
  if (button1 && button2) {
    return Swal.fire({
      title,
      ...body,
      icon,
      showCancelButton: true,
      confirmButtonText: button1,
      cancelButtonText: button2,
      allowOutsideClick: !hideOutside,
      reverseButtons: true,
      ...overrides
    });
  }

  // Single button (may be on button1 or button2 in legacy)
  return Swal.fire({
    title,
    ...body,
    icon,
    showConfirmButton: true,
    confirmButtonText: button1 || button2 || 'OK',
    allowOutsideClick: !hideOutside,
    ...overrides
  });
}
