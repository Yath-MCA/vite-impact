import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';

vi.mock('../../../src/services/session/sessionGateway.js', () => ({
  recoverEditorSessionByDocId: vi.fn()
}));

import { LOCAL_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';
import { recoverEditorSessionByDocId } from '../../../src/services/session/sessionGateway.js';
import {
  readShareKeyFromLocalStorage,
  resolveShareKeyContext
} from '../../../src/services/session/shareKeyContext.js';

describe('shareKeyContext', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    vi.clearAllMocks();
  });

  it('reads matching shared payload from localStorage', () => {
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`,
      JSON.stringify({ docid: 'DOC1', client: 'LWW', username: 'a@b.com', roleid: '1', rolename: 'Author' })
    );

    const raw = readShareKeyFromLocalStorage('DOC1');
    expect(raw.docid).toBe('DOC1');
    expect(raw.client).toBe('LWW');
  });

  it('resolves ctx from localStorage without calling GET_DOCS', async () => {
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`,
      JSON.stringify({ docid: 'DOC1', client: 'LWW', username: 'a@b.com', roleid: '1', rolename: 'Author' })
    );

    const result = await resolveShareKeyContext('DOC1');

    expect(result.ok).toBe(true);
    expect(result.source).toBe('localStorage');
    expect(result.ctx.docId).toBe('DOC1');
    expect(result.ctx.client).toBe('LWW');
    expect(recoverEditorSessionByDocId).not.toHaveBeenCalled();
  });

  it('falls back to GET_DOCS when localStorage shared is missing', async () => {
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: true,
      docData: {
        docid: 'DOC1',
        client: 'LWW',
        username: 'b@b.com',
        roleid: '2',
        rolename: 'Reviewer',
        apikey: 'k1',
        emailto: 'b@b.com'
      }
    });

    const result = await resolveShareKeyContext('DOC1');

    expect(recoverEditorSessionByDocId).toHaveBeenCalledWith('DOC1');
    expect(result.ok).toBe(true);
    expect(result.source).toBe('getdocs');
    expect(result.ctx.docId).toBe('DOC1');
    expect(localStorage.getItem(`${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`)).toBeTruthy();
  });

  it('returns not ok when docId missing', async () => {
    await expect(resolveShareKeyContext('')).resolves.toEqual({
      ok: false,
      source: 'none',
      message: 'Missing document id.'
    });
  });

  it('returns not ok when localStorage and GET_DOCS both fail', async () => {
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.'
    });

    const result = await resolveShareKeyContext('DOC1');
    expect(result.ok).toBe(false);
    expect(result.source).toBe('none');
  });
});
