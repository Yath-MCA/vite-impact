import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { recordSubject, shouldSkipSubject } from '../../../src/services/error/errorSubjectMap.js';
import { shouldSkipMetaVisit } from '../../../src/services/error/errorVisitThrottle.js';

describe('errorSubjectMap', () => {
  beforeEach(() => {
    window.DOC_ID = 'DOC1';
    localStorage.clear();
  });
  afterEach(() => localStorage.clear());

  it('skips the same subject within 5 minutes', () => {
    const t0 = 1_000_000;
    recordSubject('SaveXml', t0);
    expect(shouldSkipSubject('SaveXml', t0 + 4 * 60 * 1000)).toBe(true);
    expect(shouldSkipSubject('SaveXml', t0 + 6 * 60 * 1000)).toBe(false);
  });

  it('persists under xmleditor:DOC1:ErrorList', () => {
    recordSubject('SaveXml', 1_000_000);
    const raw = localStorage.getItem('xmleditor:DOC1:ErrorList');
    expect(JSON.parse(raw)[0][0]).toBe('SaveXml');
  });
});

describe('errorVisitThrottle', () => {
  beforeEach(() => localStorage.clear());
  it('skips second visit inside 5 minutes', () => {
    const q = 'docid=DOC1';
    expect(shouldSkipMetaVisit(q, 1_000_000)).toBe(false);
    expect(shouldSkipMetaVisit(q, 1_000_000 + 60_000)).toBe(true);
  });

  it('returns true without throwing on malformed searchQuery', () => {
    expect(() => shouldSkipMetaVisit('%', 1_000_000)).not.toThrow();
    expect(shouldSkipMetaVisit('%', 1_000_000)).toBe(true);
  });
});
