/*jslint white:true, for:true */
/*global $, API_LINK_SHARE, API_GET_DOCS, ADD_DEFAULT_KEYS, GET_JSON, DOC_ID, SHARED_KEY, USER_INFO,
    IS_LOCAL_HOST, ErrorLogTrace, moment, Request_ID, APP_KEY, API_KEY, AlertNewDialog, Swal,
    commonfn, commonMethods, GlobalEditor, IMPACT_SAVE, _CanClose,
    _IsDirty, FinalizeDialog, NG_WEB_URL, CKEDITOR, debug, getRequestDialog, openRequestDialog */

/**
 * LinkSessionCore — shared linksharing session logic (landing + editor).
 * UI: link_session_send (landing), link_session_request (editor).
 */

class LinkSessionCore {
    static get PROCESS() {
        return {
            CHECK: 'check',
            REFRESH: 'refresh',
            SCHEDULER: 'scheduler',
            UPDATE_REQSTATUS_TIME: 'update_reqstatus_time',
            UPDATE_DOCSTATUS_REQSTATUS_INSERT_TIME: 'update_docstatus_reqstatus_insert_time',
            UPDATEREQUESTSTATUS: 'updaterequeststatus',
            UPDATESTATUS_REQSTATUS: 'updatestatus_reqstatus',
            UPDATEREQSTATUS: 'updatereqstatus',
            GETREQUESTSTATUS_PROCESS: 'getrequeststatus_process',
            CLOSE: 'close',
            SAVE: 'save',
            UPDATE_SESSION_END_TIME: 'update_session_end_time',
            UPDATE_REQ_STATUS: 'update_req_status',
            SIGNOFF: 'signoff'
        };
    }

    static get DOC_STATUS() {
        return { ACTIVE: '1', INACTIVE: '0' };
    }

    static get REQUEST_STATUS() {
        return { PENDING: '1', DELIVERED_TO_EDITOR: '2', RESOLVED: '3', REJECTED: '4' };
    }

    constructor() {
        this._schedulerInterval = null;
        this._schedulerOwner = null;
        this._editorOwner = null;
        this._landingCtxState = null;
    }

    captureLandingCtxState(ctx) {
        if (!ctx) {
            return;
        }
        this._landingCtxState = {
            sessionStartTime: ctx.sessionStartTime,
            grantSessionStartTime: ctx.grantSessionStartTime,
            docId: ctx.docId,
            sessionId: ctx.sessionId,
            requestId: ctx.requestId
        };
    }

    mergeLandingCtxState(ctx) {
        if (!ctx || !this._landingCtxState) {
            return ctx;
        }
        if (this._landingCtxState.sessionStartTime) {
            ctx.sessionStartTime = this._landingCtxState.sessionStartTime;
        }
        if (this._landingCtxState.grantSessionStartTime) {
            ctx.grantSessionStartTime = this._landingCtxState.grantSessionStartTime;
        }
        if (!ctx.docId && this._landingCtxState.docId) {
            ctx.docId = this._landingCtxState.docId;
        }
        if (!ctx.sessionId && this._landingCtxState.sessionId) {
            ctx.sessionId = this._landingCtxState.sessionId;
        }
        if (!ctx.requestId && this._landingCtxState.requestId) {
            ctx.requestId = this._landingCtxState.requestId;
        }
        return ctx;
    }

    // -------------------------------------------------------------------------
    // Payload builders
    // -------------------------------------------------------------------------

    buildPayload(process, ctx) {
        const p = String(process || '').toLowerCase();
        switch (p) {
            case LinkSessionCore.PROCESS.CHECK:
            case LinkSessionCore.PROCESS.REFRESH:
                return this.buildCheckPayload(Object.assign({}, ctx, { process: p, source: ctx.source || 'editor' }));
            case LinkSessionCore.PROCESS.SCHEDULER:
                return this.buildSchedulerPayload(ctx);
            case LinkSessionCore.PROCESS.UPDATEREQUESTSTATUS:
                return this.buildUpdateRequestStatusPayload(ctx);
            case LinkSessionCore.PROCESS.UPDATESTATUS_REQSTATUS:
                return this.buildUpdateStatusReqStatusPayload(ctx);
            case LinkSessionCore.PROCESS.UPDATEREQSTATUS:
                return this.buildUpdateReqStatusPayload(ctx);
            case LinkSessionCore.PROCESS.CLOSE:
                return this.buildClosePayload(ctx);
            case LinkSessionCore.PROCESS.SAVE:
                return this.buildSavePayload(ctx);
            case LinkSessionCore.PROCESS.GETREQUESTSTATUS_PROCESS:
                return this.buildGetRequestStatusPayload(ctx);
            case LinkSessionCore.PROCESS.UPDATE_REQSTATUS_TIME:
                return this.buildUpdateReqStatusTimePayload(ctx);
            case LinkSessionCore.PROCESS.UPDATE_DOCSTATUS_REQSTATUS_INSERT_TIME:
                return this.buildSendRequestPayload(ctx);
            case LinkSessionCore.PROCESS.UPDATE_SESSION_END_TIME:
                return this.buildUpdateSessionEndTimePayload(ctx);
            case LinkSessionCore.PROCESS.SIGNOFF:
                return this.buildSignoffPayload(ctx);
            default:
                return this._basePayload(p, ctx);
        }
    }

