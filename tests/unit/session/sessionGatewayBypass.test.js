import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';

vi.mock('../../../src/services/api/apiService.js', () => ({
  API_ENDPOINTS: { GET_DOCS: '/getdocs', LINK_SHARE: '/linksharing' },
  apiService: { makeRequest: vi.fn() }
}));

vi.mock('../../../src/services/session/runtimeFlags.js', () => ({
  isLocalHost: vi.fn(() => false)
}));

vi.mock('../../../src/shared/utils/devLogger.js', () => ({
  devLog: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { apiService } from '../../../src/services/api/apiService.js';
import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';
import { LOCAL_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';
import { verifySession } from '../../../src/services/session/sessionGateway.js';

describe('verifySession localhost bypass', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    vi.clearAllMocks();
    isLocalHost.mockReturnValue(false);
  });

  it('fails when no active row and not localhost', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ data: [] });
    const result = await verifySession({
      docId: 'DOC1',
      sessionId: 'SID1',
      username: 'a@b.com',
      rolename: 'Author'
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_active_row');
  });

  it('bypasses on localhost when no active row and shareKey exists', async () => {
    isLocalHost.mockReturnValue(true);
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`,
      JSON.stringify({ docid: 'DOC1', client: 'LWW', username: 'a@b.com' })
    );
    apiService.makeRequest.mockResolvedValueOnce({ data: [] });

    const result = await verifySession({
      docId: 'DOC1',
      sessionId: 'SID1',
      username: 'a@b.com',
      rolename: 'Author',
      client: 'LWW'
    });

    expect(result.ok).toBe(true);
    expect(result.bypassed).toBe(true);
    expect(result.remarks).toBe('localhost_bypass:no_linkshare_row');
  });

  it('does not bypass on localhost without shareKey', async () => {
    isLocalHost.mockReturnValue(true);
    apiService.makeRequest.mockResolvedValueOnce({ data: [] });

    const result = await verifySession({
      docId: 'DOC1',
      sessionId: 'SID1'
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_active_row');
  });
});
