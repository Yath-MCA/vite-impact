import { describe, it, expect } from 'vitest';
import { getClientCopy } from '../../../src/features/landing/landingCopy.js';
import landingMeta from '../../../src/config/landing-meta.json';

describe('getClientCopy', () => {
  it('uses seven medknow/plos instruction bullets', () => {
    expect(getClientCopy('plos').instructions).toHaveLength(7);
    expect(getClientCopy('medknow').instructions).toHaveLength(7);
    expect(getClientCopy('plos').instructions).toEqual(getClientCopy('medknow').instructions);
  });

  it('shares disclaimer and third-party plugins across clients', () => {
    const oup = getClientCopy('oup');
    const lww = getClientCopy('lww');
    const plos = getClientCopy('plos');
    expect(oup.disclaimer).toBe(landingMeta.copy.common.disclaimer);
    expect(lww.disclaimer).toBe(oup.disclaimer);
    expect(plos.disclaimer).toBe(oup.disclaimer);
    expect(lww.thirdPartyPlugins).toEqual(oup.thirdPartyPlugins);
    expect(plos.thirdPartyPlugins).toEqual(landingMeta.copy.common.thirdPartyPlugins);
  });

  it('keeps an lww copy object and does not leak default notes', () => {
    expect(landingMeta.copy.clients.lww).toBeTruthy();
    const lww = getClientCopy('lww');
    expect(lww.notes).toEqual([]);
    expect(getClientCopy('default').notes).toEqual([]);
  });

  it('falls back oup placeholder instructions and empty support email to default', () => {
    const oup = getClientCopy('oup');
    const fallback = getClientCopy('default');
    expect(oup.instructions).toEqual(fallback.instructions);
    expect(oup.instructions).toHaveLength(4);
    expect(oup.supportEmail).toBe(fallback.supportEmail);
    expect(oup.supportEmail).toBe('impact.helpdesk@newgen.co');
  });

  it('uses default copy for an unknown client', () => {
    const unknown = getClientCopy('not-a-client');
    const fallback = getClientCopy('default');
    expect(unknown.instructions).toEqual(fallback.instructions);
    expect(unknown.supportEmail).toBe(fallback.supportEmail);
    expect(unknown.disclaimer).toBe(fallback.disclaimer);
  });

  it('returns notes when the client object has non-empty notes', () => {
    const notes = getClientCopy('lww', {
      copy: {
        common: landingMeta.copy.common,
        clients: {
          default: landingMeta.copy.clients.default,
          lww: {
            ...landingMeta.copy.clients.lww,
            notes: ['LWW note one', '']
          }
        }
      }
    });
    expect(notes.notes).toEqual(['LWW note one']);
  });
});
