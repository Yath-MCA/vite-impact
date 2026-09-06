import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/session/sessionStorage.js', () => ({
  getStoredEditorSession: vi.fn(),
  commitSessionForEditor: vi.fn(() => ({ ok: true, docId: 'DOC1' }))
}));

vi.mock('../../../src/services/session/sessionGateway.js', () => ({
  verifySession: vi.fn(),
  recoverEditorSessionByDocId: vi.fn()
}));

vi.mock('../../../src/services/session/shareKeyContext.js', () => ({
  resolveShareKeyContext: vi.fn()
}));

import {
  bootstrapEditorSession,
  resolveEditorDocId
} from '../../../src/services/session/editorSessionBootstrap.js';
import {
  getStoredEditorSession,
  commitSessionForEditor
} from '../../../src/services/session/sessionStorage.js';
import {
  verifySession,
  recoverEditorSessionByDocId
} from '../../../src/services/session/sessionGateway.js';
import { resolveShareKeyContext } from '../../../src/services/session/shareKeyContext.js';

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

describe('bootstrapEditorSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveShareKeyContext.mockResolvedValue({
      ok: true,
      source: 'localStorage',
      ctx: shareKeyCtx
    });
  });

  it('opens a stored valid session after verification', async () => {
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
    verifySession.mockResolvedValueOnce({ ok: true, row: { docid: 'DOC1' } });

    const result = await bootstrapEditorSession({ docId: 'DOC1' });

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
    expect(verifySession).toHaveBeenCalledWith(
      expect.objectContaining({
        docId: 'DOC1',
        sessionId: 'SID1',
        username: 'a@b.com',
        roleid: '1',
        rolename: 'Author',
        client: 'LWW'
      })
    );
  });

  it('recovers missing storage from backend, persists it, then verifies', async () => {
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
    verifySession.mockResolvedValueOnce({ ok: true });

    const result = await bootstrapEditorSession({ docId: 'DOC1' });

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

    await expect(bootstrapEditorSession({ docId: 'DOC1' })).resolves.toEqual({
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

    await expect(bootstrapEditorSession({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'missing_share_key',
      message: 'Unable to resolve shareKey context.',
      redirectTo: '/validateurl'
    });
    expect(verifySession).not.toHaveBeenCalled();
  });

  it('blocks when verification fails', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      validateKey: 'KEY1',
      validateResponse: { data: { docid: 'DOC1', username: 'a@b.com' } }
    });
    verifySession.mockResolvedValueOnce({ ok: false, reason: 'record_mismatch' });

    await expect(bootstrapEditorSession({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    });
  });
});
