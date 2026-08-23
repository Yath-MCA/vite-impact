/**
 * Lightweight HTML sanitizer for trusted-but-untrusted branding HTML.
 * Strips scripts, event handlers, and dangerous URLs without a DOMPurify dependency.
 */
export function sanitizeHtml(input) {
  if (!input || typeof input !== 'string') return '';

  let html = input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<\/?\s*(iframe|object|embed|link|meta|base|form)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src|xlink:href)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '$1=$2#$2')
    .replace(/(href|src|xlink:href)\s*=\s*(['"])\s*data:text\/html[^'"]*\2/gi, '$1=$2#$2');

  return html;
}