    getJsonOrBuild(process, extra, ctx) {
        if (typeof GET_JSON === 'function') {
            return GET_JSON('linksharing', Object.assign({ process: process }, extra || {}));
        }
        return this.buildPayload(process, Object.assign({}, ctx || {}, extra || {}));
    }

    getSessionId() {
        return Math.floor(10000000 + Math.random() * 90000000);
    }

    assignRequestId() {
        const id = Math.floor(100000000 + Math.random() * 900000000);
        if (typeof Request_ID !== 'undefined') {
            Request_ID = id;
        }
        return id;
    }

    getSessionStartTime() {
        return new Date().getTime().toString();
    }

    buildCheckPayload(options) {
        const {
            docId,
            sessionId,
            sessionStartTime,
            remarks = 'login',
            tabId = '',
            source = 'landing',
            process = LinkSessionCore.PROCESS.CHECK
        } = options || {};

        const base = {
            tbl: 'linksharing',
            docid: docId || (typeof DOC_ID !== 'undefined' ? DOC_ID : ''),
            session_id: String(sessionId),
            session_start_time: String(sessionStartTime || this.getSessionStartTime()),
            process: process,
            remarks: remarks
        };

        if (tabId) {
            base.tabid = tabId;
        }
        const exculdeArray = ['session_id','dtd','linkinfo','roleid','shorttitle','type','vendor','projecttitle'];
        if (typeof ADD_DEFAULT_KEYS === 'function' && source === 'landing') {

            const merged = Object.assign({}, base, ADD_DEFAULT_KEYS('defaults', {}, [], exculdeArray));
            merged.session_id = String(sessionId);
            return merged;
        }

        return base;
    }

    buildSchedulerPayload(ctx) {
        return Object.assign(this._basePayload(LinkSessionCore.PROCESS.SCHEDULER, ctx), {
            docstatus: LinkSessionCore.DOC_STATUS.ACTIVE,
            requeststatus: LinkSessionCore.REQUEST_STATUS.PENDING
        });
    }

    buildUpdateRequestStatusPayload(ctx) {
        return Object.assign(this._basePayload(LinkSessionCore.PROCESS.UPDATEREQUESTSTATUS, ctx), {
            requeststatus: LinkSessionCore.REQUEST_STATUS.DELIVERED_TO_EDITOR
        });
    }

    buildUpdateStatusReqStatusPayload(ctx) {
        return Object.assign(this._basePayload(LinkSessionCore.PROCESS.UPDATESTATUS_REQSTATUS, ctx), {
            docstatus: ctx.docstatus != null ? String(ctx.docstatus) : LinkSessionCore.DOC_STATUS.ACTIVE,
            requeststatus: ctx.requeststatus != null ? String(ctx.requeststatus) : LinkSessionCore.REQUEST_STATUS.RESOLVED
        });
    }

    buildUpdateReqStatusPayload(ctx) {
        return Object.assign(this._basePayload(LinkSessionCore.PROCESS.UPDATEREQSTATUS, ctx), {
            requeststatus: ctx.requeststatus || LinkSessionCore.REQUEST_STATUS.REJECTED,
            remarks: ctx.remarks || 'rejected_by_collator'
        });
    }

    buildClosePayload(ctx) {
        const now = String(Date.now());
        return Object.assign(this._basePayload(LinkSessionCore.PROCESS.CLOSE, ctx), {
            session_end_time: ctx.sessionEndTime || now
        });
    }

    buildSavePayload(ctx) {
        const lastSaved = ctx.lastSavedTime || (typeof IMPACT_SAVE !== 'undefined' && IMPACT_SAVE.state && IMPACT_SAVE.state.lastSaveTimestamp) ||
            String(Date.now());
        return Object.assign(this._basePayload(LinkSessionCore.PROCESS.SAVE, ctx), {
            last_saved_time: String(lastSaved)
        });
    }

    buildGetRequestStatusPayload(ctx) {
        return Object.assign(this._basePayload(LinkSessionCore.PROCESS.GETREQUESTSTATUS_PROCESS, ctx), {
            session_id: String(ctx.sessionId || ''),
            requestid: String(ctx.requestId || (typeof Request_ID !== 'undefined' ? Request_ID : '')),
            session_start_time: String(ctx.sessionStartTime || this.getSessionStartTime())
        });
    }

    buildUpdateReqStatusTimePayload(ctx) {
        const now = String(Date.now());
        const payload = Object.assign(this._basePayload(LinkSessionCore.PROCESS.UPDATE_REQSTATUS_TIME, ctx), {
            requeststatus: LinkSessionCore.REQUEST_STATUS.PENDING,
            request_send_time: ctx.requestSendTime || now,
            requestid: String(ctx.requestId || (typeof Request_ID !== 'undefined' ? Request_ID : ''))
        });
        if (ctx.oldrequestid) {
            payload.oldrequestid = String(ctx.oldrequestid);
        }
        if (ctx.oldrequest_send_time) {
            payload.oldrequest_send_time = String(ctx.oldrequest_send_time);
        }
        return payload;
    }

