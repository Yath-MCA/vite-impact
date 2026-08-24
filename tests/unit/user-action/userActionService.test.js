import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: {
    getAdminDocs: vi.fn().mockResolvedValue({ data: [] }),
    makeRequest: vi.fn().mockResolvedValue({ r: 1 })
  },
  API_ENDPOINTS: {
    GET_ADMINDOCS: '/api/getadmindocs',
    FIND_UPDATE_INSERT: '/api/findupdateorinsert'
  }
}));

import { apiService } from '../../../src/services/api/apiService.js';
import { createUserActionService } from '../../../src/services/user-action/userActionService.js';

function installWindowState() {
  window.DOC_ID = 'DOC1';
  window.SHARED_KEY = { docid: 'DOC1' };
  window.USER_INFO = { MAIL_ID: 'user@example.com', TRACK_ROLE_NAME: 'Editor' };
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { search: '?docid=DOC1', pathname: '/editor', hostname: 'localhost' }
  });
}

describe('userActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    installWindowState();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists activity under xmleditor:user_action_history:{docid}', () => {
    const service = createUserActionService();
    service.trackDialogOpenClose('D1', 'open');
    const raw = localStorage.getItem('xmleditor:user_action_history:DOC1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw).open_close_dialog.D1[0].action).toBe('open');
  });

  it('skips sync when dialog map and tracked arrays are empty', async () => {
    const service = createUserActionService();
    await service.syncUserActionHistory();
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('syncs via findupdateorinsert with UserPreference find query when history is non-empty', async () => {
    const service = createUserActionService();
    service.trackAttachmentsFlow({ id: 'f1' });
    await service.syncUserActionHistory();
    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/findupdateorinsert',
      expect.objectContaining({
        tbl: 'UserPreference',
        find: expect.objectContaining({ recordtype: 'user_action_history', docid: 'DOC1' })
      }),
      {}
    );
  });

  it('ignores Failed to fetch during keepalive unload sync', async () => {
    apiService.makeRequest.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const service = createUserActionService();
    service.trackAttachmentsFlow({ id: 'f1' });
    await expect(service.syncUserActionHistory({ keepalive: true })).resolves.toBeUndefined();
  });
});
