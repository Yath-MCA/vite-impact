import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../../../src/shared/utils/sanitizeHtml.js';

describe('sanitizeHtml', () => {
  it('strips script tags and event handlers', () => {
    const dirty = '<p onclick="alert(1)">Hi</p><script>alert(2)</script>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onclick');
    expect(clean).toContain('<p');
    expect(clean).toContain('Hi');
  });

  it('neutralizes javascript: urls', () => {
    const dirty = '<a href="javascript:alert(1)">x</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean.toLowerCase()).not.toContain('javascript:');
  });
});
