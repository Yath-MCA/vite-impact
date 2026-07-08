import { describe, it, expect } from 'vitest';
import {
  formatTrackRoleName,
  normalizeSessionSource,
  toLegacyLocalStorageWrites,
  toSessionContext
} from '../../../src/services/session/sessionSource.js';
import { LOCAL_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';

const AUTHOR_ROLE_ID = '5b53536b4c4a803e9a5abf70';
const COLLATOR_ROLE_ID = '5bcf15b1cf510152afba028a';

describe('sessionSource', () => {
  it('merges docData over validate response', () => {
    const src = normalizeSessionSource(
      { docid: 'DOC-A', client: 'oup', role: AUTHOR_ROLE_ID },
      { data: { docid: 'DOC-B', client: 'oso', emailto: 'a@b.com' } }
    );

    expect(src.docId).toBe('DOC-A');
    expect(src.client).toBe('oup');
    expect(src.emailId).toBe('a@b.com');
    expect(src.roleId).toBe(AUTHOR_ROLE_ID);
    expect(src.roleName).toBe('Author');
  });

  it('resolves email from array emailto with multiple entries via username', () => {
    const src = normalizeSessionSource(
      {},
      {
        data: {
          docid: 'DOC1',
          emailto: ['first@b.com', 'second@b.com'],
          username: 'second@b.com'
        }
      }
    );

    expect(src.emailId).toBe('second@b.com');
  });

  it('maps to session context shape', () => {
    const src = normalizeSessionSource(
      { identifier: 'ID1', dtd: 'book' },
      { data: { docid: 'DOC1', emailto: 'author@example.com', role: AUTHOR_ROLE_ID } }
    );

    expect(toSessionContext(src)).toMatchObject({
      docId: 'DOC1',
      username: 'author@example.com',
      role: AUTHOR_ROLE_ID,
      rolename: 'Author',
      identifier: 'ID1',
      dtd: 'book'
    });
  });

  it('builds legacy localStorage writes without DOM', () => {
    const src = normalizeSessionSource({
      docid: 'DOC123',
      apikey: 'key-1',
      emailto: 'author@example.com',
      role: 'Author',
      client: 'oup',
      collaborative: 'no',
      status: 'active',
      sharedcolor: 7
    });

    const writes = toLegacyLocalStorageWrites(src);
    const byKey = Object.fromEntries(writes.map(({ key, value }) => [key, value]));

    expect(byKey[LOCAL_STORAGE_KEYS.APP_KEY]).toBe('xmleditor');
    expect(byKey[LOCAL_STORAGE_KEYS.API_KEY]).toBe('key-1');
    expect(byKey[`${LOCAL_STORAGE_KEYS.USERNAME_PREFIX}DOC123`]).toBe('author@example.com');
    expect(byKey[`${LOCAL_STORAGE_KEYS.USER_ROLE_PREFIX}DOC123`]).toBe('Author');
    expect(byKey[`${LOCAL_STORAGE_KEYS.USER_COLOR_PREFIX}DOC123`]).toBe('7');
    expect(byKey[`${LOCAL_STORAGE_KEYS.COLLAB_ENABLED_PREFIX}DOC123`]).toBe('false');
  });

  it('formats track role name with Co prefix', () => {
    expect(formatTrackRoleName('Author')).toBe('Co Author');
    expect(formatTrackRoleName('Collator')).toBe('Co Collator');
  });
});

describe('sessionSource collab role ids', () => {
  it('resolves collator role name from ROLE_IDS', () => {
    const src = normalizeSessionSource({
      docid: 'DOC-CO',
      emailto: 'co@example.com',
      role: COLLATOR_ROLE_ID
    });

    expect(src.roleName).toBe('Collator');
  });
});
