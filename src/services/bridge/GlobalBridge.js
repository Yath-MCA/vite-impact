import SessionGuard from '../core/SessionGuard';
import { devLog } from '../../shared/utils/devLogger.js';
import { readShareKeyFromLocalStorage } from '../session/shareKeyContext.js';

function GlobalBridge(services) {
    this.services = services;
    this.legacyGlobals = {};
    this.sessionGuard = new SessionGuard();
}

GlobalBridge.prototype.init = function() {
    this.setupInitConfig();
    this.setupLoadingConfig();
    this.setupEditorInitialize();
    this.setupInitialLoadDialog();
    this.setupGlobalHelpers();
};

GlobalBridge.prototype.getSessionGuardCtx = function() {
    var docId = null;
    try {
        docId = this.services.initService && this.services.initService.getDocId
            ? this.services.initService.getDocId()
            : null;
    } catch (e) {}
    if (!docId && typeof sessionStorage !== 'undefined') {
        docId = sessionStorage.getItem('docid') || sessionStorage.getItem('DOC_ID');
    }
    if (!docId) return null;
    var shared = readShareKeyFromLocalStorage(docId);
    if (shared) {
        return {
            docId: docId,
            docid: docId,
            client: shared.client,
            username: shared.username || shared.emailto
        };
    }
    return { docId: docId, docid: docId };
};

GlobalBridge.prototype.runStageGuard = function(stage) {
    var ctx = this.getSessionGuardCtx();
    var result = this.sessionGuard.checkStage(stage, ctx);
    if (result.bypassed || !result.ok) {
        devLog.warn('[GlobalBridge]', stage, result.remarks);
    } else {
        devLog.log('[GlobalBridge]', stage, 'guard ok');
    }
    return result;
};

GlobalBridge.prototype.setupInitConfig = function() {
    var self = this;
    var initService = this.services.initService;

    devLog.log('[GlobalBridge] init start');
    self.runStageGuard('init');

    window.InitConfig = function() {
        return initService;
    };

    window.INIT_CONFIG = {};

    window.INIT_CONFIG.parseURLParams = function() {
        return self.services.urlService.parseURLParams();
    };

    window.INIT_CONFIG.getURLParam = function(key) {
        return self.services.urlService.getURLParam(key);
    };

    window.INIT_CONFIG.initDocumentID = function() {
        return initService.initDocumentID();
    };

    window.INIT_CONFIG.initUserInfo = function() {
        return initService.initUserInfo();
    };

    window.INIT_CONFIG.loadSharedKey = function() {
        var docId = initService.getDocId();
        return self.services.sharedKeyService.resolve(docId);
    };

    window.INIT_CONFIG.initLoadingConfig = function() {
        var sharedKey = self.services.sharedKeyService.getCurrent();
        if (sharedKey) {
            self.services.loadingService.init(sharedKey);
            return true;
        }
        return false;
    };

    window.INIT_CONFIG.IsAdmin = function() {
        initService.checkAdminStatus();
        return initService.isUserAdmin();
    };

    window.INIT_CONFIG.checkAccess = function() {
        return initService.checkAccess();
    };

    window.INIT_CONFIG.handleAdminInit = function() {
        initService.handleAdminInit();
    };

    window.INIT_CONFIG.run = function() {
        return initService.run();
    };

    Object.defineProperty(window.INIT_CONFIG, 'isInitialized', {
        get: function() {
            return initService.isInitialized;
        }
    });

    Object.defineProperty(window.INIT_CONFIG, 'urlParams', {
        get: function() {
            return self.services.urlService.urlParams;
        }
    });

    devLog.log('[GlobalBridge] init complete');
};

GlobalBridge.prototype.setupLoadingConfig = function() {
    var self = this;
    var loadingService = this.services.loadingService;

    devLog.log('[GlobalBridge] loading start');
    self.runStageGuard('loading');

    window.LoadingConfig = function() {
        return loadingService;
    };

    window.LOADING_CONFIG = {};

    Object.defineProperty(window.LOADING_CONFIG, 'CLIENT', {
        get: function() {
            return loadingService.client;
        },
        set: function(val) {
            loadingService.client = val;
        }
    });

    Object.defineProperty(window.LOADING_CONFIG, 'FOLDER_PATH', {
        get: function() {
            return loadingService.folderPath;
        },
        set: function(val) {
            loadingService.folderPath = val;
        }
    });

    Object.defineProperty(window.LOADING_CONFIG, 'canLoadEditor', {
        get: function() {
            return loadingService.canLoadEditor;
        }
    });

    Object.defineProperty(window.LOADING_CONFIG, 'isFullyLoaded', {
        get: function() {
            return loadingService.isFullyLoaded;
        }
    });

    window.LOADING_CONFIG.GET_ATTR = function(target) {
        return loadingService.getAttributes(target);
    };

    window.LOADING_CONFIG.PREPARE_URLS = function() {
        return [];
    };

    window.LOADING_CONFIG.BATCH_FETCH = function(urls, callback) {
        loadingService.loadAll().then(callback).catch(function(err) {
            console.error('BATCH_FETCH error:', err);
        });
    };

    window.LOADING_CONFIG.PROCESS_RESPONSES = function(callback) {
        if (typeof callback === 'function') callback();
    };

    window.LOADING_CONFIG.Init = function(SHARED_KEY) {
        loadingService.init(SHARED_KEY);
    };

    devLog.log('[GlobalBridge] loading complete');
};

