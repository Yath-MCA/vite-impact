import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';
import { SESSION_STORAGE_KEYS, SESSION_REMARKS } from '../../../src/services/session/sessionConstants.js';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: {
    makeRequest: vi.fn()
  },
  API_ENDPOINTS: {
    LINK_SHARE: '/api/linksharing',
    GET_DOCS: '/api/getdocs'
  }
}));

vi.mock('../../../src/services/session/runtimeFlags.js', () => ({
  isLocalHost: vi.fn(() => false)
}));

vi.mock('../../../src/shared/utils/devLogger.js', () => ({
  devLog: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { apiService } from '../../../src/services/api/apiService.js';
import {
  loginFromLanding,
  verifySession,
  sendAccessRequest,
  continueBlockedSession,
  pollAndResolve,
  closeSessionFromEditor
} from '../../../src/services/session/sessionGateway.js';

const baseCtx = {
  docId: 'DOC123',
  client: 'oup',
  rolename: 'Author',
  username: 'a@b.com',
  sessionId: '48291037',
  sessionStartTime: '1700000000000'
};

const buildContext = (data, overrides = {}) => ({
  docId: data.docid,
  client: data.client,
  rolename: data.rolename,
  username: overrides.username || data.username,
  remarks: overrides.remarks,
  sessionId: '48291037',
  sessionStartTime: '1700000000000'
});

describe('sessionGateway verifySession', () => {
  beforeEach(() => {
    apiService.makeRequest.mockReset();
  });

  it('accepts a single matching active row', async () => {
    apiService.makeRequest.mockResolvedValueOnce({
      data: [{
        docid: 'DOC123',
        session_id: '48291037',
        session_start_time: '1700000000000',
        session_end_time: '0',
        docstatus: '1'
      }]
    });

    const result = await verifySession(baseCtx);
    expect(result.ok).toBe(true);
  });

  it('rejects when no active rows are returned', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ data: [] });
    const result = await verifySession(baseCtx);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_active_row');
  });

  it('rejects when multiple active rows are returned', async () => {
    apiService.makeRequest.mockResolvedValueOnce({
      data: [
        { docid: 'DOC123', session_id: '48291037', session_end_time: '0', docstatus: '1' },
        { docid: 'DOC123', session_id: '99999999', session_end_time: '0', docstatus: '1' }
      ]
    });

    const result = await verifySession(baseCtx);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('multiple_active');
  });

  it('rejects when session_start_time mismatches', async () => {
    apiService.makeRequest.mockResolvedValueOnce({
      data: [{
        docid: 'DOC123',
        session_id: '48291037',
        session_start_time: '1700000000999',
        session_end_time: '0',
        docstatus: '1'
      }]
    });

    const result = await verifySession(baseCtx);
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('record_mismatch');
  });
});