    buildSendRequestPayload(ctx) {
        const now = String(Date.now());
        return Object.assign(this._basePayload(LinkSessionCore.PROCESS.UPDATE_DOCSTATUS_REQSTATUS_INSERT_TIME, ctx), {
            session_id: String(ctx.sessionId || ''),
            session_start_time: ctx.sessionStartTime || this.getSessionStartTime(),
            docstatus: ctx.docstatus || '8',
            requeststatus: ctx.requeststatus || '7'
        });
    }

    buildUpdateSessionEndTimePayload(ctx) {
        return Object.assign(this._basePayload(LinkSessionCore.PROCESS.UPDATE_SESSION_END_TIME, ctx), {
            session_end_time: ctx.sessionEndTime || '0'
        });
    }

    buildSignoffPayload(ctx) {
        return this._basePayload(LinkSessionCore.PROCESS.SIGNOFF, ctx);
    }

    buildAcceptPayload(ctx) {
        return this.buildUpdateStatusReqStatusPayload(
            Object.assign({}, ctx, { docstatus: ctx.docstatus || '4', requeststatus: ctx.requeststatus || '3' })
        );
    }

    buildRejectPayload(ctx) {
        return this.buildUpdateReqStatusPayload(
            Object.assign({}, ctx, { requeststatus: LinkSessionCore.REQUEST_STATUS.REJECTED })
        );
    }

    _basePayload(process, ctx) {
        const docId = (ctx && ctx.docId) || (typeof DOC_ID !== 'undefined' ? DOC_ID : '');
        return {
            tbl: 'linksharing',
            docid: docId,
            process: process
        };
    }

    // -------------------------------------------------------------------------
    // HTTP
    // -------------------------------------------------------------------------

    enrichLinkSharePayload(jsondata) {
        const payload = Object.assign({}, jsondata);
        try {
            const docId = payload.docid || (typeof DOC_ID !== 'undefined' ? DOC_ID : '');
            const collabEnabled = typeof window.isCollabEnabled === 'function' && window.isCollabEnabled(docId);
            if (typeof SHARED_KEY !== 'undefined' && SHARED_KEY && SHARED_KEY.role && USER_INFO && USER_INFO.MAIL_ID) {
                if (!payload.username) payload.username = USER_INFO.MAIL_ID;
                if (!payload.role) payload.role = SHARED_KEY.role;
                if (!payload.rolename) payload.rolename = SHARED_KEY.rolename;
                if (payload.tbl === 'linksharing') {
                    delete payload._w;
                    delete payload._r;
                    if (collabEnabled) payload.collaborative = '1';
                    if (SHARED_KEY.corole && payload.rolename && payload.rolename.indexOf('Co-') !== 0) {
                        payload.rolename = 'Co-' + payload.rolename;
                    }
                }
            }
        } catch (err) {
            console.warn(err.message);
        }
        return payload;
    }

