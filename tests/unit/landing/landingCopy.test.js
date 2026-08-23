import { describe, it, expect } from 'vitest';
import { getClientCopy } from '../../../src/features/landing/landingCopy.js';
import landingMeta from '../../../src/config/landing-meta.json';

describe('getClientCopy', () => {
  it('returns client-specific welcome subtitles for journal clients', () => {
    expect(getClientCopy('lww').subtitle).toBe(
      'The online proofing tool for collaborating on proofing journal content for Wolters Kluwer Health, LLC.'
    );
    expect(getClientCopy('medknow').subtitle).toBe(
      'The online proofing tool for collaborating on proofing journal content for Wolters Kluwer - Medknow'
    );
    expect(getClientCopy('oup').subtitle).toBe(
      'The online proofing tool that permits authors to directly edit and collaborate on journal content for Oxford University Press.'
    );
    expect(getClientCopy('plos').subtitle).toBe(
      'The online proofing tool for collaborating on proofing journal content for Public Library of Science'
    );
    expect(getClientCopy('acs').subtitle).toBe(
      'The online proofing tool that permits authors to directly edit and collaborate on journal content for American Chemical Society.'
    );
    expect(getClientCopy('intellect').subtitle).toBe(
      'The online proofing tool for collaborating on proofing journal content for INTELLECT.'
    );
    expect(getClientCopy('brill').subtitle).toBe(
      'The online proofing tool for collaborating on proofing journal content for BRILL.'
    );
  });

  it('returns client-specific welcome subtitles for book clients', () => {
    expect(getClientCopy('oso').subtitle).toBe(
      'The online proofing tool that permits authors to directly edit and collaborate on book content for Oxford University Press.'
    );
    expect(getClientCopy('oho').subtitle).toBe(
      'The online proofing tool that permits authors to directly edit and collaborate on book content for Oxford University Press.'
    );
    expect(getClientCopy('oxmedo').subtitle).toBe(
      'The online proofing tool that permits authors to directly edit and collaborate on book content for Oxford Medical Online.'
    );
    expect(getClientCopy('tnf').subtitle).toBe(
      'The online proofing tool that permits authors to directly edit and collaborate on book content.'
    );
    expect(getClientCopy('lse').subtitle).toBe(
      'An online proofing tool that allows authors to directly edit and collaborate on book content'
    );
  });

  it('uses requested support email overrides', () => {
    expect(getClientCopy('default').supportEmail).toBe('impact.helpdesk@newgen.co');
    expect(getClientCopy('lse').supportEmail).toBe('impact.helpdesk.lse@newgen.co');
    expect(getClientCopy('tnf').supportEmail).toBe('impact.helpdesk.tnf@newgen.co');
    expect(getClientCopy('oso').supportEmail).toBe('impact.notification.oup@newgen.co');
  });

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
