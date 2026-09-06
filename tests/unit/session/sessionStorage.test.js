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
  clearPendingValidateResponse,
  clearDocScopedLocalData,
  getSessionStartTime,
  setSessionStartTime,
  getStoredEditorSession,
  setValidateAccessKey,
  setValidateResponse
} from '../../../src/services/session/sessionStorage.js';
import { clearUserInfo, getUserInfo } from '../../../src/services/session/userInfoBridge.js';

const AUTHOR_ROLE_ID = '5b53536b4c4a803e9a5abf70';

describe('sessionStorage commit', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    clearPendingValidateResponse();
    clearUserInfo();
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
        role: AUTHOR_ROLE_ID,
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
    expect(getUserInfo()?.MAIL_ID).toBe('author@example.com');
    expect(getUserInfo()?.TRACK_ROLE_NAME).toBe('Co Author');
    expect(window.USER_INFO.TRACK_ROLE_NAME).toBe('Co Author');
  });

  it('rejects legacy save when apikey and email are missing', () => {
    const result = saveLegacyLocalStorageData({ docid: 'DOC1' });
    expect(result.ok).toBe(false);
  });

  it('clears doc-scoped localStorage keys', () => {
    localStorage.setItem(`${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC123`, '{"docid":"DOC123"}');
    localStorage.setItem(`${LOCAL_STORAGE_KEYS.USERNAME_PREFIX}DOC123`, 'a@b.com');
    localStorage.setItem(`${LOCAL_STORAGE_KEYS.SHARED_PREFIX}OTHER`, '{}');
    clearDocScopedLocalData('DOC123');
    expect(localStorage.getItem(`${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC123`)).toBeNull();
    expect(localStorage.getItem(`${LOCAL_STORAGE_KEYS.USERNAME_PREFIX}DOC123`)).toBeNull();
    expect(localStorage.getItem(`${LOCAL_STORAGE_KEYS.SHARED_PREFIX}OTHER`)).toBe('{}');
  });
});

describe('sessionStorage editor helpers', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    clearPendingValidateResponse();
  });

  it('stores and reads session start time by document id', () => {
    setSessionStartTime('DOC1', '12345');

    expect(getSessionStartTime('DOC1')).toBe('12345');
    expect(sessionStorage.getItem('xmleditor:sessionstart:DOC1')).toBe('12345');
  });

  it('reads a complete stored editor session', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.DOC_ID, 'DOC1');
    sessionStorage.setItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}DOC1`, 'SID1');
    setSessionStartTime('DOC1', '111');
    setValidateAccessKey('KEY1');
    setValidateResponse({ data: { docid: 'DOC1', username: 'a@b.com' } }, { persist: true });

    expect(getStoredEditorSession('DOC1')).toEqual({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '111',
      validateKey: 'KEY1',
      validateResponse: { data: { docid: 'DOC1', username: 'a@b.com' } }
    });
  });

  it('falls back to stored DOC_ID when docId argument is empty', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.DOC_ID, 'DOC2');
    sessionStorage.setItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}DOC2`, 'SID2');

    expect(getStoredEditorSession().docId).toBe('DOC2');
    expect(getStoredEditorSession().sessionId).toBe('SID2');
  });
});
