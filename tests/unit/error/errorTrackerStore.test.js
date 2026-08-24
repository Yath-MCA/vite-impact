import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/error/errorLogsApi.js', () => ({
  insertErrorLog: vi.fn().mockResolvedValue({ r: 1 })
}));

import { insertErrorLog } from '../../../src/services/error/errorLogsApi.js';
import { createErrorTrackerStore } from '../../../src/error/errorTrackerStore.js';

function installWindowState() {
  window.DOC_ID = 'DOC1';
  window.SHARED_KEY = {
    docid: 'DOC1',
    projectname: 'SampleArticle'
  };
  window.USER_INFO = {
    MAIL_ID: 'user@example.com',
    MAIL_ID_PREFIX: 'user',
    ROLE_NAME: 'Copy Editor'
  };
  window.VERSION = '9.0.0';
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: {
      hostname: 'editor.example',
      pathname: '/editor',
      href: 'http://editor.example/editor?docid=DOC1',
      search: '?docid=DOC1'
    }
  });
}

describe('errorTrackerStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    installWindowState();
  });

  afterEach(() => {
    localStorage.clear();
    delete window.DOC_ID;
    delete window.SHARED_KEY;
    delete window.USER_INFO;
    delete window.VERSION;
  });

  it('ignores module system', () => {
    const store = createErrorTrackerStore();
    expect(store.logError('system', 'render', new Error('boom'))).toBeUndefined();
    expect(store.getRecentErrors()).toEqual([]);
    expect(localStorage.getItem('global_error_tracking_DOC1')).toBeNull();
    expect(insertErrorLog).not.toHaveBeenCalled();
  });

  it('persists under scoped global_error_tracking_{docid}', () => {
    const store = createErrorTrackerStore();
    store.logError('SaveXml', 'save', new Error('failed'));
    const raw = localStorage.getItem('global_error_tracking_DOC1');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.SaveXml.errors).toHaveLength(1);
    expect(parsed.SaveXml.errors[0].message).toBe('failed');
    expect(localStorage.getItem('global_error_tracking')).toBeNull();
  });

  it('migrates unscoped global_error_tracking once then never writes unscoped', () => {
    localStorage.setItem(
      'global_error_tracking',
      JSON.stringify({
        LegacyMod: {
          errors: [
            {
              id: 'err_legacy',
              timestamp: 'Aug 1, 2026, 01:00:00 PM',
              moduleName: 'LegacyMod',
              functionName: 'run',
              message: 'old',
              stack: 'No stack trace',
              context: {},
              track: '',
              repeatCount: 1
            }
          ],
          lastErrorTimestamp: null
        }
      })
    );

    const store = createErrorTrackerStore();
    expect(store.getRecentErrors()).toHaveLength(1);
    expect(store.getRecentErrors()[0].message).toBe('old');

    store.logError('SaveXml', 'save', new Error('new'));
    expect(localStorage.getItem('global_error_tracking_DOC1')).toBeTruthy();
    expect(localStorage.getItem('global_error_tracking')).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('global_error_tracking')).LegacyMod).toBeTruthy();
  });

  it('drops oldest when 101st error is logged for a module', () => {
    const store = createErrorTrackerStore();
    for (let i = 0; i < 100; i += 1) {
      store.logError('SaveXml', 'save', new Error(`err-${i}`));
    }
    expect(store.getRecentErrors('SaveXml', 200)).toHaveLength(100);
    expect(store.getRecentErrors('SaveXml', 200).at(-1).message).toBe('err-0');

    store.logError('SaveXml', 'save', new Error('err-100'));
    const recent = store.getRecentErrors('SaveXml', 200);
    expect(recent).toHaveLength(100);
    expect(recent.some((e) => e.message === 'err-0')).toBe(false);
    expect(recent[0].message).toBe('err-100');
  });

  it('bumps repeatCount when last entry matches message and function', () => {
    const store = createErrorTrackerStore();
    store.logError('SaveXml', 'save', new Error('same'));
    store.logError('SaveXml', 'save', new Error('same'));
    const recent = store.getRecentErrors('SaveXml', 10);
    expect(recent[0].repeatCount).toBe(2);
    expect(insertErrorLog).toHaveBeenCalled();
    const lastCall = insertErrorLog.mock.calls.at(-1)[0];
    expect(lastCall.stack).toBeDefined();
    expect(lastCall.track).toBeDefined();
    expect(lastCall.repeatCount).toBe(2);
    expect(lastCall.timestamp).toBeDefined();
  });

  it('renderErrorReportTable returns false when empty', () => {
    const store = createErrorTrackerStore();
    expect(store.renderErrorReportTable()).toBe(false);
  });

  it('renderErrorReportTable includes Dear Team intro when errors exist', () => {
    const store = createErrorTrackerStore();
    store.logError('SaveXml', 'save', new Error('boom'));
    const html = store.renderErrorReportTable({ limit: 50 });
    expect(html).toContain('<p>Dear Team,</p>');
    expect(html).toContain(
      'Sorry for the trouble. The file automatically sent to the Newgen Technical team for investigating the error. They will get back to you soon.'
    );
    expect(html).toContain('SaveXml');
    expect(html).toContain('boom');
  });

  it('exportErrorReportCsv uses required header columns', () => {
    const store = createErrorTrackerStore();
    store.logError('SaveXml', 'save', new Error('boom'));
    const csv = store.exportErrorReportCsv();
    const header = csv.split('\n')[0];
    expect(header).toContain('Timestamp');
    expect(header).toContain('Module');
    expect(header).toContain('Function');
    expect(header).toContain('Message');
    expect(header).toContain('Repeat Count');
    expect(header).toContain('Context');
    expect(header).toContain('Browser');
    expect(header).toContain('User ID');
  });
});
