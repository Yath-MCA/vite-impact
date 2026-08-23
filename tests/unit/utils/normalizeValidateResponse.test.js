import { describe, it, expect } from 'vitest';
import {
  normalizeValidateResponse,
  assertValidateAccess
} from '../../../src/utils/normalizeValidateResponse.js';

describe('normalizeValidateResponse', () => {
  it('maps docid from identifier fallback', () => {
    const normalized = normalizeValidateResponse({
      data: {
        identifier: 'DOC-ABC',
        client: 'oup',
        xmltohtmlres: { articletitle: 'Sample' },
        doi: '10.1000/xyz'
      }
    });

    expect(normalized.docid).toBe('DOC-ABC');
    expect(normalized.client).toBe('oup');
    expect(normalized.articletitle).toBe('Sample');
    expect(normalized.title).toBe('Sample');
    expect(normalized.doi).toBe('10.1000/xyz');
  });

  it('throws on denied validate response', () => {
    expect(() => assertValidateAccess({ r: 0 })).toThrow(/Access denied/i);
  });

  it('throws on expired validate response', () => {
    expect(() => assertValidateAccess({ data: { status: 'expired' }, r: 1 })).toThrow(/expired/i);
  });

  it('throws on IP blocked and deactive responses', () => {
    expect(() => assertValidateAccess({ r: 4 })).toThrow(/IP address/i);
    expect(() => assertValidateAccess({ data: { status: 'deactive' }, r: 1 })).toThrow(/deactivated/i);
  });

  it('throws signoff with a dedicated code and optional readonly redirect fields', () => {
    try {
      assertValidateAccess({ r: 1, data: { status: 'signoff', docid: 'DOC-1' } });
      throw new Error('expected throw');
    } catch (err) {
      expect(err.code).toBe('signoff');
      expect(err.docid).toBe('DOC-1');
      expect(err.expired).toBe(false);
    }
  });

  it('maps signed-off plus fdel to file_deleted', () => {
    try {
      assertValidateAccess({ r: 1, data: { status: 'signoff', fdel: true, docid: 'DOC-2' } });
      throw new Error('expected throw');
    } catch (err) {
      expect(err.code).toBe('file_deleted');
    }
  });
});
