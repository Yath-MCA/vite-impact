import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../src/services/core/editorSessionStorage.js', () => ({
  getStoredEditorSession: vi.fn(),
  commitSessionForEditor: vi.fn(() => ({ ok: true, docId: 'DOC1' }))
}));

vi.mock('../../../src/services/session/sessionGateway.js', () => ({
  verifySession: vi.fn(),
  recoverEditorSessionByDocId: vi.fn()
}));

vi.mock('../../../src/services/core/shareKeyEntry.js', () => ({
  resolveShareKeyContext: vi.fn()
}));

vi.mock('../../../src/services/session/runtimeFlags.js', () => ({
  isLocalHost: vi.fn(() => false)
}));

import {
  resolveEditorDocId,
  resolveEditorEntryState,
  verifyEditorEntry
} from '../../../src/services/core/editorEntry.js';
import {
  getStoredEditorSession,
  commitSessionForEditor
} from '../../../src/services/core/editorSessionStorage.js';
import {
  verifySession,
  recoverEditorSessionByDocId
} from '../../../src/services/session/sessionGateway.js';
import { resolveShareKeyContext } from '../../../src/services/core/shareKeyEntry.js';
import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';
import { LOCAL_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';

describe('resolveEditorDocId', () => {
  it('uses explicit docId before URL query', () => {
    expect(resolveEditorDocId({ docId: 'DOC1', locationSearch: '?docid=DOC2' })).toBe('DOC1');
  });

  it('uses URL docid when explicit docId is missing', () => {
    expect(resolveEditorDocId({ locationSearch: '?docid=DOC2' })).toBe('DOC2');
  });
});

const shareKeyCtx = {
  docId: 'DOC1',
  client: 'LWW',
  username: 'a@b.com',
  roleid: '1',
  rolename: 'Author'
};

describe('resolveEditorEntryState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isLocalHost.mockReturnValue(false);
    localStorage.clear();
    resolveShareKeyContext.mockResolvedValue({
      ok: true,
      source: 'localStorage',
      ctx: shareKeyCtx
    });
  });

  afterEach(() => {
    localStorage.clear();
    isLocalHost.mockReturnValue(false);
  });

  it('resolves entry state from stored session without recovery', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      validateKey: 'KEY1',
      validateResponse: {
        data: {
          docid: 'DOC1',
          client: 'LWW',
          dtd: 'JATS',
          type: 'journals',
          username: 'a@b.com',
          roleid: '1',
          rolename: 'Author',
          uniqueid: 'UID1'
        }
      }
    });

    const result = await resolveEditorEntryState({ docId: 'DOC1' });

    expect(result.ok).toBe(true);
    expect(result.docId).toBe('DOC1');
    expect(result.sessionId).toBe('SID1');
    expect(result.sessionSource.client).toBe('LWW');
    expect(result.userInfo).toEqual({
      username: 'a@b.com',
      roleId: '1',
      roleName: 'Author',
      uniqueId: 'UID1'
    });
    expect(result.recovered).toBe(false);
    expect(resolveShareKeyContext).toHaveBeenCalledWith('DOC1');
    expect(recoverEditorSessionByDocId).not.toHaveBeenCalled();
  });

  it('recovers missing storage from backend and persists it', async () => {
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
        client: 'LWW',
        username: 'b@b.com',
        roleid: '2',
        rolename: 'Reviewer',
        uniqueid: 'UID2'
      }
    });

    const result = await resolveEditorEntryState({ docId: 'DOC1' });

    expect(commitSessionForEditor).toHaveBeenCalledWith({
      docId: 'DOC1',
      sessionId: 'SID2',
      sessionStartTime: '200',
      validateResponse: {
        data: expect.objectContaining({ docid: 'DOC1', session_id: 'SID2' })
      },
      accessKey: ''
    });
    expect(result.ok).toBe(true);
    expect(result.recovered).toBe(true);
  });

  it('fails no_doc_id when docId cannot be resolved', async () => {
    await expect(resolveEditorEntryState({})).resolves.toEqual({
      ok: false,
      reason: 'no_doc_id',
      message: 'Missing document id.',
      redirectTo: '/validateurl'
    });
  });

  it('blocks when recovery cannot find document data', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: '',
      sessionStartTime: '',
      validateKey: '',
      validateResponse: null
    });
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.'
    });

    await expect(resolveEditorEntryState({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.',
      redirectTo: '/validateurl'
    });
  });

  it('blocks when shareKey context cannot be resolved', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      validateKey: 'KEY1',
      validateResponse: { data: { docid: 'DOC1' } }
    });
    resolveShareKeyContext.mockResolvedValueOnce({
      ok: false,
      source: 'none',
      message: 'Unable to resolve shareKey context.'
    });

    await expect(resolveEditorEntryState({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'missing_share_key',
      message: 'Unable to resolve shareKey context.',
      redirectTo: '/validateurl'
    });
  });

  it('uses localhost login username after shareKey resolves', async () => {
    isLocalHost.mockReturnValue(true);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGIN_USERNAME, 'local@test.com');
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      validateKey: 'KEY1',
      validateResponse: { data: { docid: 'DOC1' } }
    });
    resolveShareKeyContext.mockResolvedValueOnce({
      ok: true,
      source: 'localStorage',
      ctx: { docId: 'DOC1', client: 'LWW', username: '' }
    });

    const result = await resolveEditorEntryState({ docId: 'DOC1' });

    expect(result.ok).toBe(true);
    expect(result.userInfo.username).toBe('local@test.com');
  });

  it('blocks when user identity is missing after shareKey resolve', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      validateKey: 'KEY1',
      validateResponse: { data: { docid: 'DOC1' } }
    });
    resolveShareKeyContext.mockResolvedValueOnce({
      ok: true,
      source: 'localStorage',
      ctx: { docId: 'DOC1', client: 'LWW', username: '' }
    });

    await expect(resolveEditorEntryState({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'access_denied',
      message: 'No user identity found for editor session.',
      redirectTo: '/validateurl'
    });
  });
});

describe('verifyEditorEntry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps verify failure to redirect shape', async () => {
    verifySession.mockResolvedValueOnce({ ok: false, reason: 'record_mismatch' });

    const entry = {
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      sessionSource: { emailId: 'a@b.com', roleId: '1', roleName: 'Author', raw: {} },
      shareKeyCtx: { username: 'a@b.com' },
      userInfo: { username: 'a@b.com' }
    };

    await expect(verifyEditorEntry(entry)).resolves.toEqual({
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    });
  });

  it('passes through ok and bypassed', async () => {
    verifySession.mockResolvedValueOnce({ ok: true, bypassed: true });

    const entry = {
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      sessionSource: { emailId: 'a@b.com', roleId: '1', roleName: 'Author', raw: {} },
      shareKeyCtx: { username: 'a@b.com' },
      userInfo: { username: 'a@b.com' }
    };

    await expect(verifyEditorEntry(entry)).resolves.toEqual({ ok: true, bypassed: true });
  });
});
