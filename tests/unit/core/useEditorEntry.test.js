import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('../../../src/services/core/editorEntry.js', () => ({
  resolveEditorEntryState: vi.fn(),
  verifyEditorEntry: vi.fn()
}));

import { useEditorEntry } from '../../../src/services/core/useEditorEntry.js';
import { resolveEditorEntryState, verifyEditorEntry } from '../../../src/services/core/editorEntry.js';

describe('useEditorEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes entryReady before verify resolves, then ready after', async () => {
    let resolveVerify;
    resolveEditorEntryState.mockResolvedValueOnce({
      ok: true,
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionSource: { client: 'LWW' },
      userInfo: { username: 'a@b.com' }
    });
    verifyEditorEntry.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveVerify = resolve;
      })
    );

    const { result } = renderHook(() => useEditorEntry({ docId: 'DOC1' }));

    await waitFor(() => expect(result.current.entryReady).toBe(true));
    expect(result.current.ready).toBe(false);
    expect(result.current.session.docId).toBe('DOC1');

    await act(async () => {
      resolveVerify({ ok: true, bypassed: false });
    });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.session.bypassed).toBe(false);
  });

  it('surfaces entry failure without ever calling verify', async () => {
    resolveEditorEntryState.mockResolvedValueOnce({
      ok: false,
      reason: 'no_doc_id',
      message: 'Missing document id.',
      redirectTo: '/validateurl'
    });

    const { result } = renderHook(() => useEditorEntry({ docId: '' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entryReady).toBe(false);
    expect(result.current.ready).toBe(false);
    expect(result.current.error.reason).toBe('no_doc_id');
    expect(verifyEditorEntry).not.toHaveBeenCalled();
  });

  it('surfaces verify failure after entryReady was already true', async () => {
    resolveEditorEntryState.mockResolvedValueOnce({
      ok: true,
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionSource: { client: 'LWW' },
      userInfo: { username: 'a@b.com' }
    });
    verifyEditorEntry.mockResolvedValueOnce({
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    });

    const { result } = renderHook(() => useEditorEntry({ docId: 'DOC1' }));

    await waitFor(() => expect(result.current.error?.reason).toBe('verify_failed'));
    expect(result.current.entryReady).toBe(true);
    expect(result.current.ready).toBe(false);
  });
});
