import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  API_ENDPOINTS: {
    GET_DOCS: '/getdocs'
  },
  apiService: {
    makeRequest: vi.fn()
  }
}));

import { apiService, API_ENDPOINTS } from '../../../src/services/api/apiService.js';
import { recoverEditorSessionByDocId } from '../../../src/services/session/sessionGateway.js';

describe('recoverEditorSessionByDocId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns first doc row when backend returns rows', async () => {
    apiService.makeRequest.mockResolvedValueOnce({
      data: [{ docid: 'DOC1', session_id: 'SID1', username: 'a@b.com' }]
    });

    const result = await recoverEditorSessionByDocId('DOC1');

    expect(apiService.makeRequest).toHaveBeenCalledWith(API_ENDPOINTS.GET_DOCS, { docid: 'DOC1' });
    expect(result).toEqual({
      ok: true,
      docData: { docid: 'DOC1', session_id: 'SID1', username: 'a@b.com' }
    });
  });

  it('returns no_doc_id when docId is missing', async () => {
    await expect(recoverEditorSessionByDocId('')).resolves.toEqual({
      ok: false,
      reason: 'no_doc_id',
      message: 'Missing document id.'
    });
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('returns no_document when backend returns no rows', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ data: [] });

    await expect(recoverEditorSessionByDocId('DOC1')).resolves.toEqual({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.'
    });
  });

  it('returns network_error when backend throws', async () => {
    apiService.makeRequest.mockRejectedValueOnce(new Error('down'));

    await expect(recoverEditorSessionByDocId('DOC1')).resolves.toEqual({
      ok: false,
      reason: 'network_error',
      message: 'Unable to recover document session.'
    });
  });
});