GlobalBridge.prototype.setupEditorInitialize = function() {
    var self = this;
    var editorService = this.services.editorInitService;

    devLog.log('[GlobalBridge] editorInit start');
    self.runStageGuard('editorInit');

    window.EditorInitialize = function() {
        return editorService;
    };

    window.EDITOR_INITIALIZE = {};

    window.EDITOR_INITIALIZE.CLEAR_WATCHER = function() {
        editorService.clearWatchers();
    };

    window.EDITOR_INITIALIZE.CLEAR_SHARED_KEY_WATCHER = function() {
        editorService.sharedKeyService.stopWatching();
    };

    window.EDITOR_INITIALIZE.HAS_VALID_SHARED_KEY = function(sharedKey) {
        return editorService.hasValidSharedKey(sharedKey);
    };

    window.EDITOR_INITIALIZE.ENSURE_INIT_TIMER = function() {
        if (!editorService.initStartedAt) {
            editorService.initStartedAt = Date.now();
        }
    };

    window.EDITOR_INITIALIZE.CLEAR_INIT_TIMER = function() {
        editorService.initStartedAt = null;
        editorService.reloadTriggered = false;
    };

    window.EDITOR_INITIALIZE.CHECK_TIMEOUT_AND_RELOAD = function() {
        return editorService.checkTimeout();
    };

    window.EDITOR_INITIALIZE.RESOLVE_SHARED_KEY = function() {
        var docId = self.services.initService.getDocId();
        return self.services.sharedKeyService.resolve(docId);
    };

    window.EDITOR_INITIALIZE.START = function(sharedKey) {
        return editorService.start(sharedKey);
    };

    window.EDITOR_INITIALIZE.RUN_READY_TO_OPEN = function(sharedKey) {
        return editorService.runReadyToOpen(sharedKey);
    };

    window.EDITOR_INITIALIZE.TRY_START = function() {
        return editorService.tryStart();
    };

    window.EDITOR_INITIALIZE.START_SHARED_KEY_WATCHER = function() {
        editorService.startSharedKeyWatcher();
    };

    window.EDITOR_INITIALIZE.preInitialize = function() {
        return editorService.preInitialize();
    };

    window.EDITOR_INITIALIZE.preInitilize = window.EDITOR_INITIALIZE.preInitialize;

    Object.defineProperty(window.EDITOR_INITIALIZE, 'isInitiated', {
        get: function() {
            return editorService.isInitiated;
        }
    });

    Object.defineProperty(window.EDITOR_INITIALIZE, 'pendingSharedKey', {
        get: function() {
            return editorService.pendingSharedKey;
        },
        set: function(val) {
            editorService.pendingSharedKey = val;
        }
    });

    devLog.log('[GlobalBridge] editorInit complete');
};

GlobalBridge.prototype.setupInitialLoadDialog = function() {
    var self = this;

    window.InitialLoadDialog = {
        progressValue: 0,
        progressLoop: 0,
        FullyLoaded: false,
        progressEndValue: 10,
        StatusInfo: {
            1: 'Loading Configuration ...',
            2: 'Fetching Metadata ...',
            3: 'Parsing Configuration ...',
            4: 'Loading Page Config ...',
            5: 'Setting Profile ...',
            6: 'Loading Language Pack ...',
            7: 'Loading Style Settings ...',
            8: 'Initializing Page ...',
            9: 'Finalizing ...',
            10: 'Ready'
        },

        init: function() {
            devLog.log('InitialLoadDialog.init() - React component active');
        },

        updateProgress: function(value) {
            this.progressValue = value;
            if (window.eventBus) {
                window.eventBus.emit('dialog:progress', { value: value });
            }
        },

        complete: function() {
            this.FullyLoaded = true;
            this.progressValue = this.progressEndValue;
            if (window.eventBus) {
                window.eventBus.emit('dialog:complete', {});
            }
        },

        getAlert: function(key) {
            if (window.AlertMessages && window.AlertMessages.get) {
                return window.AlertMessages.get(key);
            }
            return null;
        },

        getAllAlerts: function() {
            if (window.AlertMessages && window.AlertMessages.getAll) {
                return window.AlertMessages.getAll();
            }
            return {};
        },

        onInitializeComplete: function() {
            if (!window.IS_TRACK_VIEW) {
                if (typeof window.new_session_check === 'function') {
                    window.new_session_check();
                }
                if (window.CAN_INITIATE_MODULE) {
                    if (window.CHECK_REQUEST && window.CHECK_REQUEST.Init) {
                        window.CHECK_REQUEST.Init();
                    }
                    if (window.LOG_OUT && window.LOG_OUT.Init) {
                        window.LOG_OUT.Init();
                    }
                }
            }
        },

        startProgressMonitoring: function() {}
    };
};

GlobalBridge.prototype.setupGlobalHelpers = function() {
    var self = this;

    window.isValidVariable = function(variable) {
        return variable !== null &&
            variable !== undefined &&
            variable !== '' &&
            !(typeof variable === 'number' && isNaN(variable));
    };

    window.getDocRecord = {
        tbl: "Fileslist",
        asyn: "1",
        find: {
            status: "active",
            docid: "",
            projecttitle: { "$exists": true }
        },
        length: 1,
        sort: {},
        filter: ["projecttitle", "id", "status", "dtd", "client", "type"]
    };

    if (!window.API_GET_DOCS) {
        window.API_GET_DOCS = '/api/getdocs';
    }

    window.InitLog = function(source, action, data) {
        if (window.debug && window.debug.log) {
            window.debug.log('[' + source + '] ' + action, data);
        }
    };
};

if (typeof module !== 'undefined' && module.exports && module.exports !== Object(module.exports)) {
    module.exports = GlobalBridge;
} else if (typeof window !== 'undefined') {
    window.GlobalBridge = GlobalBridge;
}

export default GlobalBridge;
