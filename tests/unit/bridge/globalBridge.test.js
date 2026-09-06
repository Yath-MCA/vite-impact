import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/shared/utils/devLogger.js', () => ({
  devLog: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { devLog } from '../../../src/shared/utils/devLogger.js';
import { GlobalBridge } from '../../../src/services/bridge/index.js';

function createServices() {
  const urlService = {
    urlParams: { docid: 'DOC123' },
    parseURLParams: vi.fn(() => ({ docid: 'DOC123' })),
    getURLParam: vi.fn((key) => (key === 'docid' ? 'DOC123' : null))
  };
  const storageService = {};
  const sharedKeyService = {
    current: null,
    resolve: vi.fn(() => ({ docid: 'DOC123', apikey: 'key', dtd: 'JATS', type: 'journals' })),
    getCurrent: vi.fn(() => sharedKeyService.current),
    stopWatching: vi.fn()
  };
  const initService = {
    isInitialized: false,
    initDocumentID: vi.fn(() => true),
    initUserInfo: vi.fn(() => true),
    getDocId: vi.fn(() => 'DOC123'),
    checkAdminStatus: vi.fn(),
    isUserAdmin: vi.fn(() => false),
    checkAccess: vi.fn(() => true),
    handleAdminInit: vi.fn(),
    run: vi.fn(() => true)
  };
  const loadingService = {
    client: { NAME: { UPPER: 'PLOS', LOWER: 'plos' } },
    folderPath: 'assets/1.0.0/config/',
    canLoadEditor: false,
    isFullyLoaded: false,
    getAttributes: vi.fn(() => ({ id: 'node-1' })),
    loadAll: vi.fn(() => Promise.resolve()),
    init: vi.fn()
  };
  const editorInitService = {
    sharedKeyService,
    isInitiated: false,
    pendingSharedKey: null,
    initStartedAt: null,
    reloadTriggered: false,
    clearWatchers: vi.fn(),
    hasValidSharedKey: vi.fn(() => true),
    checkTimeout: vi.fn(() => false),
    start: vi.fn(() => true),
    runReadyToOpen: vi.fn(() => true),
    tryStart: vi.fn(() => true),
    startSharedKeyWatcher: vi.fn(),
    preInitialize: vi.fn()
  };

  return {
    urlService,
    storageService,
    sharedKeyService,
    initService,
    loadingService,
    editorInitService
  };
}

describe('GlobalBridge facade globals', () => {
  beforeEach(() => {
    delete window.InitConfig;
    delete window.INIT_CONFIG;
    delete window.LoadingConfig;
    delete window.LOADING_CONFIG;
    delete window.EditorInitialize;
    delete window.EDITOR_INITIALIZE;
    delete window.InitialLoadDialog;
  });

  it('logs GlobalBridge stages through devLog', () => {
    const services = createServices();
    new GlobalBridge(services).init();
    expect(devLog.log).toHaveBeenCalled();
    const messages = devLog.log.mock.calls.map((call) => String(call[0]));
    expect(messages.some((m) => m.includes('[GlobalBridge]'))).toBe(true);
  });

  it('exposes INIT_CONFIG as a facade without replacing initService methods', () => {
    const services = createServices();
    new GlobalBridge(services).init();

    expect(window.INIT_CONFIG).not.toBe(services.initService);
    expect(window.InitConfig()).toBe(services.initService);
    expect(window.INIT_CONFIG.run()).toBe(true);
    expect(services.initService.run).toHaveBeenCalledTimes(1);
    expect(window.INIT_CONFIG.initDocumentID()).toBe(true);
    expect(services.initService.initDocumentID).toHaveBeenCalledTimes(1);
    expect(window.INIT_CONFIG.urlParams).toEqual({ docid: 'DOC123' });
  });

  it('exposes LOADING_CONFIG as a facade with proxied state access', () => {
    const services = createServices();
    new GlobalBridge(services).init();

    expect(window.LOADING_CONFIG).not.toBe(services.loadingService);
    expect(window.LoadingConfig()).toBe(services.loadingService);
    expect(window.LOADING_CONFIG.CLIENT).toBe(services.loadingService.client);

    window.LOADING_CONFIG.FOLDER_PATH = 'assets/2.0.0/config/';
    expect(services.loadingService.folderPath).toBe('assets/2.0.0/config/');

    const sharedKey = { docid: 'DOC123' };
    window.LOADING_CONFIG.Init(sharedKey);
    expect(services.loadingService.init).toHaveBeenCalledWith(sharedKey);
  });

  it('exposes EDITOR_INITIALIZE as a facade without replacing editor init methods', () => {
    const services = createServices();
    new GlobalBridge(services).init();

    expect(window.EDITOR_INITIALIZE).not.toBe(services.editorInitService);
    expect(window.EditorInitialize()).toBe(services.editorInitService);

    window.EDITOR_INITIALIZE.preInitialize();
    window.EDITOR_INITIALIZE.preInitilize();

    expect(services.editorInitService.preInitialize).toHaveBeenCalledTimes(2);
    expect(window.EDITOR_INITIALIZE.START({ docid: 'DOC123' })).toBe(true);
    expect(services.editorInitService.start).toHaveBeenCalledTimes(1);
  });
});
