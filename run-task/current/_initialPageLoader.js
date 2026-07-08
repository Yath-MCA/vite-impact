/**
 * InitConfig - Configuration initialization
 * Handles URL parameters, localStorage, user info, and document setup
 * Integrates with InitialLoadDialog and LOADING_CONFIG
 */
(function (global) {
    'use strict';

    var InitConfig = function () {
        this.urlParams = {};
        this.isInitialized = false;
    };

    /**
     * Parse URL parameters from window.location.search
     * @returns {object} - Parsed URL parameters
     */
    InitConfig.prototype.parseURLParams = function () {
        try {
            var sPageURL = decodeURIComponent(window.location.search.substring(1));
            var sURLVariables = sPageURL.includes('&') ? sPageURL.split('&') : [sPageURL];
            var params = {};

            for (var i = 0; i < sURLVariables.length; i++) {
                var sParameterName = sURLVariables[i].split('=');
                if (sParameterName.length === 2) {
                    params[sParameterName[0]] = sParameterName[1];
                }
            }

            this.urlParams = params;
            if (global.isValidVariable(global.InitLog)) {
                global.InitLog('InitConfig', 'URL params parsed', params);
            }
            return params;
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('parseURLParams', err.message);
            return {};
        }
    };

    /**
     * Get URL parameter by key
     * @param {string} key - Parameter key
     * @returns {string|null} - Parameter value or null
     */
    InitConfig.prototype.getURLParam = function (key) {
        try {
            if (!this.urlParams || Object.keys(this.urlParams).length === 0) {
                this.parseURLParams();
            }
            return this.urlParams[key] || null;
        } catch (err) {
            console.warn(err.message);
            return null;
        }
    };

    /**
     * Initialize document ID from URL or localStorage
     * @returns {boolean} - Success status
     */
    InitConfig.prototype.initDocumentID = function () {
        try {
            var docid = this.getURLParam('docid');
            if (global.isValidVariable(global.InitLog)) {
                global.InitLog('InitConfig', 'initDocumentID found docid', docid);
            }

            let isValidDocID = global.isValidVariable(docid);
            let isglobalDocIDValid = global.isValidVariable(global.DOC_ID);
            if (isValidDocID) {
                if (!isglobalDocIDValid) global.DOC_ID = docid;

                // Store in localStorage
                try {
                    localStorage.setItem('xmleditor:currentDocID', docid);
                } catch (e) {
                    console.warn('localStorage unavailable');
                }

                // Store in DOC_INFO if available
                if (global.isValidVariable(global.DOC_INFO) && global.DOC_INFO.set) {
                    global.DOC_INFO.set('DOC_ID', docid);
                }

                // Update getDataRecord if available
                if (global.isValidVariable(global.getDataRecord) && global.getDataRecord.find) {
                    global.getDataRecord.find.docid = docid;
                }

                global.DOC_ID_READY = true;
                if (typeof global.dispatchEvent === 'function') {
                    try {
                        global.dispatchEvent(new CustomEvent('xmleditor:docid-initialized', {
                            detail: { docid: docid }
                        }));
                    } catch (eventErr) {
                        console.warn(eventErr.message);
                    }
                }
                return true;
            }

            return false;
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('initDocumentID', err.message);
            return false;
        }
    };

    /**
     * Initialize user information from localStorage
     * @returns {boolean} - Success status
     */
    InitConfig.prototype.initUserInfo = function () {
        try {
            if (!global.isValidVariable(global.DOC_ID)) {
                console.warn('DOC_ID not set');
                return false;
            }

            if (!global.isValidVariable(global.USER_INFO)) {
                global.USER_INFO = {};
            }

            var docid = global.DOC_ID;

            // Try to load user info from localStorage
            global.USER_INFO.MAIL_ID = localStorage.getItem('xmleditor:username:' + docid);
            global.USER_INFO.USER_ID = localStorage.getItem('xmleditor:userid:' + docid);
            global.USER_INFO.HAS_COLLAB_WORKFLOW = typeof global.isCollabEnabled === "function" && global.isCollabEnabled(docid);

            if (!global.USER_INFO.MAIL_ID || /null|undefined/gi.test(global.USER_INFO.MAIL_ID)) {
                var sharedRaw = localStorage.getItem('xmleditor:shared:' + docid) || sessionStorage.getItem('xmleditor:shared:' + docid);
                if (sharedRaw) {
                    try {
                        var sharedData = JSON.parse(sharedRaw);
                        var sharedEmail = sharedData.username || (Array.isArray(sharedData.emailto) ? sharedData.emailto[0] : sharedData.emailto);
                        if (sharedEmail) {
                            global.USER_INFO.MAIL_ID = sharedEmail;
                        }
                    } catch (parseErr) {
                        console.warn(parseErr.message);
                    }
                }
            }

            if (!global.USER_INFO.USER_ID || /null|undefined/gi.test(global.USER_INFO.USER_ID)) {
                var sharedKeyRaw = localStorage.getItem('xmleditor:shared:' + docid) || sessionStorage.getItem('xmleditor:shared:' + docid);
                if (sharedKeyRaw) {
                    try {
                        var sharedKeyData = JSON.parse(sharedKeyRaw);
                        if (sharedKeyData && sharedKeyData._id) {
                            global.USER_INFO.USER_ID = sharedKeyData._id;
                        }
                    } catch (parseErr) {
                        console.warn(parseErr.message);
                    }
                }
            }

            if (global.isValidVariable(global.InitLog)) {
                global.InitLog('InitConfig', 'User info loaded from localStorage', global.USER_INFO);
            }

            // Fallback to generic localStorage keys on localhost
            if (global.isValidVariable(global.IS_LOCAL_HOST) && global.IS_LOCAL_HOST) {
                if (!global.USER_INFO.MAIL_ID || /null|undefined/gi.test(global.USER_INFO.MAIL_ID)) {
                    global.USER_INFO.MAIL_ID = localStorage.getItem('xmleditor:login_username');
                }
                if (!global.USER_INFO.USER_ID || /null|undefined/gi.test(global.USER_INFO.USER_ID)) {
                    global.USER_INFO.USER_ID = localStorage.getItem('xmleditor:login_userid');
                }

                // Store back to document-specific keys
                if (global.USER_INFO.MAIL_ID) {
                    localStorage.setItem('xmleditor:username:' + docid, global.USER_INFO.MAIL_ID);
                }

                var tempVal = localStorage.getItem('xmleditor:userRole');
                if (tempVal && !/null|undefined/gi.test(tempVal)) {
                    localStorage.setItem('xmleditor:userRole:' + docid, tempVal);
                }
            }

            // Extract mail ID prefix
            if (global.USER_INFO.MAIL_ID) {
                global.USER_INFO.MAIL_ID_PREFIX = global.USER_INFO.MAIL_ID.split('@')[0].trim();
            }

            return !!global.USER_INFO.MAIL_ID;
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('initUserInfo', err.message);
            return false;
        }
    };

    /**
     * Load shared key configuration from localStorage
     * @returns {object|null} - SHARED_KEY object or null
     */
    InitConfig.prototype.loadSharedKey = function () {
        try {
            if (!global.isValidVariable(global.DOC_ID)) {
                return null;
            }

            var storageKey = 'xmleditor:shared:' + global.DOC_ID;
            var tempData = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
            if (global.isValidVariable(tempData)) {
                var sharedKey = JSON.parse(tempData);
                global.SHARED_KEY = sharedKey;
                if (global.isValidVariable(global.InitLog)) {
                    global.InitLog('InitConfig', 'Shared key loaded', sharedKey);
                }
                return sharedKey;
            }

            return null;
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('loadSharedKey', err.message);
            return null;
        }
    };

    /**
     * Initialize document configuration and start loading
     * @returns {boolean} - Success status
     */
    InitConfig.prototype.initLoadingConfig = function () {
        try {
            if (global.isValidVariable(global.InitLog)) {
                global.InitLog('InitConfig', 'initLoadingConfig starting');
            }
            if (!global.isValidVariable(global.SHARED_KEY) || !global.SHARED_KEY.docid || !global.SHARED_KEY.dtd) {
                console.warn('SHARED_KEY not properly configured');
                return false;
            }

            // Set up document info if function available
            if (typeof global.setDOC_INFO === 'function') {
                global.setDOC_INFO(global.SHARED_KEY);
            }

            // Update progress if InitialLoadDialog available
            if (global.isValidVariable(global.InitialLoadDialog)) {
                global.InitialLoadDialog.updateProgress(2);
            }

            // Handle missing project name
            if (!global.SHARED_KEY.projectname) {
                if (global.SHARED_KEY.titleinfo && global.SHARED_KEY.titleinfo.projectname) {
                    global.SHARED_KEY.projectname = global.SHARED_KEY.titleinfo.projectname;
                }

                // Fetch project data if needed
                if (global.IS_LOCAL_HOST && !global.SHARED_KEY.projectname) {
                    if (global.isValidVariable(global.commonfn) && global.commonfn.callajax) {
                        var endpoint = global.isValidVariable(global.API_GET_DOCS) ? global.API_GET_DOCS : null;
                        if (endpoint) {
                        setTimeout(function () {
                                global.commonfn.callajax(global.getDataRecord, 'getProjectData', endpoint, { Init: true });
                        }, 5000);
                        }
                    }
                }
            }

            // Start LOADING_CONFIG
            if (global.isValidVariable(global.LOADING_CONFIG) && global.LOADING_CONFIG.Init) {
                global.LOADING_CONFIG.Init(global.SHARED_KEY);
            }

            return true;
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('initLoadingConfig', err.message);
            return false;
        }
    };

    InitConfig.prototype.IsAdmin = function () {
        try {
            if (global.ADMIN_USER_IDs.includes(global.USER_INFO.MAIL_ID_PREFIX)) {
                localStorage.setItem('xmleditor:admin', 'superadmin');
                global.USER_INFO.IS_ADMIN = true;
            } else {
                localStorage.removeItem('xmleditor:admin');
                global.USER_INFO.IS_ADMIN = false;
            }
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('IsAdmin', err.message);
            return false;
        }
    };

    /**
     * Check user access and admin status
     * @returns {boolean} - Has valid access
     */
    InitConfig.prototype.checkAccess = function () {
        try {
            if (global.isValidVariable(global.InitLog)) {
                global.InitLog('InitConfig', 'Checking access for', global.USER_INFO.MAIL_ID);
            }
            if (!global.isValidVariable(global.USER_INFO.MAIL_ID)) {
                if (typeof global.Invalid_Access === 'function') {
                    global.Invalid_Access();
                }
                return false;
            }

            // Check admin status if function available
            if (typeof global.IsAdmin === 'function') {
                this.IsAdmin();
            }

            return true;
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('checkAccess', err.message);
            return false;
        }
    };

    /**
     * Handle admin-specific initialization
     * @returns {void}
     */
    InitConfig.prototype.handleAdminInit = function () {
        try {
            if (!global.isValidVariable(global.USER_INFO)) {
                return;
            }

            if (global.commonfn && global.commonfn.callajax) {
                setTimeout(function () {
                    global.commonfn.callajax(
                        global.getDataRecord,
                        'getProjectData',
                        global.isValidVariable(global.API_GET_DOCS) ? global.API_GET_DOCS : null
                    );
                }, 1000);
            }
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('handleAdminInit', err.message);
        }
    };

    /**
     * Run complete initialization sequence
     * @returns {boolean} - Success status
     */
    InitConfig.prototype.run = function () {
        try {
            if (global.isValidVariable(global.InitLog)) {
                global.InitLog('InitConfig', 'Run sequence started');
            }
            if (global.isValidVariable(global.debug) && global.debug.log) {
                global.debug.log("==InitConfig==");
            }

            // Step 1: Parse URL and get document ID
            if (!this.initDocumentID()) {
                console.warn('Failed to initialize document ID');
                return false;
            }

            // Step 2: Initialize user info
            if (!this.initUserInfo()) {
                console.warn('Failed to initialize user info');
                return false;
            }

            // Step 3: Check access
            if (!this.checkAccess()) {
                console.warn('User access denied');
                return false;
            }

            // Step 4: Load shared key
            var sharedKey = this.loadSharedKey();
            if (!global.isValidVariable(sharedKey)) {
                console.warn('No shared key found in localStorage');

                // Check if user is admin
                if (global.USER_INFO && global.USER_INFO.MAIL_ID && (global.USER_INFO.IS_ADMIN || IS_LOCAL_HOST)) {
                    this.handleAdminInit();
                    return true;
                }
                return false;
            }

            // Step 5: Initialize loading config
            this.initLoadingConfig();

            this.isInitialized = true;
            return true;
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('InitConfig.run', err.message);
            return false;
        }
    };

    // ============ Expose API ============
    global.InitConfig = InitConfig;
    global.INIT_CONFIG = new InitConfig();

    // Auto-run on document ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof global.INIT_CONFIG !== 'undefined') {
                setTimeout(function () {
                    global.INIT_CONFIG.run();
                }, 100);
            }
        });
    } else {
        if (typeof global.INIT_CONFIG !== 'undefined') {
            setTimeout(function () {
                global.INIT_CONFIG.run();
            }, 100);
        }
    }

})(window);
