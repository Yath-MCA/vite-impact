import { describe, it, expect } from 'vitest';
import {
  checkBrowserCompatibility,
  isBrowserSupported,
  detectOS,
  BROWSER_REQUIREMENTS
} from '../../../src/services/landing/browserCompatibility.js';

describe('browserCompatibility', () => {
  it('allows modern Chrome on Windows', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    const info = checkBrowserCompatibility(ua);
    expect(info.browser).toBe('Chrome');
    expect(info.isAllowed).toBe(true);
    expect(info.isCompatible).toBe(true);
    expect(isBrowserSupported(ua)).toBe(true);
  });

  it('allows modern Firefox', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0';
    const info = checkBrowserCompatibility(ua);
    expect(info.browser).toBe('Firefox');
    expect(info.isCompatible).toBe(true);
  });

  it('blocks Internet Explorer in requirements', () => {
    expect(BROWSER_REQUIREMENTS['Internet Explorer'].allowed).toBe(false);
  });

  it('detects IE when documentMode is present', () => {
    Object.defineProperty(document, 'documentMode', {
      value: 11,
      configurable: true
    });
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Trident/7.0; rv:11.0) like Gecko';
    const info = checkBrowserCompatibility(ua);
    expect(info.browser).toBe('Internet Explorer');
    expect(info.isAllowed).toBe(false);
    expect(info.isCompatible).toBe(false);
    expect(isBrowserSupported(ua)).toBe(false);
    delete document.documentMode;
  });

  it('detects Windows OS version', () => {
    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(detectOS(ua)).toEqual({ os: 'Windows', osVersion: '10' });
  });
});
