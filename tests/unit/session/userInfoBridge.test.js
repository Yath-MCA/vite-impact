import { describe, it, expect, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';
import {
  clearUserInfo,
  getUserInfo,
  setUserInfo,
  toLegacyUserInfo
} from '../../../src/services/session/userInfoBridge.js';
import { normalizeSessionSource } from '../../../src/services/session/sessionSource.js';

const AUTHOR_ROLE_ID = '5b53536b4c4a803e9a5abf70';
const COLLATOR_ROLE_ID = '5bcf15b1cf510152afba028a';

describe('userInfoBridge', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    clearUserInfo();
  });

  it('derives Author USER_INFO with Co Author track name', () => {
    const src = normalizeSessionSource({
      docid: 'DOC1',
      emailto: 'author@example.com',
      role: AUTHOR_ROLE_ID,
      _id: 'user-123',
      client: 'oup',
      collaborative: 'no'
    });

    const info = toLegacyUserInfo(src);

    expect(info.MAIL_ID).toBe('author@example.com');
    expect(info.MAIL_ID_PREFIX).toBe('author');
    expect(info.ROLE_NAME).toBe('Author');
    expect(info.TRACK_ROLE_NAME).toBe('Co Author');
    expect(info.IS_AUTHOR).toBe(true);
    expect(info.IS_CO_ROLE).toBe(false);
    expect(info.SELECTOR_SHOW_HIDE).toBe('showForAU');
    expect(info.HAS_COLLAB_WORKFLOW).toBe(false);
  });

  it('derives Collator USER_INFO with Co Collator track name', () => {
    const src = normalizeSessionSource({
      docid: 'DOC2',
      emailto: 'co@example.com',
      role: COLLATOR_ROLE_ID,
      client: 'oso',
      collaborative: 'yes'
    });

    const info = toLegacyUserInfo(src);

    expect(info.ROLE_NAME).toBe('Collator');
    expect(info.TRACK_ROLE_NAME).toBe('Co Collator');
    expect(info.IS_CO_ROLE).toBe(true);
    expect(info.IS_AUTHOR).toBe(false);
    expect(info.HAS_COLLAB_WORKFLOW).toBe(true);
  });

  it('syncs window.USER_INFO on set and clears on clearUserInfo', () => {
    setUserInfo({ MAIL_ID: 'test@example.com', TRACK_ROLE_NAME: 'Co Author' });

    expect(getUserInfo()?.MAIL_ID).toBe('test@example.com');
    expect(window.USER_INFO.MAIL_ID).toBe('test@example.com');

    clearUserInfo();
    expect(getUserInfo()).toBeNull();
    expect(window.USER_INFO).toEqual({});
  });
});