    // Common AJAX helper
    postRequest(url, payload, errorLabel) {
        const body = JSON.stringify(payload);
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                data: { jsondata: body },
                type: "post",
                dataType: "JSON",
                contentType: "application/json",
                beforeSend: function (request) {
                    request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
                    request.setRequestHeader("appkey", typeof APP_KEY !== "undefined" ? APP_KEY : "");
                    request.setRequestHeader("apikey", typeof API_KEY !== "undefined" ? API_KEY : "");
                },
                success: resolve,
                error: function (jqXHR, textStatus, errorThrown) {
                    reject(new Error(textStatus || errorThrown || `${errorLabel} request failed`));
                }
            });
        });
    }

    // Usage in your class/module
    postLinkShare(jsondata) {
        const payload = this.enrichLinkSharePayload(jsondata);
        return this.postRequest(API_LINK_SHARE, payload, "linksharing");
    }

    postGetDocs(query) {
        return this.postRequest(API_GET_DOCS, query, "getdocs");
    }


    getLandingTabId() {
        try {
            return sessionStorage.getItem('xmleditor:landing:tabid') || '';
        } catch (err) {
            return '';
        }
    }

    buildSessionFindQuery(expected) {
        const query = typeof GET_JSON === 'function' ? (GET_JSON('default') || {}) : {};
        query.tbl = 'linksharing';
        query.docid = expected.docId;
        query.find = {
            docid: expected.docId,
            rolename: expected.rolename,
            username: expected.username,
            docstatus: LinkSessionCore.DOC_STATUS.ACTIVE,
            session_end_time: '0'
        };
        query.length = 10;
        query.filter = [
            'docid', 'docstatus', 'session_id', 'session_start_time',
            'session_end_time', 'requeststatus', 'request_send_time', 'requestid'
        ];

        if (typeof SHARED_KEY !== 'undefined' && SHARED_KEY && SHARED_KEY.corole && String(SHARED_KEY.corole).trim() !== '') {
            if (SHARED_KEY.rolename != USER_INFO.TRACK_ROLE_NAME) {
                query.find.rolename = USER_INFO.TRACK_ROLE_NAME || ('Co-' + SHARED_KEY.rolename);
            }
        }

        return query;
    }

    isActiveSessionRecord(record, expected) {
        if (!record) {
            return false;
        }
        const serverSessionId = String(record.session_id || '').trim();
        const sessionEndTime = String(record.session_end_time || '').trim();
        const serverDocId = String(record.docid || '').trim();
        const expectedSessionId = String(expected.sessionId || '').trim();
        const expectedDocId = String(expected.docId || '').trim();

        if (!expectedSessionId) {
            return false;
        }
        if (serverDocId && expectedDocId && serverDocId !== expectedDocId) {
            return false;
        }
        if (sessionEndTime && sessionEndTime !== '0') {
            return false;
        }
        if (String(record.docstatus || '') !== LinkSessionCore.DOC_STATUS.ACTIVE) {
            return false;
        }
        if (serverSessionId && serverSessionId !== expectedSessionId) {
            return false;
        }
        if (expected.sessionStartTime) {
            const serverStart = String(record.session_start_time || '').trim();
            const expectedStart = String(expected.sessionStartTime).trim();
            if (serverStart && expectedStart && serverStart !== expectedStart) {
                return false;
            }
        }
        return true;
    }

    async validateBeforeSave(expected) {
        return this.confirmSessionOnServer(expected);
    }

    async confirmSessionOnServer(expected) {
        try {
            if (!expected || !expected.docId || !expected.sessionId) {
                return { ok: false, reason: 'missing_expected_fields' };
            }
            if (typeof API_GET_DOCS === 'undefined' || typeof GET_JSON !== 'function') {
                if (IS_LOCAL_HOST) {
                    return { ok: true, reason: 'local_validation_skipped' };
                }
                return { ok: false, reason: 'getdocs_unavailable' };
            }

            const response = await this.postGetDocs(this.buildSessionFindQuery(expected));
            const rows = response && Array.isArray(response.data) ? response.data : [];

            if (rows.length === 0) {
                return { ok: false, reason: 'no_active_row', rows: rows };
            }
            if (rows.length > 1) {
                return { ok: false, reason: 'multiple_active', rows: rows };
            }

            const row = rows[0];
            if (!this.isActiveSessionRecord(row, expected)) {
                return { ok: false, reason: 'record_mismatch', row: row, rows: rows };
            }

            return { ok: true, row: row, rows: rows };
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.confirmSessionOnServer', err.message);
            return { ok: false, reason: 'request_error', error: err.message };
        }
    }

    async maybeCollatorForceClose(response) {
        try {
            if (!response || typeof SHARED_KEY === 'undefined' || !SHARED_KEY) {
                return false;
            }
            if (response.role != SHARED_KEY.role && SHARED_KEY.rolename === 'Collator') {
                if (typeof commonfn !== 'undefined' && typeof commonfn.autoCloseCheckPoint === 'function') {
                    commonfn.autoCloseCheckPoint({ data: [response] }, {}, true);
                }
                await new Promise((resolve) => setTimeout(resolve, 2000));
                return true;
            }
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.maybeCollatorForceClose', err.message);
        }
        return false;
    }

    isCollabBypass(response) {
        try {
            const docId = typeof DOC_ID !== 'undefined' ? DOC_ID : '';
            const collabEnabled = typeof window.isCollabEnabled === 'function' && window.isCollabEnabled(docId);
            return !!(collabEnabled && !IS_LOCAL_HOST && response && response.r == 0);
        } catch (err) {
            return false;
        }
    }

    async commitStorageAndRedirect(ctx) {
        if (typeof ctx.onBeforeCommit === 'function') {
            await ctx.onBeforeCommit(ctx);
        }
        if (typeof ctx.onCommitStorage === 'function') {
            ctx.onCommitStorage(ctx.resData);
        }
        if (typeof ctx.onRedirect === 'function') {
            ctx.onRedirect(ctx);
        }
    }

    async completeAccessGrant(ctx, checkResponse, options) {
        const skipVerify = options && options.skipVerify === true;
        const canforceClose = options && options.canforceClose === true;

        if (!skipVerify && !canforceClose/*  && !IS_LOCAL_HOST */) {
            const serverStart = ctx.grantSessionStartTime
                || (checkResponse && checkResponse.session_start_time)
                || ctx.sessionStartTime;
            const verify = await this.confirmSessionOnServer({
                docId: ctx.docId,
                sessionId: ctx.sessionId,
                sessionStartTime: serverStart,
                rolename: ctx.rolename,
                username: ctx.username
            });
            if (!verify.ok) {
                console.warn('[LinkSessionModule] double-verify failed:', verify.reason, verify);
                if (typeof ctx.onVerifyFailed === 'function') {
                    return ctx.onVerifyFailed(checkResponse, verify, ctx);
                }
                return this.promptSendRequest(checkResponse, ctx);
            }
        }

        return this.commitStorageAndRedirect(ctx);
    }

    async loginFromLanding(ctx) {
        try {
            if (typeof ctx.onResetHidden === 'function') {
                ctx.onResetHidden();
            }

            const sessionStartTime = String(Date.now());
            const payload = this.buildCheckPayload({
                docId: ctx.docId,
                sessionId: ctx.sessionId,
                sessionStartTime: sessionStartTime,
                remarks: 'login',
                tabId: this.getLandingTabId(),
                source: 'landing'
            });

            ctx.sessionStartTime = sessionStartTime;
            this.captureLandingCtxState(ctx);
            const checkResponse = await this.postLinkShare(payload);
            return this.handleCheckResponse(checkResponse, ctx);
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.loginFromLanding', err.message);
            if (typeof ctx.onRequestError === 'function') {
                ctx.onRequestError(err, ctx);
            }
        }
    }

    async openFromEditor(ctx) {
        try {
            const sessionStartTime = String(Date.now());
            const payload = this.buildCheckPayload({
                docId: ctx.docId,
                sessionId: ctx.sessionId,
                sessionStartTime: sessionStartTime,
                remarks: ctx.remarks || 'new_tab',
                tabId: ctx.tabId || '',
                source: 'editor'
            });
            ctx.sessionStartTime = sessionStartTime;
            const checkResponse = await this.postLinkShare(payload);
            return this.handleEditorCheckResponse(checkResponse, ctx);
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.openFromEditor', err.message);
            throw err;
        }
    }

    async handleCheckResponse(response, ctx) {
        const canforceClose = await this.maybeCollatorForceClose(response);
        const collabBypass = this.isCollabBypass(response);

        if (response.r == 1 || collabBypass || canforceClose) {
            return this.completeAccessGrant(ctx, response, {
                skipVerify: collabBypass,
                canforceClose: canforceClose
            });
        }

        if (response.r == 0) {
            return this.delegateSendPrompt(response, ctx);
        }

        if (response.r == 2 && typeof ctx.onAccessDeniedWithRemarks === 'function') {
            return ctx.onAccessDeniedWithRemarks(response.remarks || 'NIL', ctx);
        }

        console.warn('[LinkSessionModule] unhandled check response', response);
    }

    async handleEditorCheckResponse(response, ctx) {
        if (typeof ctx.onEditorResponse === 'function') {
            return ctx.onEditorResponse(response, ctx);
        }
        return response;
    }

    delegateSendPrompt(response, ctx) {
        if (ctx && ctx.ui && typeof ctx.ui.sendPrompt === 'function') {
            return ctx.ui.sendPrompt(response, ctx);
        }
        if (typeof window !== 'undefined' && window.LinkSessionSendModule) {
            return window.LinkSessionSendModule.prompt(response, ctx);
        }
        if (ctx && typeof ctx.onRequestError === 'function') {
            return ctx.onRequestError(response, ctx);
        }
        console.warn('[LinkSessionCore] send prompt unavailable — no UI module');
        return Promise.resolve();
    }

    promptSendRequest(response, ctx) {
        return this.delegateSendPrompt(response, ctx);
    }

    async sendAccessRequest(response, ctx) {
        try {
            const now = Date.now();
            const requestId = String(ctx.requestId || Request_ID);

            if (response.requeststatus == 1) {
                if (moment(now).diff(parseInt(response.request_send_time, 10), 'minutes') > 30) {
                    const grantTime = String(now);
                    ctx.grantSessionStartTime = grantTime;
                    this.captureLandingCtxState(ctx);
                    const res = await this.postLinkShare(this.buildSendRequestPayload({
                        docId: ctx.docId,
                        sessionId: ctx.sessionId,
                        sessionStartTime: grantTime,
                        docstatus: '8',
                        requeststatus: '7'
                    }));
                    await this.handleUpdateOpen1(res, ctx);
                } else if (typeof ctx.onTryAgain === 'function') {
                    ctx.onTryAgain();
                }
                return;
            }

            if (response.requeststatus == 4 && response.requestid != 0 && response.request_send_time != 0) {
                if (moment(now).diff(parseInt(response.request_send_time, 10), 'minutes') > 30) {
                    const res = await this.postLinkShare(this.buildUpdateReqStatusTimePayload({
                        docId: ctx.docId,
                        requestId: requestId,
                        requestSendTime: String(now),
                        oldrequestid: String(response.requestid),
                        oldrequest_send_time: String(response.request_send_time)
                    }));
                    await this.handleUpdateReqId(res, ctx);
                } else if (typeof ctx.onTryAgain === 'function') {
                    ctx.onTryAgain();
                }
                return;
            }

            const res = await this.postLinkShare(this.buildUpdateReqStatusTimePayload({
                docId: ctx.docId,
                requestId: requestId,
                requestSendTime: String(now)
            }));
            await this.handleUpdateReqId(res, ctx);
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.sendAccessRequest', err.message);
            if (typeof ctx.onRequestError === 'function') {
                ctx.onRequestError(err, ctx);
            }
        }
    }

    async handleUpdateOpen1(response, ctx) {
        if (response.r == 1) {
            return this.completeAccessGrant(ctx, response, { skipVerify: false });
        }
        console.log('no records found');
        if (typeof ctx.onTryAgain === 'function') {
            ctx.onTryAgain('Land_Page_TRY_AGAIN_1');
        }
    }

    async handleUpdateReqId(response, ctx) {
        if (response.r != 1) {
            if (ctx && typeof ctx.onRequestError === 'function') {
                return ctx.onRequestError(response, ctx);
            }
            return;
        }
        if (ctx && ctx.ui && typeof ctx.ui.showPollWaiting === 'function') {
            return ctx.ui.showPollWaiting(ctx);
        }
        if (typeof window !== 'undefined' && window.LinkSessionSendModule) {
            return window.LinkSessionSendModule.showPollWaiting(ctx);
        }
        return this.pollRequestStatus(ctx);
    }

    async pollRequestStatus(ctx) {
        try {
            const grantSessionStartTime = String(ctx.sessionStartTime || Date.now());
            const payload = this.buildGetRequestStatusPayload({
                docId: ctx.docId,
                sessionId: ctx.sessionId,
                requestId: ctx.requestId || Request_ID,
                sessionStartTime: grantSessionStartTime
            });
            ctx.grantSessionStartTime = payload.session_start_time;
            this.captureLandingCtxState(ctx);
            const response = await this.postLinkShare(payload);
            return this.handleGetReqStatus(response, ctx);
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.pollRequestStatus', err.message);
            if (ctx && typeof ctx.onRequestError === 'function') {
                ctx.onRequestError(err, ctx);
            }
        }
    }

    async handleGetReqStatus(response, ctx) {
        if (response.r == 1) {
            return this.completeAccessGrant(ctx, response, { skipVerify: true });
        }
        if (response.r == 2) {
            const message = response.remarks ? response.remarks : 'NIL';
            if (typeof ctx.onAccessDeniedWithRemarks === 'function') {
                return ctx.onAccessDeniedWithRemarks(message, ctx);
            }
            return;
        }
        if (response.r == 0 && typeof ctx.onTryAgain === 'function') {
            ctx.onTryAgain('Land_Page_TRY_AGAIN_1');
        }
    }

    // -------------------------------------------------------------------------
    // Editor CHECK_REQUEST scheduler
    // -------------------------------------------------------------------------

    getSchedulerIntervalMs() {

        return 15000;
    }

    stopScheduler() {
        if (this._schedulerInterval) {
            clearInterval(this._schedulerInterval);
            this._schedulerInterval = null;
        }
        this._schedulerOwner = null;
    }

    startScheduler(owner, ctx) {
        ctx = ctx || {};
        this.stopScheduler();
        this._schedulerOwner = owner;

        if (owner && owner.forceStop) {
            return;
        }
        if (!navigator.onLine) {
            return;
        }
        if (typeof SHARED_KEY !== 'undefined' && !SHARED_KEY.apikey) {
            return;
        }

        const timerMs = ctx.intervalMs || this.getSchedulerIntervalMs();
        const json = this.getJsonOrBuild(LinkSessionCore.PROCESS.SCHEDULER, {}, ctx);
        const postFn = 'new_request_post';
        const self = this;

        this._schedulerInterval = setInterval(function () {
            if (owner && owner.forceStop) {
                self.stopScheduler();
                return;
            }
            if (!navigator.onLine) {
                if (owner && typeof owner.cancel === 'function') {
                    owner.cancel(owner.SCHEDULER, owner);
                }
                self.stopScheduler();
                return;
            }
            if (typeof commonfn !== 'undefined' && commonfn.callajax) {
                commonfn.callajax(json, postFn, API_LINK_SHARE, owner);
            }
            if (typeof commonMethods !== 'undefined' && commonMethods.cleanTranslatorExtensions) {
                commonMethods.cleanTranslatorExtensions();
            }
        }, timerMs);

        if (owner) {
            owner.SCHEDULER = this._schedulerInterval;
        }
    }

    handleNewRequestPost(response, ctx, owner) {
        try {
            if (owner && owner.forceStop) {
                return;
            }
            if (response.r == 1) {
                const updateJson = this.getJsonOrBuild(LinkSessionCore.PROCESS.UPDATEREQUESTSTATUS, {}, ctx);
                if (typeof commonfn !== 'undefined' && commonfn.callajax) {
                    commonfn.callajax(updateJson, 'open_new_request', API_LINK_SHARE, owner);
                }
            } else {
                this.handleIdleCheck(response, owner);
            }
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.handleNewRequestPost', err.message);
        }
    }

    handleOpenNewRequestDefault(response, owner) {
        try {
            if (owner && owner.forceStop) {
                return;
            }
            console.log(JSON.stringify(response));
            if (response.r == 1) {
                const lastSaved = response.data && response.data.last_saved_time;
                if (lastSaved != 0 &&
                    (moment(new Date().getTime()).diff(parseInt(lastSaved, 10), 'minutes') > 15)) {
                    _CanClose = true;
                    commonfn.callajax(
                        this.getJsonOrBuild('updatestatus_reqstatus', { docstatus: '2', requeststatus: '3' }),
                        'idle_session_close',
                        API_LINK_SHARE
                    );
                } else {
                    IMPACT_SAVE.iSave({ forcesave: true });
                    if (typeof openRequestDialog === 'function') {
                        openRequestDialog(this);
                    } else {
                        const dialog = typeof getRequestDialog === 'function'
                            ? getRequestDialog(this)
                            : (window.LinkSessionRequestDialog || window.LinkShareDialog);
                        if (dialog && typeof dialog.request_dialog === "function") {
                            dialog.request_dialog();
                        }
                    }
                }
            } else {
                console.log('no records found');
            }
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.handleOpenNewRequestDefault', err.message);
        }
    }

    handleIdleCheck(response, owner) {
        try {
            owner = owner || this._editorOwner;
            if (!owner || owner.forceStop) {
                return;
            }
            const lastSaveTimestamp = (IMPACT_SAVE && IMPACT_SAVE.state && IMPACT_SAVE.state.lastSaveTimestamp);

            if (!!lastSaveTimestamp || owner.check_boolean) {
                const newTime = new Date().getTime();
                const parseTime = parseInt(lastSaveTimestamp, 10);
                if ((moment(newTime).diff(parseTime, 'minutes') > owner.IDLE_CHECK_DURATION || owner.check_boolean) &&
                    !owner.Idle_Alert_State) {
                    owner.Idle_Alert_State = true;
                    this.cancelTimer(owner.SCHEDULER, owner);
                    owner.check_boolean = false;
                    if (GlobalEditor) {
                        GlobalEditor.setReadOnly(true);
                    }
                    AlertNewDialog.fire('idle_session_alert').then((result) => {
                        if (result.isConfirmed) {
                            IMPACT_SAVE.iSave({ forcesave: true, noalert: true });
                            if (GlobalEditor) {
                                GlobalEditor.setReadOnly(false);
                            }
                            this.initEditorSession(owner);
                        } else {
                            if (IS_LOCAL_HOST) {
                                return debug.warn("session_out");
                            }
                            _CanClose = true;
                            commonfn.callajax(
                                this.getJsonOrBuild('close', {}),
                                'logout_with_alert',
                                API_LINK_SHARE,
                                owner
                            );
                        }
                    });
                }
            }
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.handleIdleCheck', err.message);
        }
    }

    initEditorSession(owner) {
        try {
            owner = owner || this._editorOwner;
            if (!owner) {
                return false;
            }
            this._editorOwner = owner;
            if (owner.forceStop) {
                return false;
            }
            if (typeof DOC_ID === 'undefined' || DOC_ID == null) {
                this.timerMethod('update_session_end_time', {}, owner);
            } else {
                this.timerMethod('refresh', {}, owner);
            }
            if (typeof SHARED_KEY === 'undefined' || !SHARED_KEY.apikey) {
                return false;
            }
            this.timerMethod('scheduler', {}, owner);
            owner.Idle_Alert_State = false;
            return true;
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.initEditorSession', err.message);
            return false;
        }
    }

    timerMethod(process, options, owner) {
        try {
            owner = owner || this._editorOwner;
            if (!owner || owner.forceStop) {
                return;
            }
            let method = owner.INTERVAL_TYPE[process];
            let timer = owner.TIMER_INTERVAL[method ? process : 'default'];
            const postFunction = owner.POST_FN[process] ? owner.POST_FN[process] : owner.POST_FN.default;
            if (!method) {
                method = owner.INTERVAL_TYPE.default;
            }
            const json = this.getJsonOrBuild(process, {}, options);
            if (method === 'setInterval') {
                this.startScheduler(owner, { intervalMs: timer });
            } else {
                setTimeout(function (_json, postFun) {
                    commonfn.callajax(_json, postFun, API_LINK_SHARE, owner);
                }, timer, json, postFunction);
            }
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.timerMethod', err.message);
        }
    }

    checkOnline(owner) {
        try {
            owner = owner || this._editorOwner;
            if (!owner || owner.forceStop) {
                return;
            }
            if (typeof owner.SCHEDULER === 'number' && !window.navigator.onLine) {
                this.cancelTimer(owner.SCHEDULER, owner);
            } else if (typeof owner.SCHEDULER !== 'number') {
                this.timerMethod('scheduler', {}, owner);
            }
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.checkOnline', err.message);
        }
    }

    cancelTimer(timer, owner) {
        try {
            console.log("cancel Timer");
            timer = timer ? timer : (owner && owner.scheduler);
            clearTimeout(timer);
            clearInterval(timer);
            if (owner) {
                owner.SCHEDULER = null;
            }
            this.stopScheduler();
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.cancelTimer', err.message);
        }
    }

    stopEditorSession(owner) {
        try {
            owner = owner || this._editorOwner;
            if (!owner) {
                return;
            }
            owner.forceStop = true;
            this.cancelTimer(owner.SCHEDULER, owner);
            owner.Init = function () { };
            owner.check_request = function () { };
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.stopEditorSession', err.message);
        }
    }

    logoutWithAlert(response, opt, owner) {
        try {
            _CanClose = true;
            sessionStorage.setItem("status", "idle_session_sign_off");
            this.redirectCurrentSession(null, { remove: false, alert: "idle_session_sign_off" });
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.logoutWithAlert', err.message);
        }
    }

    funReturn(response, opt, owner) {
        try {
            console.log(JSON.stringify(response));
            if (response.r == 1) {
                console.log("updated close");
            }
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.funReturn', err.message);
        }
    }

    redirectCurrentSession(response, options) {
        options = Object.assign({ remove: true, readOnlyView: false }, options || {});
        var tempDirect = sessionStorage.getItem("redirect");
        var defaultRedirect = FinalizeDialog && FinalizeDialog.M_CONFIG.default;
        var final = tempDirect ? tempDirect : (defaultRedirect ? defaultRedirect : NG_WEB_URL);
        try {
            var PREFIXES = ["xmleditor:shared:", "xmleditor:apikey", "xmleditor:appkey"];
            var WSC_ATTR = ["wsc_autocorrect", "wsc_ignoreAllCapsWords", "wsc_ignoreDomainNames",
                "wsc_ignoreWordsWithMixedCases", "wsc_ignoreWordsWithNumbers", "wsc_lang"];
            if (options.remove && typeof DOC_ID !== 'undefined' && DOC_ID) {
                var keysToRemove = [];
                var i;
                for (i = 0; i < localStorage.length; i += 1) {
                    keysToRemove.push(localStorage.key(i));
                }
                keysToRemove.forEach(function (key) {
                    if (!key) {
                        return;
                    }
                    if (key.indexOf(DOC_ID) !== -1) {
                        localStorage.removeItem(key);
                        return;
                    }
                    PREFIXES.forEach(function (prefix) {
                        if (key.indexOf(prefix) === 0 && key.indexOf(DOC_ID) !== -1) {
                            localStorage.removeItem(key);
                        }
                    });
                    WSC_ATTR.forEach(function (attr) {
                        if (key === attr + DOC_ID || key.indexOf(attr) === 0 && key.indexOf(DOC_ID) !== -1) {
                            localStorage.removeItem(key);
                        }
                    });
                });
            }
            if (final.match(/validateurl/) && options.alert) {
                final = final + '&alert=' + options.alert;
            }
            _CanClose = true;
            _IsDirty = false;
            if (CKEDITOR && CKEDITOR.instances && CKEDITOR.instances.maineditor &&
                typeof CKEDITOR.instances.maineditor.setReadOnly === "function") {
                CKEDITOR.instances.maineditor.resetDirty();
                CKEDITOR.instances.maineditor.setReadOnly();
            }
            window.location.href = final;
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.redirectCurrentSession', err.message);
            window.location.href = final;
        }
    }

    createEditorFacade() {
        const mod = this;
        const facade = {
            SCHEDULER: null,
            forceStop: false,
            TIMER_INTERVAL: { scheduler: 15000, refresh_undo: 1500, default: 100 },
            INTERVAL_TYPE: { refresh: 'setTimeout', default: 'setTimeout', scheduler: 'setInterval' },
            POST_FN: {
                default: "fun_return",
                refresh: "fun_return",
                scheduler: "new_request_post",
                update_request_status: "open_new_request"
            },
            check_boolean: false,
            Idle_Alert_Showing: false,
            Idle_Alert_State: false,
            IDLE_CHECK_DURATION: 40,
            open_new_request: function (response, _ = facade) {
                return mod.handleOpenNewRequestDefault(response, _);
            },
            fun_return: function (response, opt, _ = facade) {
                return mod.funReturn(response, opt, _);
            },
            logout_with_alert: function (response, opt, _ = facade) {
                return mod.logoutWithAlert(response, opt, _);
            },
            runIdleCheck: function (response, _ = facade) {
                return mod.handleIdleCheck(response, _);
            },
            new_request_post: function (response, opt, _ = facade) {
                return mod.handleNewRequestPost(response, {}, _);
            },
            check_request: function (json, postFun, timer, _ = facade) {
                mod.startScheduler(_, { intervalMs: timer });
            },
            TIMER_METHOD: function (process, options, _ = facade) {
                return mod.timerMethod(process, options, _);
            },
            CHECK_ONLINE: function (_ = facade) {
                return mod.checkOnline(_);
            },
            Init: function (_ = facade) {
                return mod.initEditorSession(_);
            },
            StopAll: function (self = facade) {
                return mod.stopEditorSession(self);
            },
            cancel: function (timer, _ = facade) {
                return mod.cancelTimer(timer, _);
            }
        };
        this._editorOwner = facade;
        return facade;
    }

    handleOpenNewRequest(response, ctx, owner) {
        try {
            if (owner && owner.forceStop) {
                return;
            }
            if (ctx && typeof ctx.onOpenRequestDialog === 'function') {
                ctx.onOpenRequestDialog(response, owner);
            }
        } catch (err) {
            console.warn(err.message);
            ErrorLogTrace('LinkSessionCore.handleOpenNewRequest', err.message);
        }
    }

    handleResponse(process, response, ctx) {
        const p = String(process || '').toLowerCase();
        switch (p) {
            case LinkSessionCore.PROCESS.CHECK:
            case LinkSessionCore.PROCESS.REFRESH:
                return this.handleCheckResponse(response, ctx);
            case LinkSessionCore.PROCESS.SCHEDULER:
                return this.handleNewRequestPost(response, ctx);
            case LinkSessionCore.PROCESS.UPDATEREQUESTSTATUS:
                return this.handleOpenNewRequest(response, ctx);
            default:
                return { action: 'passthrough', process: p, response: response };
        }
    }
}

if (typeof window !== 'undefined') {
    window.LinkSessionCore = LinkSessionCore;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LinkSessionCore;
}
