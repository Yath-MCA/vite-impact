/**
 * InitialLoadDialog - Progress dialog for page initialization
 * Displays circular progress bar while all resources are being prepared
 * Integrates with AlertMessageLoader for alert messages
 */
(function (global) {
    'use strict';

    var InitialLoadDialog = function () {
        this.template = '<div class="blur-overlay" id="pageBlurOverlay"></div><div class="page-container" id="loadingDialog"><div class="circular-progress"><div class="value-container">0%</div></div><div class="status">. . .</div></div>';
        this.progressValue = 0;
        this.progressLoop = 0;
        this.FullyLoaded = false;
        this.progressEndValue = 10;
        this.StatusInfo = {
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
        };
        this.progressBar = null;
        this.valueContainer = null;
        this.statusDiv = null;
        this.dialogModule = null;
        this.progressInterval = null;
        this.dynamic_load_file = {
            client_config: false,
            meta_config: false,
            ceg_config: false,
            lang_config: false,
            ico_file: false
        };
    };

    InitialLoadDialog.prototype.init = function () {
        try {
            if (typeof global.InitLog !== 'undefined') {
                global.InitLog('InitialLoadDialog', 'init');
            }
            if (!document.getElementById('loadingDialog') && this.template) {
                var fragment = document.createRange().createContextualFragment(this.template);
                var dialogContainer = document.getElementById('ModelDialogAppend');
                if (dialogContainer) {
                    dialogContainer.appendChild(fragment);
                    this.progressBar = document.querySelector('.circular-progress');
                    this.valueContainer = document.querySelector('.value-container');
                    this.statusDiv = document.querySelector('.status');
                    this.dialogModule = document.getElementById('loadingDialog');

                    if (this.valueContainer) {
                        this.valueContainer.classList.add("ds-none");
                    }

                    this.progressValue = 0;
                    this.startProgressMonitoring();
                } else {
                    var self = this;
                    setTimeout(function () {
                        self.init();
                    }, 100);
                }
            }
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('INITIAL_LOAD_DIALOG_INIT', err.message);
        }
    };

    InitialLoadDialog.prototype.updateProgress = function (value) {
        try {
            console.log("updateProgress", value);
            if (typeof global.InitLog !== 'undefined') {
                global.InitLog('InitialLoadDialog', 'updateProgress', value);
            }
            if (value >= 0 && value >= this.progressValue && value <= this.progressEndValue) {
                this.progressValue = value;
            }
        } catch (err) {
            console.warn(err.message);
        }
    };


    /**
     * Get alert message from AlertMessageLoader
     * @param {string} key - Alert message key
     * @returns {object|null} - Alert configuration or null
     */
    InitialLoadDialog.prototype.getAlert = function (key) {
        try {
            if (global.isValidVariable(global.AlertMessages)) {
                return global.AlertMessages.get(key);
            }
            console.warn('AlertMessageLoader not loaded');
            return null;
        } catch (err) {
            console.warn(err.message);
            return null;
        }
    };

    /**
     * Get all alerts from AlertMessageLoader
     * @returns {object} - All alert messages
     */
    InitialLoadDialog.prototype.getAllAlerts = function () {
        try {
            if (global.isValidVariable(global.AlertMessages)) {
                return global.AlertMessages.getAll();
            }
            console.warn('AlertMessageLoader not loaded');
            return {};
        } catch (err) {
            console.warn(err.message);
            return {};
        }
    };

    InitialLoadDialog.prototype.complete = function () {
        try {
            if (typeof global.InitLog !== 'undefined') {
                global.InitLog('InitialLoadDialog', 'complete');
            }
            this.progressValue = this.progressEndValue;
            if (this.progressInterval) clearInterval(this.progressInterval);

            if (this.dialogModule) {
                this.dialogModule.classList.add("ds-none");
            }

            if (global.isValidVariable(global.debug)) {
                global.debug.info("--InitialLoadDialog End---" + new Date().toLocaleTimeString());
            }

            var blur = document.getElementById('pageBlurOverlay');
            if (blur) blur.remove();

            var self = this;
            self.onInitializeComplete().then(function () {
                self.FullyLoaded = true;
            }).catch(function (err) {
                console.warn(err.message);
                if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('COMPLETE', err.message);
                self.FullyLoaded = true;
            });
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('COMPLETE', err.message);
        }
    };

    async function loadLinkSessionEditorModules(registry, maxAttempts) {
        var attempts = maxAttempts || 2;
        var lastErr;
        for (var i = 0; i < attempts; i++) {
            try {
                await registry.getModule('LinkSessionService');
                await registry.getModule('LinkSessionRequestModule');
                return;
            } catch (err) {
                lastErr = err;
                if (i < attempts - 1) {
                    await new Promise(function (resolve) { setTimeout(resolve, 500); });
                }
            }
        }
        throw lastErr;
    }

    InitialLoadDialog.prototype.onInitializeComplete = async function () {
        try {
            if (typeof global.InitLog !== 'undefined') {
                global.InitLog('InitialLoadDialog', 'onInitializeComplete');
            }
            if (typeof IS_TRACK_VIEW !== 'undefined' && !IS_TRACK_VIEW) {
                if (typeof CAN_INITIATE_MODULE !== 'undefined' && CAN_INITIATE_MODULE &&
                    typeof CHECK_REQUEST === 'undefined' && window.moduleRegistry) {
                    try {
                        await loadLinkSessionEditorModules(window.moduleRegistry, 2);
                    } catch (err) {
                        console.warn('[InitialLoadDialog] LinkSession modules failed to load:', err.message);
                        if (typeof ErrorLogTrace !== 'undefined') {
                            ErrorLogTrace('ON_INITIALIZE_COMPLETE', 'LinkSession modules: ' + err.message);
                        }
                    }
                }

                if (typeof CHECK_REQUEST !== 'undefined' && typeof CHECK_REQUEST.Init === 'function') {
                    CHECK_REQUEST.Init();
                } else if (typeof CAN_INITIATE_MODULE !== 'undefined' && CAN_INITIATE_MODULE) {
                    console.warn('[InitialLoadDialog] CHECK_REQUEST unavailable after module load');
                    if (typeof ErrorLogTrace !== 'undefined') {
                        ErrorLogTrace('ON_INITIALIZE_COMPLETE', 'CHECK_REQUEST unavailable');
                    }
                }

                if (typeof new_session_check !== 'undefined') new_session_check();

                if (typeof commonfn !== 'undefined' && typeof GET_JSON !== 'undefined') {
                    commonfn.callajax(GET_JSON('guideTourStatus', {
                        find: true
                    }), 'getguideduser', typeof API_GET_USERS !== 'undefined' ? API_GET_USERS : null);
                }

                if (typeof CAN_INITIATE_MODULE !== 'undefined' && CAN_INITIATE_MODULE) {
                    if (typeof LOG_OUT !== 'undefined') LOG_OUT.Init();
                }
            }
        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') ErrorLogTrace('ON_INITIALIZE_COMPLETE', err.message);
        }
    };

    InitialLoadDialog.prototype.startProgressMonitoring = function () {
        try {
            if (typeof global.InitLog !== 'undefined') {
                global.InitLog('InitialLoadDialog', 'startProgressMonitoring');
            }

            var self = this;

            if (this.progressInterval) {
                clearInterval(this.progressInterval);
            }

            this.progressInterval = setInterval(function () {
                try {



                    /* ===============================
                       Update Percentage Text
                    ================================ */
                    if (self.valueContainer) {
                        self.valueContainer.textContent = self.progressValue + '%';
                    }

                    /* ===============================
                       Update Circular Progress UI
                    ================================ */
                    if (self.progressBar) {
                        var colorHex = self.progressValue >= self.progressEndValue
                            ? '72C245'
                            : 'FF8E33';

                        self.progressBar.style.background =
                            'conic-gradient(#' + colorHex + ' ' +
                            (self.progressValue * 36) + 'deg, #F0F0F0 ' +
                            (self.progressValue * 36) + 'deg)';
                    }

                    /* ===============================
                       COMPLETE WHEN DONE
                    ================================ */
                    if (
                        self.progressValue >= self.progressEndValue &&
                        global.isValidVariable(global.LOADING_CONFIG) &&
                        global.LOADING_CONFIG.isFullyLoaded === true
                    ) {
                        self.complete();
                        return;
                    }

                    /* ===============================
                       Update Status Text
                    ================================ */
                    if (self.StatusInfo[self.progressValue] && self.statusDiv) {
                        self.statusDiv.textContent =
                            self.StatusInfo[self.progressValue];
                    }

                } catch (err) {
                    console.warn(err.message);
                }
            }, 100);

        } catch (err) {
            console.warn(err.message);
            if (typeof ErrorLogTrace !== 'undefined') {
                ErrorLogTrace('START_PROGRESS_MONITORING', err.message);
            }
        }
    };


    // ============ Expose API ============
    global.InitialLoadDialog = new InitialLoadDialog();

    // Auto-initialize when available
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            if (typeof global.InitialLoadDialog !== 'undefined') {
                global.InitialLoadDialog.init();
            }
        });
    } else {
        if (typeof global.InitialLoadDialog !== 'undefined') {
            global.InitialLoadDialog.init();
        }
    }

})(window);