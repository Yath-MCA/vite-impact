import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../src/services/session/sessionStorage.js', () => ({
  getStoredEditorSession: vi.fn(),
  commitSessionForEditor: vi.fn(() => ({ ok: true, docId: 'DOC1' }))
}));

vi.mock('../../../src/services/session/sessionGateway.js', () => ({
  verifySession: vi.fn(),
  recoverEditorSessionByDocId: vi.fn()
}));

vi.mock('../../../src/services/session/runtimeFlags.js', () => ({
  isLocalHost: vi.fn(() => false)
}));

import {
  resolveEditorDocId,
  loadOrRecoverEditorSession,
  resolveEditorUserInfo,
  assertEditorAccess,
  verifyEditorSession
} from '../../../src/services/session/editorSessionSteps.js';
import {
  getStoredEditorSession,
  commitSessionForEditor
} from '../../../src/services/session/sessionStorage.js';
import {
  verifySession,
  recoverEditorSessionByDocId
} from '../../../src/services/session/sessionGateway.js';
import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';
import { LOCAL_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';

describe('resolveEditorDocId', () => {
  it('prefers explicit docId over query', () => {
    expect(resolveEditorDocId({ docId: 'DOC1', locationSearch: '?docid=DOC2' })).toBe('DOC1');
  });

  it('reads docid from query when explicit missing', () => {
    expect(resolveEditorDocId({ locationSearch: '?docid=DOC2' })).toBe('DOC2');
  });
});

describe('loadOrRecoverEditorSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns stored session without recovery when sessionId present', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      validateKey: 'KEY1',
      validateResponse: { data: { docid: 'DOC1', session_id: 'SID1' } }
    });

    const result = await loadOrRecoverEditorSession({ docId: 'DOC1' });

    expect(result.ok).toBe(true);
    expect(result.sessionId).toBe('SID1');
    expect(result.recovered).toBe(false);
    expect(recoverEditorSessionByDocId).not.toHaveBeenCalled();
  });

  it('recovers and commits when sessionId missing', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: '',
      sessionStartTime: '',
      validateKey: '',
      validateResponse: null
    });
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: true,
      docData: {
        docid: 'DOC1',
        session_id: 'SID2',
        session_start_time: '200',
        username: 'b@b.com'
      }
    });

    const result = await loadOrRecoverEditorSession({ docId: 'DOC1' });

    expect(result.ok).toBe(true);
    expect(result.recovered).toBe(true);
    expect(result.sessionId).toBe('SID2');
    expect(commitSessionForEditor).toHaveBeenCalled();
  });

  it('fails when recovery fails', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: '',
      validateResponse: null
    });
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.'
    });

    await expect(loadOrRecoverEditorSession({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.',
      redirectTo: '/validateurl'
    });
  });
});

describe('resolveEditorUserInfo', () => {
  afterEach(() => {
    localStorage.clear();
    isLocalHost.mockReturnValue(false);
  });

  it('builds from sessionSource', () => {
    const userInfo = resolveEditorUserInfo({
      sessionSource: {
        emailId: 'a@b.com',
        roleId: '1',
        roleName: 'Author',
        raw: { uniqueid: 'UID1' }
      }
    });
    expect(userInfo).toEqual({
      username: 'a@b.com',
      roleId: '1',
      roleName: 'Author',
      uniqueId: 'UID1'
    });
  });

  it('fills username from login storage on localhost when empty', () => {
    isLocalHost.mockReturnValue(true);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGIN_USERNAME, 'local@test.com');
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGIN_USERID, 'u99');

    const userInfo = resolveEditorUserInfo({
      sessionSource: { emailId: '', roleId: '', roleName: '', raw: {} },
      shareKeyCtx: { username: '' }
    });

    expect(userInfo.username).toBe('local@test.com');
    expect(userInfo.uniqueId).toBe('u99');
  });

  it('does not fill login storage off localhost', () => {
    isLocalHost.mockReturnValue(false);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGIN_USERNAME, 'local@test.com');

    const userInfo = resolveEditorUserInfo({
      sessionSource: { emailId: '', roleId: '', roleName: '', raw: {} },
      shareKeyCtx: { username: '' }
    });

    expect(userInfo.username).toBe('');
  });

  it('prefers shareKeyCtx.username when session email empty', () => {
    const userInfo = resolveEditorUserInfo({
      sessionSource: { emailId: '', roleId: '1', roleName: 'Author', raw: {} },
      shareKeyCtx: { username: 'from-share@x.com' }
    });
    expect(userInfo.username).toBe('from-share@x.com');
  });
});

describe('assertEditorAccess', () => {
  it('fails without sessionId', () => {
    expect(assertEditorAccess({
      sessionId: '',
      userInfo: { username: 'a@b.com' }
    })).toEqual({
      ok: false,
      reason: 'missing_session_id',
      message: 'Missing editor session id.',
      redirectTo: '/validateurl'
    });
  });

  it('fails without username', () => {
    expect(assertEditorAccess({
      sessionId: 'SID1',
      userInfo: { username: '' }
    })).toEqual({
      ok: false,
      reason: 'access_denied',
      message: 'No user identity found for editor session.',
      redirectTo: '/validateurl'
    });
  });

  it('passes with sessionId and username', () => {
    expect(assertEditorAccess({
      sessionId: 'SID1',
      userInfo: { username: 'a@b.com' }
    })).toEqual({ ok: true });
  });
});

describe('verifyEditorSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps verify failure to redirect shape', async () => {
    verifySession.mockResolvedValueOnce({ ok: false, reason: 'record_mismatch' });

    await expect(verifyEditorSession({ docId: 'DOC1', sessionId: 'SID1' })).resolves.toEqual({
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    });
  });

  it('passes through ok and bypassed', async () => {
    verifySession.mockResolvedValueOnce({ ok: true, bypassed: true });

    await expect(verifyEditorSession({ docId: 'DOC1', sessionId: 'SID1' })).resolves.toEqual({
      ok: true,
      bypassed: true
    });
  });
});
