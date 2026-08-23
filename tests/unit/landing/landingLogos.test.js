import { describe, it, expect } from 'vitest';
import landingMeta from '../../../src/config/landing-meta.json';
import {
  DEFAULT_IMPACT_LOGO_SRC,
  listLandingLogoSrcs,
  pickLogoSlot,
  resolveFaviconHref,
  resolveLogoSrc
} from '../../../src/features/landing/landingLogos.js';

describe('landingLogos', () => {
  it('maps a client filename to the public clients folder', () => {
    expect(resolveLogoSrc('OUP_WHITE.svg')).toBe('/assets/logo/clients/OUP_WHITE.svg');
  });

  it('passes through absolute paths and defaults empty names to IMPACT', () => {
    expect(resolveLogoSrc('/assets/logo/IMPACT_5_4.svg')).toBe('/assets/logo/IMPACT_5_4.svg');
    expect(resolveLogoSrc('')).toBe(DEFAULT_IMPACT_LOGO_SRC);
  });

  it('resolves oup header, footer, and favicon from urlvalidity client', () => {
    const srcs = listLandingLogoSrcs(landingMeta.logo.oup);
    expect(srcs).toContain('/assets/logo/clients/OUP_WHITE.svg');
    expect(srcs).toContain('/assets/logo/clients/OUP_FAVICON.svg');
    expect(srcs.every((src) => !src.includes('LWW') && !src.includes('PLOS'))).toBe(true);
    expect(resolveFaviconHref(landingMeta.logo.oup)).toBe('/assets/logo/clients/OUP_FAVICON.svg');
  });

  it('uses a non-white lww header logo and keeps the white footer logo', () => {
    expect(pickLogoSlot(landingMeta.logo.lww, 'header-logo')?.name).toBe('LWW.svg');
    expect(pickLogoSlot(landingMeta.logo.lww, 'footer-logo')?.name).toBe('LWW_WHITE_BOTTOM.svg');
    expect(listLandingLogoSrcs(landingMeta.logo.lww)).toContain('/assets/logo/clients/LWW.svg');
    expect(listLandingLogoSrcs(landingMeta.logo.lww)).toContain('/assets/logo/clients/LWW_WHITE_BOTTOM.svg');
  });

  it('picks TNF journal marks when dtd is jats', () => {
    const header = pickLogoSlot(landingMeta.logo.tnf, 'header-logo', 'jats');
    expect(header.name).toBe('TNF_JORUNAL.svg');
    expect(listLandingLogoSrcs(landingMeta.logo.tnf, 'jats')).toContain(
      '/assets/logo/clients/TNF_JORUNAL.svg'
    );
    expect(listLandingLogoSrcs(landingMeta.logo.tnf, 'jats')).not.toContain(
      '/assets/logo/clients/tfgroup.svg'
    );
  });

  it('keeps TNF book marks when dtd is not jats', () => {
    const header = pickLogoSlot(landingMeta.logo.tnf, 'header-logo', 'bits');
    expect(header.name).toBe('tfgroup.svg');
    expect(listLandingLogoSrcs(landingMeta.logo.tnf, 'bits')).toContain(
      '/assets/logo/clients/tfgroup.svg'
    );
  });
});
