import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: {
    makeRequest: vi.fn(),
    sendEmail: vi.fn().mockResolvedValue({ r: 1 })
  },
  API_ENDPOINTS: {
    UPDATE_INSERT: '/api/updateorinsert',
    GET_DOCS: '/api/getdocs',
    GENERIC_SEND_MAIL: '/api/genericsendemail'
  }
}));

import { apiService, API_ENDPOINTS } from '../../../src/services/api/apiService.js';
import { recordSubject } from '../../../src/services/error/errorSubjectMap.js';
import { shareErrorMail } from '../../../src/services/error/errorMailService.js';
import { initErrorOps, resetErrorOps } from '../../../src/services/error/index.js';

function installWindowState() {
  window.DOC_ID = 'DOC1';
  window.SHARED_KEY = {
    docid: 'DOC1',
    client: 'LWW',
    projectname: 'SampleArticle',
    dtd: 'BITS',
    emailto: 'user@example.com'
  };
  window.USER_INFO = {
    MAIL_ID: 'user@example.com',
    ROLE_NAME: 'Copy Editor',
    ROLE_ID: 'CE01',
    TRACK_ROLE_NAME: 'CE'
  };
  window.IS_LIVE_DOMAIN = false;
  window.IS_UAT_DOMAIN = false;
  window.IS_JOURNAL = false;
  window.IS_LOCAL_HOST = false;
  window.CanSendLocalMail = false;
  window.VERSION = '9.0.0';
}

describe('errorMailService', () => {
  beforeEach(() => {
    resetErrorOps();
    vi.clearAllMocks();
    localStorage.clear();
    installWindowState();
    apiService.makeRequest.mockImplementation((endpoint) => {
      if (endpoint === API_ENDPOINTS.GET_DOCS) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ r: 1 });
    });
  });

  afterEach(() => {
    resetErrorOps();
    localStorage.clear();
    delete window.ErrorLogTrace;
    delete window.DOC_ID;
    delete window.SHARED_KEY;
    delete window.USER_INFO;
    delete window.IS_LIVE_DOMAIN;
    delete window.IS_UAT_DOMAIN;
    delete window.IS_JOURNAL;
    delete window.IS_LOCAL_HOST;
    delete window.CanSendLocalMail;
    delete window.VERSION;
  });

  it('skips send when subject was recorded 1 minute ago', async () => {
    const now = Date.now();
    recordSubject('SaveXml', now - 60 * 1000);
    await shareErrorMail('SaveXml', 'trace', 'boom', '<br>at foo');
    expect(apiService.sendEmail).not.toHaveBeenCalled();
    const getDocsCalls = apiService.makeRequest.mock.calls.filter(
      ([endpoint]) => endpoint === API_ENDPOINTS.GET_DOCS
    );
    expect(getDocsCalls).toHaveLength(0);
  });

  it('looks up ErrorLogs with GET_DOCS length 10 and sends when data is empty', async () => {
    await shareErrorMail('SaveXml', 'trace', 'boom', '<br>at foo');

    const getDocsCalls = apiService.makeRequest.mock.calls.filter(
      ([endpoint]) => endpoint === API_ENDPOINTS.GET_DOCS
    );
    expect(getDocsCalls).toHaveLength(1);
    expect(getDocsCalls[0][1]).toEqual(
      expect.objectContaining({
        tbl: 'ErrorLogs',
        length: 10,
        find: expect.objectContaining({
          module: 'SaveXml',
          docid: 'DOC1',
          username: 'user@example.com',
          errormsg: 'boom'
        })
      })
    );
    expect(apiService.sendEmail).toHaveBeenCalledTimes(1);
    expect(apiService.sendEmail.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        tbl: 'emaildraft',
        emailSubject: 'SaveXml',
        docid: 'DOC1',
        find: { id: '610a4cd05e311ebaf978ef78' }
      })
    );
    expect(apiService.sendEmail.mock.calls[0][0]).toHaveProperty('emailBCC');
  });

  it('decides sendEmail from pre-insert GET_DOCS even when insert would add a now-aged row', async () => {
    apiService.makeRequest.mockImplementation((endpoint) => {
      if (endpoint === API_ENDPOINTS.GET_DOCS) {
        const insertAlready = apiService.makeRequest.mock.calls.some(
          ([ep]) => ep === API_ENDPOINTS.UPDATE_INSERT
        );
        if (insertAlready) {
          return Promise.resolve({
            data: [
              {
                module: 'SaveXml',
                docid: 'DOC1',
                time_c: { $numberLong: String(Date.now()) }
              }
            ]
          });
        }
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ r: 1 });
    });

    await shareErrorMail('SaveXml', 'trace', 'boom', '<br>at foo');

    expect(apiService.sendEmail).toHaveBeenCalledTimes(1);
    const endpoints = apiService.makeRequest.mock.calls.map(([ep]) => ep);
    expect(endpoints.indexOf(API_ENDPOINTS.GET_DOCS)).toBeGreaterThanOrEqual(0);
    expect(endpoints.indexOf(API_ENDPOINTS.UPDATE_INSERT)).toBeGreaterThan(
      endpoints.indexOf(API_ENDPOINTS.GET_DOCS)
    );
  });

  it('skips sendEmail and insert on localhost when CanSendLocalMail is false', async () => {
    window.IS_LOCAL_HOST = true;
    window.CanSendLocalMail = false;
    await shareErrorMail('SaveXml', 'trace', 'boom', '<br>at foo');
    expect(apiService.sendEmail).not.toHaveBeenCalled();
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('does not send when last ErrorLogs row is 2 minutes old', async () => {
    const twoMinAgo = Date.now() - 2 * 60 * 1000;
    apiService.makeRequest.mockImplementation((endpoint) => {
      if (endpoint === API_ENDPOINTS.GET_DOCS) {
        return Promise.resolve({
          data: [
            {
              module: 'SaveXml',
              docid: 'DOC1',
              time_c: { $numberLong: String(twoMinAgo) }
            }
          ]
        });
      }
      return Promise.resolve({ r: 1 });
    });

    await shareErrorMail('SaveXml', 'trace', 'boom', '<br>at foo');
    expect(apiService.sendEmail).not.toHaveBeenCalled();
  });

  it('sets window.ErrorLogTrace after initErrorOps', () => {
    initErrorOps();
    expect(window.ErrorLogTrace).toBeTypeOf('function');
    expect(window.ErrorLogTrace.name).toBe('errorLogTrace');
  });
});
