import { describe, it, expect } from 'vitest';
import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';

describe('isLocalHost', () => {
  it('returns true when href contains local', () => {
    expect(isLocalHost('http://localhost:5173/validateurl')).toBe(true);
    expect(isLocalHost('http://local.dev.company/validateurl')).toBe(true);
    expect(isLocalHost('http://127.0.0.1/local/test')).toBe(true);
  });

  it('returns true for loopback addresses', () => {
    expect(isLocalHost('http://127.0.0.1:5173/validateurl')).toBe(true);
    expect(isLocalHost('http://0.0.0.0:5173/')).toBe(true);
  });

  it('returns false when href is not local development', () => {
    expect(isLocalHost('https://product.company.co/validateurl')).toBe(false);
    expect(isLocalHost('')).toBe(false);
  });
});
