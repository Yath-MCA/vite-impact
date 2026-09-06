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

  it('returns ok:true when the request succeeds (no r field)', async () => {
    apiService.makeRequest.mockResolvedValue({ status: 'success' });

    const result = await saveDocument({ docId: 'DOC1', content: '<p>hi</p>' });

    expect(result).toEqual({ ok: true, message: 'Saved' });
    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/formfieldtofile',
      {
        tbl: 'Fileslist',
        subfolder: 'DOC1',
        status: 'active',
        sopt: 'openstorage',
        recent: 1,
        timestamp: expect.any(Number),
        filename: 'DOC1_updated',
        backup: '_updated',
        recordtype: 'save',
        keyname: 'a',
        a: encodeURIComponent('<p>hi</p>')
      },
      { method: 'POST' }
    );
  });

  it('sends recordtype: autosave when autoSave is true', async () => {
    apiService.makeRequest.mockResolvedValue({ status: 'success' });

    await saveDocument({ docId: 'DOC1', content: '<p>hi</p>', autoSave: true });

    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/formfieldtofile',
      expect.objectContaining({ recordtype: 'autosave' }),
      { method: 'POST' }
    );
  });

  it('returns ok:false with file_not_saved when the response has r === 0', async () => {
    apiService.makeRequest.mockResolvedValue({ r: 0 });

    const result = await saveDocument({ docId: 'DOC1', content: '<p>hi</p>' });

    expect(result).toEqual({
      ok: false,
      message: 'Save failed: file not saved',
      reason: 'file_not_saved'
    });
  });

  it('returns ok:false with already_finalized when the response has r === 2', async () => {
    apiService.makeRequest.mockResolvedValue({ r: 2 });

    const result = await saveDocument({ docId: 'DOC1', content: '<p>hi</p>' });

    expect(result).toEqual({
      ok: false,
      message: 'Document already finalized',
      reason: 'already_finalized'
    });
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
