import { describe, it, expect, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';
import {
  LOCAL_STORAGE_KEYS,
  SESSION_STORAGE_KEYS
} from '../../../src/services/session/sessionConstants.js';
import {
  setPendingValidateResponse,
  getValidateResponse,
  commitSessionForEditor,
  saveLegacyLocalStorageData,
  clearPendingValidateResponse
} from '../../../src/services/session/sessionStorage.js';

describe('sessionStorage commit', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    clearPendingValidateResponse();
  });

  it('keeps validate payload in memory until commit persists it', () => {
    setPendingValidateResponse({
      r: 1,
      data: { docid: 'DOC1', apikey: 'k1', emailto: 'a@b.com', client: 'oup' }
    });

    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE)).toBeNull();
    expect(getValidateResponse()?.data?.docid).toBe('DOC1');
  });

  it('writes legacy localStorage keys and session ids on grant commit', () => {
    const response = {
      r: 1,
      data: {
        docid: 'DOC123',
        apikey: 'api-key-1',
        emailto: 'author@example.com',
        role: 'role-1',
        client: 'oup',
        collaborative: 'no',
        status: 'active',
        sharedcolor: 7
      }
    };

    setPendingValidateResponse(response);
    commitSessionForEditor({
      docId: 'DOC123',
      sessionId: '48291037',
      redirectUrl: 'http://localhost/validateurl'
    });

    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE)).toBeTruthy();
    expect(sessionStorage.getItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}DOC123`)).toBe('48291037');
    expect(sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID)).toBe('DOC123');
    expect(localStorage.getItem(LOCAL_STORAGE_KEYS.API_KEY)).toBe('api-key-1');
    expect(localStorage.getItem(`${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC123`)).toContain('DOC123');
    expect(localStorage.getItem(`${LOCAL_STORAGE_KEYS.USERNAME_PREFIX}DOC123`)).toBe('author@example.com');
  });

  it('rejects legacy save when apikey and email are missing', () => {
    const result = saveLegacyLocalStorageData({ docid: 'DOC1' });
    expect(result.ok).toBe(false);
  });
});
