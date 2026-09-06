import { describe, it, expect } from 'vitest';
import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';

describe('isLocalHost', () => {
  it('returns true for localhost and loopback hostnames', () => {
    expect(isLocalHost('http://localhost:5173/validateurl')).toBe(true);
    expect(isLocalHost('http://127.0.0.1/')).toBe(true);
    expect(isLocalHost('http://127.0.0.1:5173/validateurl')).toBe(true);
    expect(isLocalHost('http://0.0.0.0:5173/')).toBe(true);
    expect(isLocalHost('http://[::1]:5173/')).toBe(true);
    expect(isLocalHost('http://app.localhost:5173/')).toBe(true);
  });

  it('returns false for production URLs including locale query params', () => {
    expect(isLocalHost('https://impact.example.com/editor?locale=en')).toBe(false);
    expect(isLocalHost('https://product.company.co/validateurl')).toBe(false);
    expect(isLocalHost('http://local.dev.company/validateurl')).toBe(false);
    expect(isLocalHost('')).toBe(false);
  });
});
