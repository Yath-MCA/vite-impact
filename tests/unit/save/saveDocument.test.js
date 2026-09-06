import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: { makeRequest: vi.fn() },
  API_ENDPOINTS: { FORM_TO_FILE_FIELD: '/api/formfieldtofile' }
}));

import { apiService } from '../../../src/services/api/apiService.js';
import { saveDocument } from '../../../src/services/save/saveDocument.js';

describe('saveDocument', () => {
  beforeEach(() => {
    apiService.makeRequest.mockReset();
  });

  it('returns ok:true when the request succeeds', async () => {
    apiService.makeRequest.mockResolvedValue({ status: 'success' });

    const result = await saveDocument({ docId: 'DOC1', content: '<p>hi</p>' });

    expect(result).toEqual({ ok: true, message: 'Saved' });
    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/formfieldtofile',
      { docid: 'DOC1', content: '<p>hi</p>' },
      { method: 'POST' }
    );
  });

  it('returns ok:false with the error message when the request throws', async () => {
    apiService.makeRequest.mockRejectedValue(new Error('network down'));

    const result = await saveDocument({ docId: 'DOC1', content: '<p>hi</p>' });

    expect(result).toEqual({ ok: false, message: 'network down' });
  });

  it('returns a generic message when the thrown error has no message', async () => {
    apiService.makeRequest.mockRejectedValue({});

    const result = await saveDocument({ docId: 'DOC1', content: '<p>hi</p>' });

    expect(result).toEqual({ ok: false, message: 'Save failed' });
  });
});
