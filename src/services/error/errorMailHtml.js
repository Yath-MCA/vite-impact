/**
 * Mail HTML wrappers matching impactweb GET_MAIL_TABLE_FORMAT / stack formatting.
 */

/**
 * @param {{
 *   userRowsHtml?: string,
 *   errRowsHtml?: string,
 *   version?: string,
 *   domain?: string,
 *   envInfoHtml?: string
 * }} options
 */
export function buildMailTableHtml({
  userRowsHtml = '',
  errRowsHtml = '',
  version = '',
  domain = '',
  envInfoHtml = ''
} = {}) {
  return (
    `<p>Dear Team,</p>` +
    `<p>Sorry for the trouble. The file automatically sent to the Newgen Technical team for investigating the error. They will get back to you soon.</p>` +
    `<table><tbody>` +
    `${userRowsHtml || ''}` +
    `<tr><td class="align-top">Impact Version:</td><td class="" style="color: blue";>${version}</td></tr>` +
    `${envInfoHtml || ''}` +
    `<tr><td class="align-top">Domain :</td><td class="" style="color: #800000";>${domain}</td></tr>` +
    `${errRowsHtml || ''}` +
    `</tbody></table>`
  );
}

/**
 * Prefix module stack label and turn `at ` frames into `<br>at ` HTML.
 * Mirrors: stack.replace('Error', module + ' Stack:').replaceAllSplit('at ', '<br>at ').replaceAllSplit('<br><br>', '<br>')
 */
export function formatStackHtml(module, stack) {
  return String(stack || '')
    .replace('Error', `${module} Stack:`)
    .split('at ')
    .join('<br>at ')
    .split('<br><br>')
    .join('<br>');
}
