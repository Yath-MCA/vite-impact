import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';

vi.mock('../../../src/services/session/runtimeFlags.js', () => ({
  isLocalHost: vi.fn(() => false)
}));

vi.mock('../../../src/shared/utils/devLogger.js', () => ({
  devLog: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';
import { devLog } from '../../../src/shared/utils/devLogger.js';
import { LOCAL_STORAGE_KEYS, SESSION_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';
import SessionGuard from '../../../src/services/core/SessionGuard.js';

describe('SessionGuard.checkStage', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    vi.clearAllMocks();
    isLocalHost.mockReturnValue(false);
  });

  it('passes when ctx has matching docId', () => {
    const guard = new SessionGuard();
    const result = guard.checkStage('init', { docId: 'DOC1', client: 'LWW' });
    expect(result).toEqual({ ok: true, bypassed: false, stage: 'init', remarks: '' });
  });

  it('fails closed when shareKey/ctx missing and not localhost', () => {
    const guard = new SessionGuard();
    const result = guard.checkStage('loading', null);
    expect(result.ok).toBe(false);
    expect(result.bypassed).toBe(false);
    expect(result.remarks).toBe('guard_fail:missing_doc_id');
  });

  it('bypasses on localhost when validation fails', () => {
    isLocalHost.mockReturnValue(true);
    const guard = new SessionGuard();
    const result = guard.checkStage('editorInit', null);
    expect(result.ok).toBe(true);
    expect(result.bypassed).toBe(true);
    expect(result.remarks).toContain('localhost_bypass:');
    expect(devLog.warn).toHaveBeenCalled();
  });

  it('reads localStorage shared key when ctx omitted but docid is in sessionStorage', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.DOC_ID, 'DOC1');
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`,
      JSON.stringify({ docid: 'DOC1', client: 'LWW' })
    );
    const guard = new SessionGuard();
    const result = guard.checkStage('init');
    expect(result.ok).toBe(true);
    expect(result.bypassed).toBe(false);
  });
});
