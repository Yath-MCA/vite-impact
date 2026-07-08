/**
 * Interpolate legacy alert templates.
 * - {{TOKEN}} / {{{token}}} → vars[TOKEN] / vars[token]
 * - %1%, %2%, … → vars.replacements[0], … or vars.replace when string
 * - vars.find + vars.replace (legacy AlertNewDialog Access Denied)
 */
export function interpolateAlertText(input, vars = {}) {
  if (input == null) return input;
  if (typeof input !== 'string') return input;

  let text = input;
  const values = { ...vars };

  if (typeof values.find === 'string' && values.replace != null) {
    text = text.split(values.find).join(String(values.replace));
  }

  const replacements = Array.isArray(values.replacements)
    ? values.replacements
    : values.replace != null && values.find == null
      ? [values.replace]
      : null;

  if (replacements) {
    text = text.replace(/%(\d+)%/g, (_, n) => {
      const idx = Number(n) - 1;
      return replacements[idx] != null ? String(replacements[idx]) : `%${n}%`;
    });
  }

  text = text.replace(/\{\{\{?\s*([A-Za-z0-9_]+)\s*\}?\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(values, key) && values[key] != null) {
      return String(values[key]);
    }
    return match;
  });

  return text;
}

/** Deep-clone a message entry and interpolate string leaves. */
export function interpolateMessageEntry(entry, vars = {}) {
  if (entry == null || typeof entry !== 'object') return entry;

  const out = Array.isArray(entry) ? [] : {};
  for (const [key, value] of Object.entries(entry)) {
    if (typeof value === 'string') {
      out[key] = interpolateAlertText(value, vars);
    } else if (value && typeof value === 'object') {
      out[key] = interpolateMessageEntry(value, vars);
    } else {
      out[key] = value;
    }
  }
  return out;
}
