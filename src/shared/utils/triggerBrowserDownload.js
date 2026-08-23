/**
 * Trigger a browser file download from a Blob or object URL.
 * Revokes object URLs created here after the click.
 */
export function triggerBrowserDownload(source, fileName = 'download') {
  if (typeof document === 'undefined') return false;

  const createdUrl = source instanceof Blob ? URL.createObjectURL(source) : '';
  const href = createdUrl || source;
  if (!href) return false;

  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = fileName;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  if (createdUrl) {
    setTimeout(() => URL.revokeObjectURL(createdUrl), 0);
  }
  return true;
}