describe('sessionGateway loginFromLanding', () => {
  beforeEach(() => {
    apiService.makeRequest.mockReset();
    installBrowserStorageMocks();
  });

  it('grants and commits only after verify succeeds', async () => {
    apiService.makeRequest
      .mockResolvedValueOnce({ r: 1 })
      .mockResolvedValueOnce({
        data: [{
          docid: 'DOC123',
          session_id: '48291037',
          session_start_time: '1700000000000',
          session_end_time: '0',
          docstatus: '1'
        }]
      });

    const docData = { docid: 'DOC123', client: 'oup', rolename: 'Author', username: 'a@b.com' };
    const result = await loginFromLanding(docData, { buildContext });

    expect(result.status).toBe('granted');
    expect(apiService.makeRequest).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}DOC123`)).toBe('48291037');
    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID)).toBe('DOC123');
  });

  it('passes user_enter_valid_email remarks on check when provided', async () => {
    apiService.makeRequest
      .mockResolvedValueOnce({ r: 1 })
      .mockResolvedValueOnce({
        data: [{
          docid: 'DOC123',
          session_id: '48291037',
          session_start_time: '1700000000000',
          session_end_time: '0',
          docstatus: '1'
        }]
      });

    const docData = { docid: 'DOC123', client: 'oup', rolename: 'Author', username: 'c@d.com' };
    await loginFromLanding(docData, {
      buildContext,
      remarks: SESSION_REMARKS.USER_ENTER_VALID_EMAIL,
      username: 'c@d.com'
    });

    const checkCall = apiService.makeRequest.mock.calls[0][1];
    expect(checkCall.remarks).toBe('user_enter_valid_email');
    expect(checkCall.username).toBe('c@d.com');
  });

  it('returns verify_failed when grant verify does not match', async () => {
    apiService.makeRequest
      .mockResolvedValueOnce({ r: 1 })
      .mockResolvedValueOnce({ data: [] });

    const result = await loginFromLanding(
      { docid: 'DOC123' },
      { buildContext }
    );

    expect(result.status).toBe('verify_failed');
    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID)).toBeNull();
  });

  it('returns blocked when check denies access', async () => {
    apiService.makeRequest.mockResolvedValueOnce({
      r: 0,
      requeststatus: 0,
      requestid: 0,
      request_send_time: 0
    });

    const result = await loginFromLanding(
      { docid: 'DOC123' },
      { buildContext }
    );

    expect(result.status).toBe('blocked');
    expect(result.checkResponse.r).toBe(0);
  });

  it('returns denied when check rejects access', async () => {
    apiService.makeRequest.mockResolvedValueOnce({
      r: 2,
      remarks: 'Not allowed'
    });

    const result = await loginFromLanding(
      { docid: 'DOC123' },
      { buildContext }
    );

    expect(result.status).toBe('denied');
    expect(result.message).toBe('Not allowed');
  });
});

describe('sessionGateway sendAccessRequest branches', () => {
  beforeEach(() => {
    apiService.makeRequest.mockReset();
  });

  it('returns try_again for pending request inside throttle window', async () => {
    const recent = String(Date.now() - (5 * 60 * 1000));
    const result = await sendAccessRequest(baseCtx, {
      requeststatus: '1',
      request_send_time: recent,
      requestid: '111'
    });

    expect(result.type).toBe('try_again');
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('sends resend payload for rejected request outside throttle window', async () => {
    const old = String(Date.now() - (45 * 60 * 1000));
    apiService.makeRequest.mockResolvedValueOnce({ r: 1 });

    const result = await sendAccessRequest(baseCtx, {
      requeststatus: '4',
      request_send_time: old,
      requestid: '111222333'
    });

    expect(result.type).toBe('resend');
    expect(apiService.makeRequest).toHaveBeenCalledTimes(1);
    const payload = apiService.makeRequest.mock.calls[0][1];
    expect(payload.oldrequestid).toBe('111222333');
  });

  it('sends new request for default requeststatus', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ r: 1 });

    const result = await sendAccessRequest(baseCtx, {
      requeststatus: 0,
      requestid: 0,
      request_send_time: 0
    });

    expect(result.type).toBe('new_request');
    expect(apiService.makeRequest).toHaveBeenCalledTimes(1);
    const payload = apiService.makeRequest.mock.calls[0][1];
    expect(payload.process).toBe('update_reqstatus_time');
  });
});

describe('sessionGateway blocked continuation', () => {
  beforeEach(() => {
    apiService.makeRequest.mockReset();
    installBrowserStorageMocks();
  });

  it('enters waiting state after successful access request', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ r: 1 });

    const result = await continueBlockedSession(baseCtx, {
      requeststatus: 0,
      requestid: 0,
      request_send_time: 0
    });

    expect(result.status).toBe('waiting');
    expect(result.ctx.requestId).toBeTruthy();
  });

  it('grants after poll returns r:1', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ r: 1 });

    const result = await pollAndResolve({
      ...baseCtx,
      requestId: '999888777'
    });

    expect(result.status).toBe('granted');
    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID)).toBe('DOC123');
  });

  it('returns denied after poll returns r:2', async () => {
    apiService.makeRequest.mockResolvedValueOnce({
      r: 2,
      remarks: 'Rejected by collator'
    });

    const result = await pollAndResolve({
      ...baseCtx,
      requestId: '999888777'
    });

    expect(result.status).toBe('denied');
    expect(result.message).toBe('Rejected by collator');
  });
});

describe('sessionGateway loginFromLanding collab flag', () => {
  beforeEach(() => {
    apiService.makeRequest.mockReset();
    installBrowserStorageMocks();
  });

  it('blocks on r:0 when collab bypass is disabled (default)', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ r: 0, requeststatus: 0 });

    const result = await loginFromLanding(
      { docid: 'DOC123', collaborative: 'yes' },
      {
        buildContext: (data) => ({
          docId: data.docid,
          collaborative: data.collaborative,
          sessionId: '48291037',
          sessionStartTime: '1700000000000'
        })
      }
    );

    expect(result.status).toBe('blocked');
  });
});

describe('sessionGateway closeSessionFromEditor', () => {
  beforeEach(() => {
    apiService.makeRequest.mockReset();
  });

  it('posts linksharing close with user_manual_logout remarks', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ r: 1 });

    const result = await closeSessionFromEditor({
      docId: 'DOC123',
      sessionId: '48291037'
    });

    expect(result.ok).toBe(true);
    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/linksharing',
      expect.objectContaining({
        tbl: 'linksharing',
        process: 'close',
        docid: 'DOC123',
        session_id: '48291037',
        remarks: 'user_manual_logout'
      })
    );
  });

  it('returns failure when r is not 1', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ r: 0, remarks: 'denied' });
    const result = await closeSessionFromEditor({
      docId: 'DOC123',
      sessionId: '1'
    });
    expect(result.ok).toBe(false);
  });
});

describe('sessionGateway check classification and landing retry', () => {
  beforeEach(() => {
    apiService.makeRequest.mockReset();
    installBrowserStorageMocks();
  });

  it('returns error for DB-shaped r==0 instead of blocked', async () => {
    apiService.makeRequest.mockResolvedValueOnce({
      r: 0,
      message: 'Error while accessing DB for "check" request'
    });

    const result = await loginFromLanding(
      { docid: 'DOC123' },
      { buildContext }
    );

    expect(result.status).toBe('error');
  });

  it('retries verify after no_active_row then grants', async () => {
    apiService.makeRequest
      .mockResolvedValueOnce({ r: 1 })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ r: 1 })
      .mockResolvedValueOnce({
        data: [{
          docid: 'DOC123',
          session_id: '48291037',
          session_start_time: '1700000000000',
          session_end_time: '0',
          docstatus: '1'
        }]
      });

    const result = await loginFromLanding(
      { docid: 'DOC123', client: 'oup', rolename: 'Author', username: 'a@b.com' },
      { buildContext }
    );

    expect(result.status).toBe('granted');
    expect(apiService.makeRequest.mock.calls.length).toBeGreaterThanOrEqual(4);
  });
});
