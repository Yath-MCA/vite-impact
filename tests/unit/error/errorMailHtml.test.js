import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildMailTableHtml, formatStackHtml } from '../../../src/services/error/errorMailHtml.js';
import { getDefaultDocBag, getDocId } from '../../../src/services/error/errorContext.js';

describe('errorMailHtml', () => {
  it('wraps Dear Team copy and Impact Version / Domain rows', () => {
    const html = buildMailTableHtml({
      userRowsHtml: '<tr><td>DOC ID:</td><td>D1</td></tr>',
      errRowsHtml: '',
      version: '9.0.0',
      domain: 'editor.example/path',
      envInfoHtml: ''
    });
    expect(html).toContain('<p>Dear Team,</p>');
    expect(html).toContain(
      'Sorry for the trouble. The file automatically sent to the Newgen Technical team for investigating the error. They will get back to you soon.'
    );
    expect(html).toContain('Impact Version:');
    expect(html).toContain('9.0.0');
    expect(html).toContain('Domain :');
  });

  it('turns Error.stack frames into br-at HTML', () => {
    const html = formatStackHtml('SaveXml', 'Error: boom\n    at foo (a.js:1:1)\n    at bar (b.js:2:2)');
    expect(html).toContain('SaveXml Stack:');
    expect(html).toContain('<br>at ');
  });
});

describe('errorContext', () => {
  beforeEach(() => {
    window.DOC_ID = 'DOC-42';
    window.SHARED_KEY = {
      docid: 'DOC-SHARED',
      client: 'LWW',
      projectname: 'SampleArticle',
      role: 'CE01',
      rolename: 'Copy Editor',
      identifier: 'folder/SampleArticle',
      dtd: 'BITS',
      linkinfo: 'link-1',
      type: 'book',
      projecttitle: 'Sample Title',
      vendor: 'NG'
    };
    window.USER_INFO = {
      MAIL_ID: 'user@example.com',
      ROLE_ID: 'CE01',
      ROLE_NAME: 'Copy Editor',
      TRACK_ROLE_NAME: 'CE'
    };
    window.IS_JOURNAL = false;
    window.SESSION_ID = 'sess-99';
  });

  afterEach(() => {
    delete window.DOC_ID;
    delete window.SHARED_KEY;
    delete window.USER_INFO;
    delete window.IS_JOURNAL;
    delete window.SESSION_ID;
  });

  it('reads getDocId from window.DOC_ID', () => {
    expect(getDocId()).toBe('DOC-42');
  });

  it('falls back to SHARED_KEY.docid when DOC_ID is missing', () => {
    delete window.DOC_ID;
    expect(getDocId()).toBe('DOC-SHARED');
  });

  it('builds getDefaultDocBag with session fields and ACL', () => {
    const bag = getDefaultDocBag();
    expect(bag.docid).toBe('DOC-42');
    expect(bag.client).toBe('LWW');
    expect(bag.projectname).toBe('SampleArticle');
    expect(bag.username).toBe('user@example.com');
    expect(bag._w).toEqual(['5af956974b4bb40a34648f8e']);
    expect(bag._r).toEqual(['5af956974b4bb40a34648f8e']);
  });

  it('drops _w and _r when stripAcl is true', () => {
    const bag = getDefaultDocBag({ stripAcl: true });
    expect(bag).not.toHaveProperty('_w');
    expect(bag).not.toHaveProperty('_r');
    expect(bag.docid).toBe('DOC-42');
    expect(bag.client).toBe('LWW');
  });
});
