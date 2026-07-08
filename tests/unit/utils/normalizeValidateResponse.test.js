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
        xmltohtmlres: { articletitle: 'Sample' }
      }
    });

    expect(normalized.docid).toBe('DOC-ABC');
    expect(normalized.client).toBe('oup');
    expect(normalized.articletitle).toBe('Sample');
  });

  it('throws on denied validate response', () => {
    expect(() => assertValidateAccess({ r: 0 })).toThrow(/Access denied/i);
  });

  it('throws on expired validate response', () => {
    expect(() => assertValidateAccess({ data: { status: 'expired' }, r: 1 })).toThrow(/expired/i);
  });
});
