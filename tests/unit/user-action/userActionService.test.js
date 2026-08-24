import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: {
    getAdminDocs: vi.fn().mockResolvedValue({ data: [] }),
    makeRequest: vi.fn().mockResolvedValue({ r: 1 })
  },
  API_ENDPOINTS: {
    GET_ADMINDOCS: '/api/getadmindocs',
    FIND_UPDATE_INSERT: '/api/findupdateorinsert',
    UPDATE_INSERT: '/api/updateorinsert'
  }
}));

import { apiService } from '../../../src/services/api/apiService.js';
import { createUserActionService } from '../../../src/services/user-action/userActionService.js';

function installWindowState({ search = '?docid=DOC1' } = {}) {
  window.DOC_ID = 'DOC1';
  window.SHARED_KEY = { docid: 'DOC1' };
  window.USER_INFO = { MAIL_ID: 'user@example.com', TRACK_ROLE_NAME: 'Editor' };
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { search, pathname: '/editor', hostname: 'localhost' }
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

  it('persists activity under xmleditor:user_action_history:{docid} using the query-string docid', () => {
    const service = createUserActionService();
    service.trackDialogOpenClose('open', { dialog_id: 'D1' });
    const raw = localStorage.getItem('xmleditor:user_action_history:DOC1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw).open_close_dialog.D1[0].action).toBe('open');
  });

  it('payLoad().find.docid comes from the global doc id, independent of the localStorage key docid', () => {
    const service = createUserActionService();
    expect(service.payLoad().find.docid).toBe('DOC1');
    expect(service.payLoad().find.username).toBe('user@example.com');
    expect(service.payLoad().find.rolename).toBe('Editor');
  });

  it('trackDialogOpenClose stamps time_c/time_iso and legacy dialog fields', () => {
    const service = createUserActionService();
    service.trackDialogOpenClose('open', { dialog_id: 'D1', remark: 'find dialog' });
    const entry = service.history.open_close_dialog.D1[0];
    expect(entry).toMatchObject({ action: 'open', dialog_id: 'D1', remark: 'find dialog', _session: 1 });
    expect(typeof entry.time_c).toBe('number');
    expect(typeof entry.time_iso).toBe('string');
  });

  it('trackAttachmentsFlow builds the legacy filename/process/status payload', () => {
    const service = createUserActionService();
    service.trackAttachmentsFlow({ filename: 'a.pdf', process: 'upload', status: 'done' });
    const entry = service.history.attachments_flow[0];
    expect(entry).toMatchObject({
      filename: 'a.pdf',
      oldfilename: '',
      username: 'user@example.com',
      role: 'Editor',
      process: 'upload',
      status: 'done'
    });
  });

  it('skips sync when dialog map and tracked arrays are empty', async () => {
    const service = createUserActionService();
    await service.syncUserActionHistory();
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('syncs open_close_dialog activity via FIND_UPDATE_INSERT', async () => {
    const service = createUserActionService();
    service.trackDialogOpenClose('open', { dialog_id: 'D1' });
    await service.syncUserActionHistory();
    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/findupdateorinsert',
      expect.objectContaining({ tbl: 'UserPreference' }),
      {}
    );
  });

  it('syncs guided_tour activity via UPDATE_INSERT (not FIND_UPDATE_INSERT)', async () => {
    const service = createUserActionService();
    service.invoke('guided_tour');
    service.updateActivity('guided_tour', { step: 1 });
    // guided_tour is ignore_local_storage — force non-empty history via attachments_flow so the empty-history guard doesn't skip.
    service.trackAttachmentsFlow({ filename: 'a.pdf' });
    // trackAttachmentsFlow's internal updateActivity('attachments_flow', ...) re-invoked the attachments_flow
    // channel, clobbering the shared currentChannel pointer (this matches legacy's single this.instance
    // pointer exactly) — re-invoke guided_tour right before syncing so its endpoint is the one used.
    service.invoke('guided_tour');
    await service.syncUserActionHistory();
    expect(apiService.makeRequest).toHaveBeenCalledWith('/api/updateorinsert', expect.anything(), {});
  });

  it('does not persist ignore_local_storage channels (video_tour, guided_tour) to localStorage', () => {
    const service = createUserActionService();
    service.invoke('guided_tour');
    service.updateActivity('guided_tour', { step: 1 });
    expect(service.history.guided_tour).toEqual([]);
  });

  it('ignores Failed to fetch / NetworkError during keepalive unload sync', async () => {
    apiService.makeRequest.mockRejectedValueOnce(new TypeError('NetworkError when attempting to fetch resource'));
    const service = createUserActionService();
    service.trackAttachmentsFlow({ filename: 'a.pdf' });
    await expect(service.syncUserActionHistory({ keepalive: true })).resolves.toBeUndefined();
  });

  it('drops a concurrent syncUserActionHistory call while one is in flight', async () => {
    let resolveRequest;
    apiService.makeRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const service = createUserActionService();
    service.trackAttachmentsFlow({ filename: 'a.pdf' });

    const first = service.syncUserActionHistory();
    const second = service.syncUserActionHistory();
    resolveRequest({ r: 1 });
    await Promise.all([first, second]);

    expect(apiService.makeRequest).toHaveBeenCalledTimes(1);
  });
});
