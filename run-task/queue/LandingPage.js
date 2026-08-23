/*jslint white:true, for:true */
/*global scope, title */
console.log('validate');

// ─────────────────────────────────────────────────────────────────────────────
// LoadingUI — controls the #link-validating-overlay added to validateurl.html
// ─────────────────────────────────────────────────────────────────────────────
var LoadingUI = (function () {
    var overlay, iconWrap, spinner, check, xmark, heading, subtitle,
        progressFill, statusText, pctLabel;

    function _el(id) { return document.getElementById(id); }

    function _init() {
        if (overlay) return;
        overlay       = _el('link-validating-overlay');
        iconWrap      = _el('lvo-icon-wrap');
        spinner       = _el('lvo-spinner');
        check         = _el('lvo-check');
        xmark         = _el('lvo-xmark');
        heading       = _el('lvo-heading');
        subtitle      = _el('lvo-subtitle');
        progressFill  = _el('lvo-progress-fill');
        statusText    = _el('lvo-status-text');
        pctLabel      = _el('lvo-pct');
    }

    function show() {
        _init();
        if (overlay) overlay.style.display = 'flex';
    }

    function progress(pct, label) {
        _init();
        if (progressFill) progressFill.style.width = pct + '%';
        if (pctLabel)     pctLabel.textContent = pct + '%';
        if (label && statusText) statusText.textContent = label;
    }

    function success(msg) {
        _init();
        if (!overlay) return;
        iconWrap.classList.add('state-success');
        progressFill.classList.add('state-success');
        spinner.classList.add('hidden');
        check.classList.add('visible');
        if (heading)  heading.textContent  = 'Link validated!';
        if (subtitle) subtitle.textContent = msg || 'Loading your proof\u2026';
        progress(100, 'Ready');
        setTimeout(function () {
            overlay.classList.add('hide');
            setTimeout(function () { overlay.style.display = 'none'; }, 400);
        }, 700);
    }

    function error(msg) {
        _init();
        if (!overlay) return;
        iconWrap.classList.add('state-error');
        progressFill.classList.add('state-error');
        spinner.classList.add('hidden');
        xmark.classList.add('visible');
        if (heading)  heading.textContent  = 'Unable to open link';
        if (subtitle) subtitle.textContent = msg || 'Please check your link or contact support.';
        progress(100, 'Error');
    }

    function hide() {
        _init();
        if (!overlay) return;
        overlay.classList.add('hide');
        setTimeout(function () { overlay.style.display = 'none'; }, 400);
    }

    return { show: show, progress: progress, success: success, error: error, hide: hide };
}());


var [USER_INFO, commonfn, URL_PARAMETER, redirect_url, DOC_ID, DOC_DTD] = [{}, {}, {}, "", "", ""],
    LINK_STATUS_ALRET = ["signoff", "deactive"],
    NEW_SESSION_ID = Math.floor(10000000 + Math.random() * 90000000), Request_ID = Math.floor(100000000 + Math.random() * 900000000),
    [SHARED_KEY, RES_DATA, ERR_KEY, VALIDATE_BTN, _IsActive, _IsSignOff, IS_JOURNAL] = [null, null, null, null, true, false, false],
    ALERT_BROWSER = {
        "safari_old": "Currently IMPACT is not optimized for use with the latest version of the Safari browser; therefore, we recommend using Chrome instead.",
        "Safari": `Currently, IMPACT is not optimized for use with the latest version of Safari. We recommend you instead use Chrome to open and proof your proof while we update IMPACT to be compatible with the latest version of Safari.`,
        "notSupport": "The version of the browser you are using is no longer supported. Please upgrade to supported browser",
    },
    ALERT_MESSAGE = {
        'Land_Page_SESSION_OUT': {
            "type": "info",
            "title": "Session Ended",
            'text': 'Due to inactivity, your session got expired. Please click &ldquo;AGREE & CONTINUE&rdquo; to start a new session.',
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        },
        'Land_Page_FILE_DELETED': {
            "title": "File Deleted",
            "type": "info",
            'text': `The proofing link is expired. If you have not downloaded your proof, please contact &ldquo;<a class="font-weight-bold email-text" href="mailto:{{MAIL}}">{{TEXT}}</a>&rdquo;.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: false
            }
        },
        'Land_Page_SIGN_OFF': {
            "type": "info",
            "title": "Signed Off",
            'text': `The proof link has been approved, and the {{DOC_TYPE}} is now accessible in read-only mode.<br><br>{{human_time}}`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        },
        'Land_Page_EXPIRED': {
            "type": "info",
            "title": "Expired",
            // ? MOCK 19_FEB_2024 - YA - OUP_J_ LP_002
            'text': `The link you have used has expired and is invalid. If you need help, please contact our support team.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: false
            }
        },
        'Land_Page_INVALID': {
            "type": "error",
            "title": "Invalid Link",
            // ? MOCK 19_FEB_2024 - YA - OUP_J_ LP_002
            'text': `The link seems to be invalid or broken. Please verify the URL and try again. If the problem persists, kindly contact our support team for assistance.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        },
        'Land_Page_Link_Opened': {
            "type": "error",
            "title": "Request Denied!",
            'text': `Link has been already opened in another tab. Please check`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        },
        'Land_Page_NOT_SUPPORT_BROW': {
            "type": "warning",
            "title": "Unsupported Browser",
            'text': `The browser version you are using is no longer supported. Please upgrade to a supported version or switch to another supported browser. A list of supported browsers and versions is available at the bottom of the screen.`,
            "button1": "",
            "button2": "",
            "param": true,
            "Options": {
                hide: false
            }
        },
        'Land_Page_TRY_AGAIN': {
            "type": "error",
            "title": "Request denied",
            'text': `Please try after some time.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        },
        'Land_Page_TRY_AGAIN_1': {
            "type": "error",
            "title": "Request denied",
            'text': `Unable to process your request. Kindly try after some time.`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        },
        'Land_Page_Send_Req': {
            "type": "warning",
            "title": "",
            'text': `Oops! This session is either open with another user, or your session was closed without logging out correctly. Please press &lsquo;Send Request&rsquo; to regain access, or press &lsquo;Cancel&rsquo; to exit the tool.`,
            "button1": "Send Request",
            "button2": "Cancel",
            "param": true,
            "Options": {
                hide: true
            }
        },
        'Land_Page_Access_Denied': {
            "type": "error",
            "title": "Request Denied",
            'text': `You don&rsquo;t have access to the proof link for the following reason: %1%`,
            "button1": "OK",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        },
        'SCH_MAINTENANCE': {
            'text': "Kindly note that we will be experiencing server downtime due to scheduled maintenance from <span class='font-weight-bold'>{{T1}}&#x000a0;{{T1A}}</span> to <span class='font-weight-bold'>{{T2}}&#x000a0;{{T1A}}</span> (in your local time)."
        },
        'SECURITY_INVALID_IP': {
            "type": "error",
            "title": "Access denied",
            'text': `Your IP address and system do not have permission to access the IMPACT link. Please reach out to the PLOS team for assistance.`,
            "button1": "",
            "button2": "",
            "param": true,
            "Options": {
                hide: true
            }
        }
    },
    [OPEN_TIME, oPage_DOCID, CHECK_OPAGE] = [Date.now(), "", false];

var STORAGE_LANDING_TAB_ID_KEY = "xmleditor:landing:tabid";
var STORAGE_LANDING_TAB_ID = sessionStorage.getItem(STORAGE_LANDING_TAB_ID_KEY) || ((new Date().getTime()) + "_" + Math.random());
sessionStorage.setItem(STORAGE_LANDING_TAB_ID_KEY, STORAGE_LANDING_TAB_ID);

function getUrlParamValue(paramName) {
    try {
        var params = getUrlParameters(false);
        if (params && Object.prototype.hasOwnProperty.call(params, paramName)) {
            return params[paramName] || "";
        }
    } catch (err) { }
    return "";
}

function parseUrlParameters() {
    var params = {};
    try {
        var rawQuery = window.location.search ? window.location.search.substring(1) : "";
        if (!rawQuery) return params;

        var pairs = rawQuery.split('&');
        for (var i = 0; i < pairs.length; i++) {
            if (!pairs[i]) continue;
            var kv = pairs[i].split('=');
            var rawKey = kv[0] || "";
            if (!rawKey) continue;

            var rawVal = kv.length > 1 ? kv.slice(1).join('=') : "";
            var key = decodeURIComponent(rawKey.replace(/\+/g, " "));
            var value = decodeURIComponent(rawVal.replace(/\+/g, " "));
            params[key] = value;
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('parseUrlParameters', err.message);
    }
    return params;
}

function getUrlParameters(useCache) {
    try {
        var shouldUseCache = useCache !== false;
        if (shouldUseCache && URL_PARAMETER && Object.keys(URL_PARAMETER).length > 0) {
            return URL_PARAMETER;
        }

        URL_PARAMETER = parseUrlParameters();
        return URL_PARAMETER;
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('getUrlParameters', err.message);
        return URL_PARAMETER || {};
    }
}

function getCurrentLandingKey() {
    return (URL_PARAMETER && URL_PARAMETER.key) ? URL_PARAMETER.key : getUrlParamValue("key");
}

function setOpenPagesSignal(docId) {
    try {
        localStorage.openpages = JSON.stringify({
            docid: docId || "",
            key: getCurrentLandingKey() || "",
            tabId: STORAGE_LANDING_TAB_ID,
            ts: OPEN_TIME
        });
    } catch (err) { }
}

function shortKey(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0; // force 32-bit int
    }
    return "rk_" + Math.abs(hash); // "rk_" prefix to avoid collisions
}




window.addEventListener('storage', function (e) {
    try {
        var parsedValue = null;
        if (typeof e.newValue === "string" && e.newValue !== "") {
            try {
                parsedValue = JSON.parse(e.newValue);
            } catch (jsonErr) {
                parsedValue = null;
            }
        }

        if (e.key == "openpages") {
            OPEN_TIME = Date.now();
            var reqDocId = parsedValue && parsedValue.docid ? parsedValue.docid : "";
            var reqKey = parsedValue && parsedValue.key ? parsedValue.key : "";
            var reqTabId = parsedValue && parsedValue.tabId ? parsedValue.tabId : "";
            var currentKey = getCurrentLandingKey();

            var isAnotherTab = reqTabId && reqTabId !== STORAGE_LANDING_TAB_ID;
            var isSameDoc = reqDocId && DOC_ID && reqDocId === DOC_ID;
            var isSameKey = reqKey && currentKey && reqKey === currentKey;

            if (isAnotherTab && (isSameDoc || isSameKey)) {
                localStorage.page_available = JSON.stringify({
                    docid: DOC_ID || "",
                    key: currentKey || "",
                    requestTabId: reqTabId,
                    responderTabId: STORAGE_LANDING_TAB_ID,
                    ts: OPEN_TIME
                });
            }
        }
        let temp_key = null;
        if (e.url.indexOf('validateurl') > -1) {
            temp_key = e.url.split('=')[1];
        } else {
            var oPage_IS_TRACK = ((e.url.match(/TrackView/)) ? (true) : (false));
            var oPage_IS_EDITOR = ((e.url.match(/(editor[0-9])/)) ? (true) : (false));
            if (oPage_IS_EDITOR) {
                if (e.url.split('?')[1].indexOf('docid') > -1) {
                    oPage_DOCID = e.url.split('=')[1];
                }
            }
        }
        if (e.key == "page_available") {
            var IsSameLink = false;
            if (DOC_ID == "") CHECK_OPAGE = true;

            if (parsedValue && parsedValue.requestTabId) {
                var currentKeyForReply = getCurrentLandingKey();
                var isTargetedToThisTab = parsedValue.requestTabId === STORAGE_LANDING_TAB_ID;
                var isFromAnotherTab = parsedValue.responderTabId && parsedValue.responderTabId !== STORAGE_LANDING_TAB_ID;
                var isSameKeyReply = parsedValue.key && currentKeyForReply && parsedValue.key === currentKeyForReply;
                var isSameDocReply = parsedValue.docid && DOC_ID && parsedValue.docid === DOC_ID;

                IsSameLink = isTargetedToThisTab && isFromAnotherTab && (isSameKeyReply || isSameDocReply);

                if (parsedValue.docid) {
                    oPage_DOCID = parsedValue.docid;
                }
            } else if ((temp_key && temp_key == URL_PARAMETER.key) || (oPage_DOCID && oPage_DOCID == DOC_ID)) { //&&OPEN_TIME==e.newValue
                IsSameLink = true;
            }

            if (IsSameLink) {
                console.warn('One more page already open');

                setTimeout(function () {
                    Invalid_Alertfn('Land_Page_Link_Opened');
                }, 1000);
            }
            localStorage['page_available_' + (oPage_DOCID || DOC_ID)] = IsSameLink;
        } else localStorage.removeItem('page_available_' + (oPage_DOCID || DOC_ID))
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('addEventListener-storage', err.message);
    }

}, false);





document.addEventListener('DOMContentLoaded', async function (event) {
    try {
        LoadingUI.show();
        LoadingUI.progress(10, 'Initialising\u2026');
        console.log("Ready function");
        if (!window.browserInfo) {
            fireEvent_browser_validation();
        }
        // Wait briefly if browserInfo hasn't initialized yet
        let retries = 5;
        while (!window.browserInfo && retries-- > 0) {
            await new Promise(r => setTimeout(r, 100)); // wait 100ms
        }

        if (!window.browserInfo.isCompatible) {
            setTimeout(() => {
                console.log("lp--11");
                if (typeof isSweetAlertVisible == "function" && isSweetAlertVisible()) {
                    console.log('SweetAlert is showing');
                } else {
                    console.log('No SweetAlert visible');
                    Invalid_Alertfn('Land_Page_NOT_SUPPORT_BROW', {});
                }
            }, 2500);
            window.scrollTo(0, document.body.scrollHeight);
            return;
        }
        console.log("lp--22");

        if (!['undefined', 'defined'].includes(typeof AlertNewDialog)) AlertNewDialog.init();
        if (window.MAINTENANCE) {
            MAINTENANCE.Init({
                init: true,
                fire: true
            });
        }
        VALIDATE_BTN = document.getElementById('ValidateBtnOpt');
        URL_PARAMETER = getUrlParameters(false);
        if (!URL_PARAMETER.key) {
            console.log("key missing.");
            LoadingUI.error('No access key found in this URL.');
            Invalid_Alertfn(null, {
                url: URL_PARAMETER.key
            });
            return false;
        } else if (URL_PARAMETER.alert) {
            if (URL_PARAMETER.alert == "idle_session_sign_off") {
                AlertNewDialog.fire('Land_Page_SESSION_OUT');
            }
        }


        var jsondata = { "key": String(URL_PARAMETER.key) };
        var endPoint = API_URL_VALIDITY;
        var PostFun = 'validateuserpost';

        LoadingUI.progress(30, 'Validating link\u2026');
        commonfn.callajaxwithoutjsontype(jsondata, PostFun, endPoint);
        document.querySelectorAll(`[title="Guided Tour"],[title="Video Tutorial"]`).forEach(elm => {
            elm.onclick = function (e) {
                let target = e.currentTarget;
                if (target)
                    user_click_record(/guide/gi.test(target.getAttribute("title")) ? "guided_tour" : "video_tour");
            }
        });
    } catch (err) {
        console.warn(err.message);
        LoadingUI.error('An unexpected error occurred.');
        ErrorLogTrace('addEventListener-DOMContentLoaded', err.message);

        try {
            var urlKey = shortKey(window.location.href);
            var limit = 3;
            var count = parseInt(localStorage.getItem(urlKey), 10) || 0;

            if (count < limit) {
                localStorage.setItem(urlKey, count + 1);
                window.location.reload();
            } else {
                console.warn("Reload limit reached for:", window.location.href);
                setTimeout(() => localStorage.removeItem(urlKey), 60 * 1000);
            }
        } catch (storageErr) {
            console.error("Reload safeguard failed:", storageErr.message);
        }
    }
});
commonfn.callajaxwithoutjsontype = function (jsondata, postfun, url, opt = '') {

    jsondata = JSON.stringify(jsondata);
    console.log("000==> common fn before calling ajax" + jsondata);
    $.ajax({
        url: url,
        data: {
            'jsondata': jsondata
        },
        type: "post",
        dataType: "json",
        contentType: "application/x-www-form-urlencoded; charset=UTF-8",
        beforeSend: function (request) {
            request.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded;charset=UTF-8');
            request.setRequestHeader("appkey", APP_KEY);
            request.setRequestHeader("apikey", API_KEY);
        },
        success: function (response) {
            if (commonfn[postfun]) {
                commonfn[postfun](response, opt);
            } else if (opt && (opt[postfun] || (opt['M_FUN'] && opt['M_FUN'][postfun]))) {
                if (opt[postfun]) {
                    opt[postfun](response, opt);
                } else {
                    opt['M_FUN'][postfun](response, opt);
                }
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
            if (['validateuserpost'].includes(postfun)) {
                //? Tomcat closed 19_MAY_2023 - DR
                //window.location.href = DOMAIN_ROOT + "servermaintenance.html?" + window.location.href;
                //? OUP_J_ LP_002 Fixed DR_04_08_2023
                LoadingUI.error('Server connection failed. Please try again.');
                Invalid_Alertfn(null, {
                    url: URL_PARAMETER.key
                });
                return false;
            } else {
                // ? 20_MAY_2023 - YA
                Invalid_Alertfn(null, {
                    url: URL_PARAMETER.key
                });
            }
        }
    });
};
commonfn.callajax = function (jsondata, postfun, url, opt = '') {
    try {
        const collabEnabled = localStorage.getItem(`xmleditor:collabEnabled:${DOC_ID}`) === "true";
        try {
            if (SHARED_KEY && SHARED_KEY.role && USER_INFO.MAIL_ID) {
                if (!jsondata.username) jsondata.username = USER_INFO.MAIL_ID;
                if (!jsondata.role) jsondata.role = SHARED_KEY.role;
                if (!jsondata.rolename) jsondata.rolename = SHARED_KEY.rolename;
                if (jsondata.tbl == "linksharing") {
                    delete jsondata['_w'];
                    delete jsondata['_r'];

                    if (collabEnabled) jsondata.collaborative = "1";

                    if (SHARED_KEY.corole) {
                        if (jsondata.rolename && jsondata.rolename.indexOf("Co-") !== 0) {
                            jsondata.rolename = "Co-" + jsondata.rolename;
                        }
                    }
                }

            }
        } catch (err) { }
        jsondata = JSON.stringify(jsondata);
        $.ajax({
            url: url,
            data: {
                'jsondata': jsondata
            },
            type: "post",
            dataType: "JSON",
            contentType: "application/json",
            beforeSend: function (request) {
                request.setRequestHeader("Content-Type", 'application/x-www-form-urlencoded;charset=UTF-8');
                request.setRequestHeader("appkey", APP_KEY);
                request.setRequestHeader("apikey", API_KEY);
            },
            success: function (response) {
                if (commonfn[postfun]) {
                    commonfn[postfun](response, opt);
                } else if (opt && (opt[postfun] || (opt['M_FUN'] && opt['M_FUN'][postfun]))) {
                    if (opt[postfun]) {
                        opt[postfun](response, opt);
                    } else {
                        opt['M_FUN'][postfun](response, opt);
                    }
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log("error calling: " + postfun);
                console.log(textStatus, errorThrown);
                if (['validateuserpost'].includes(postfun)) {
                    Invalid_Alertfn(null, {
                        url: URL_PARAMETER.key
                    });
                    return false;
                }
            }
        });
    } catch (err) {
        console.warn(err.message);
    }
};
commonfn.validateuserpost = async function (response) {
    try {
        console.log(JSON.stringify(response));

        LoadingUI.progress(70, 'Checking access\u2026');

        const resData = response.data;
        resData['r'] = response.r;
        resData['enable'] = response.enable;

        initializeGlobalVariables(resData);

        updateUserInfo(resData);
        updateUIWithDocumentInfo(resData);
        handleCoverImage(resData);

        // Give a short window for existing tabs to answer the openpages signal.
        var alreadyOpenInSameBrowser = await waitForExistingPageSignal(resData.docid, 800);
        if (alreadyOpenInSameBrowser) {
            Invalid_Alertfn('Land_Page_Link_Opened');
            return;
        }

        const linkStatus = resData.status;
        const isActive = isLinkActive(linkStatus);
        const isExpired = Boolean(resData.fdel);

        if (!handleLinkStatus(linkStatus, isExpired, resData)) {
            return;
        }

        if (!isActive || isExpired) {
            return false;
        }
        // finalizeUserPost(resData);
        saveLocalStorageData(resData);
        updateDocViewHistory(resData);
        await handleUserValidation(resData, response);
        LoadingUI.success();

    } catch (err) {
        console.warn(err.message);
        LoadingUI.error('Failed to process server response.');
        ErrorLogTrace('validateuserpost', err.message);
    }
};
commonfn.docviewpost = function (response, args) {
    //console.log(DOMAIN_ROOT,args,JSON.stringify(response));
    if (response["r"] == 1) {
        var local_domain = (IS_LOCAL_HOST && !DOMAIN_ROOT.includes('dist') ? '' : "" + DOMAIN_ROOT);
        if ((args[0]) && (args[0] == 1)) { // open math
            redirect_url = local_domain + PAGE_ReDIRECT[0] + args[1];
        } else {
            redirect_url = local_domain + PAGE_ReDIRECT[0] + args[1];
        }
    }
};
commonfn.checkaccess = async function (response) {
    try {
        console.log(JSON.stringify(response)); //valid user
        const isCollabEnabled = localStorage.getItem(`xmleditor:collabEnabled:${DOC_ID}`) === "true";
        var canforceClose = false;
        if (response.role != SHARED_KEY.role && SHARED_KEY.rolename == "Collator") {
            commonfn.autoCloseCheckPoint({ data: [response] }, {}, true);
            canforceClose = true;
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (response.r == 1 || (isCollabEnabled && !IS_LOCAL_HOST) || canforceClose) {
            // ? Check and Insert in DB /* ||response.r == 0&&response.docid=='Nc6e53375-c976-45b8-a729-313a17fbc5cf' */
            setItemsandReDirect(DOC_ID, NEW_SESSION_ID, window.location.href, redirect_url, {
                redirect: true
            });
        } else if (response.r == 0) {
            AlertNewDialog.fire('Land_Page_Send_Req').then((result) => {
                if (result.isConfirmed) {
                    console.log(response.requeststatus);
                    if (response.requeststatus == 1) {
                        // ? check below condition !=0
                        if (moment(new Date().getTime()).diff(parseInt(response.request_send_time), 'minutes') > 30) {
                            var jsondata = {
                                "tbl": "linksharing",
                                "docid": DOC_ID,
                                "session_id": NEW_SESSION_ID.toString(),
                                "session_start_time": new Date().getTime().toString(),
                                "docstatus": "8",
                                "requeststatus": "7",
                                "process": "update_docstatus_reqstatus_insert_time"
                            };
                            commonfn.callajax(jsondata, 'update_open1', API_LINK_SHARE);
                        } else {
                            Invalid_Alertfn("Land_Page_TRY_AGAIN");
                            return;
                        }
                    } else if ((response.requeststatus == 4) && (response.requestid != 0) && (response.request_send_time != 0)) {
                        if (moment(new Date().getTime()).diff(parseInt(response.request_send_time), 'minutes') > 30) {
                            var jsondata = {
                                "tbl": "linksharing",
                                "docid": DOC_ID,
                                "requeststatus": "1",
                                "oldrequestid": response.requestid.toString(),
                                "oldrequest_send_time": response.request_send_time.toString(),
                                "request_send_time": new Date().getTime().toString(),
                                "requestid": Request_ID.toString(),
                                "process": "update_reqstatus_time"
                            };
                            console.log(jsondata);
                            commonfn.callajax(jsondata, 'updatereq_id', API_LINK_SHARE);
                        } else {
                            Invalid_Alertfn("Land_Page_TRY_AGAIN");
                            return;
                        }
                    } else {
                        var JS_DATA = {};
                        JS_DATA.tbl = "linksharing";
                        JS_DATA.docid = DOC_ID;
                        JS_DATA.requeststatus = "1";
                        JS_DATA.request_send_time = new Date().getTime().toString();
                        JS_DATA.requestid = Request_ID.toString();
                        JS_DATA.process = "update_reqstatus_time";
                        console.log(JS_DATA);
                        commonfn.callajax(JS_DATA, 'updatereq_id', API_LINK_SHARE);
                    }
                } else { //file will not open
                    // ? Siva instruction
                    //AlertNewDialog.fire('warning','Warning','Kindly try after sometime','OK','');
                    // Swal.fire('Kindly try after sometime');
                }
            });
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('checkaccess', err.message);
    }
};
commonfn.update_open1 = function (response) {
    try {
        if (response.r == 1) {
            setItemsandReDirect(DOC_ID, NEW_SESSION_ID, window.location.href, redirect_url, {
                redirect: true
            });
        } else {
            console.log("no records found");
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('update_open1', err.message);
    }
};
commonfn.updatereq_id = function (response) {
    try {
        console.log("updatereq_id:" + JSON.stringify(response));
        console.log(response.r);
        if (response.r == 1) {
            let timerInterval;
            const swalWithBootstrapButtons = Swal.mixin({
                customClass: {
                    confirmButton: 'btn-success-auto',
                    //cancelButton: 'btn btn-danger'
                },
                buttonsStyling: true
            });
            swalWithBootstrapButtons.fire({
                /* The dialogue box will be closed within <b></b> seconds! Your request has been sent and waiting for approval.*/
                title: 'IMPACT',
                html: 'The dialogue box will be closed in <b></b> seconds. Your request has been sent and is waiting for approval.',
                timer: 45000,
                allowOutsideClick: false,
                allowEscapeKey: false,
                timerProgressBar: true,
                didOpen: (modal) => {
                    Swal.showLoading();
                    timerInterval = setInterval(() => {
                        const timerElement = modal.querySelector('b');
                        if (timerElement) {
                            timerElement.textContent = (Swal.getTimerLeft() / 1000).toFixed(0);
                        }
                    }, 100);
                },
                willClose: () => {
                    clearInterval(timerInterval);
                }
            }).then((result) => {
                if (result.dismiss === Swal.DismissReason.timer) {
                    var jsondata = {
                        "tbl": "linksharing",
                        "docid": DOC_ID,
                        "session_id": NEW_SESSION_ID.toString(),
                        "requestid": Request_ID.toString(),
                        "session_start_time": new Date().getTime().toString(),
                        "process": "getrequeststatus_process"
                    };
                    commonfn.callajax(jsondata, 'getreqstatus', API_LINK_SHARE);
                }
            });
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('updatereq_id', err.message);
    }
};
commonfn.getreqstatus = function (response) {
    try {
        console.log(JSON.stringify(response));
        if (response.r == 1) { //valid user
            setItemsandReDirect(DOC_ID, NEW_SESSION_ID, window.location.href, redirect_url, {
                redirect: true
            });
        } else if (response.r == 2) {
            // ? TNF_B_LIS_006 - shows reject reason as '%1%' , Changed from "" to "NIL" - RJ - 12/10/23
            var message = response.remarks ? response.remarks : "NIL";
            AlertNewDialog.fire('Land_Page_Access_Denied', {
                find: "%1%",
                replace: message,
                hide: true,
                force: true
            });
            return;
        } else if (response.r == 0) { // ? need to check
            Invalid_Alertfn("Land_Page_TRY_AGAIN_1");
            //AlertNewDialog.fire('error', '', 'Unable to Process the request. Kindly try after some time', 'OK', '');
            return;
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('getreqstatus', err.message);
    }
};
commonfn.coverCheckPoint = function (response, opt) {
    try {
        console.log(JSON.stringify(response));
        if (response.r == 1) {
            if (typeof IMPACT.USER_ENV_INFO.isSafari != "undefined" && IMPACT.USER_ENV_INFO.isSafari) {
                console.log(this);
            }

            if (RES_DATA && RES_DATA.titleinfo && RES_DATA.titleinfo.cover) {
                let cover = GET_COVER_IMG_URL(RES_DATA.titleinfo.cover);
                let image = document.createElement('img');
                image.setAttribute('id', 'image000');
                image.setAttribute('class', 'card-img-left shadow');
                image.setAttribute('alt', 'cover');
                if (typeof IMPACT.USER_ENV_INFO.isSafari != "undefined" && IMPACT.USER_ENV_INFO.isSafari) {
                    console.log('COVER---> ' + cover);
                    console.log('coverDiv---> ' + coverDiv);
                }
                image.setAttribute('src', cover);
            }


            let coverDiv = document.querySelector('.cover_div');
            if (coverDiv) {
                coverDiv.classList.remove('d-none', 'ds-none');
                coverDiv.appendChild(image);
            }
            if (!LINK_STATUS_ALRET.includes(RES_DATA.status)) {
                VALIDATE_BTN.classList.remove('d-none', 'ds-none');
            }
        } else {
            if ((!LINK_STATUS_ALRET.includes(RES_DATA.status))) {
                VALIDATE_BTN.classList.remove('d-none', 'ds-none');
            }
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('coverCheckPoint', err.message);
    }
};
commonfn.autoCloseCheckPoint = function (response, opt, force = false) {
    try {
        var RES_DATA = null;
        var RES_LAST_SAVE = 1111111;
        var RES_SESS_ID = false;
        var RES_START_TIME = false;
        if (response.data.length > 0) {
            RES_DATA = response.data[0];
            RES_LAST_SAVE = RES_DATA.last_saved_time;
            RES_SESS_ID = RES_DATA.session_id;
            RES_START_TIME = RES_DATA.session_start_time;
            if (RES_LAST_SAVE && RES_START_TIME || force) {
                VALIDATE_LAST_TIME(RES_LAST_SAVE, RES_START_TIME, RES_SESS_ID, force);
            }
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('autoCloseCheckPoint', err.message);
    }
};
commonfn.autoCloseMethod = function (response) {
    try {
        console.log('autoCloseMethod==>');
        console.log(JSON.stringify(response));
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('autoCloseMethod', err.message);
    }
};
commonfn.opensharedpost = function (response) {
    try {
        console.log("File Now Ready to Open");
        if (response.r == 0) {
            console.log(JSON.stringify(response));
        }
        let direct = sessionStorage.getItem('redirect');
        if (direct && direct.indexOf('validateurl') !== -1) {
            window.location.href = direct;
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('opensharedpost', err.message);
    }
};

function isSweetAlertVisible() {
    /* 
    swal2-container swal2-center swal2-backdrop-show
        swal2-popup swal2-modal swal2-icon-error swal2-show 
    

    */
    // Check for the original SweetAlert overlay and modal
    const sweetOverlay = document.querySelector('.swal-overlay,.swal2-container');
    const sweetAlert = document.querySelector('.swal-overlay--show-modal, .swal2-show');
    // Check if both elements exist and are visible
    if (sweetOverlay && sweetAlert) {
        const overlayStyle = window.getComputedStyle(sweetOverlay);
        const alertStyle = window.getComputedStyle(sweetAlert);

        return overlayStyle.display !== 'none' &&
            overlayStyle.opacity !== '0' &&
            alertStyle.display !== 'none' &&
            alertStyle.opacity !== '0';
    }

    return false;
}

// Example usage with polling
function checkAlertStatus() {
    if (isSweetAlertVisible()) {
        console.log('SweetAlert is showing');
        // Your code for when alert is visible
        return true;
    } else {
        console.log('No SweetAlert visible');
        // Your code for when alert is not visible
        return false;
    }
}

function VALIDATE_LAST_TIME(LAST_TIME_SAVE, START_TIME, SESS_ID, force = false) {
    try {
        var DIFF_TIME = moment(new Date().getTime()).diff(parseInt(LAST_TIME_SAVE), 'minutes');
        var STRT_TIME = moment(new Date().getTime()).diff(parseInt(START_TIME), 'minutes');
        if (DIFF_TIME > 20 && STRT_TIME > 20 || force) {
            var json_data = {
                "tbl": "linksharing",
                "docid": DOC_ID,
                "session_end_time": new Date().getTime().toString(),
                "process": "close"
            };
            if (SESS_ID) {
                json_data.session_id = SESS_ID;
            }
            commonfn.callajax(json_data, 'autoCloseMethod', API_LINK_SHARE);
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('VALIDATE_LAST_TIME', err.message);
    }
}

function redirect() {
    try {
        var jsondata = {
            "tbl": "linksharing",
            "docid": DOC_ID,
            "session_id": NEW_SESSION_ID.toString(),
            "session_start_time": new Date().getTime().toString(),
            "process": "check",
            "remarks": "login"
        };
        var sendParams = Object.assign({}, ADD_DEFAULT_KEYS("defaults"), jsondata);
        commonfn.callajax(sendParams, 'checkaccess', API_LINK_SHARE);
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('redirect', err.message);
    }
}

function GetUrlParameter() {
    try {
        URL_PARAMETER = getUrlParameters(false);
        return true;
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('GetUrlParameter', err.message);
    }
}

function setItemsandReDirect(DOC_ID, NEW_SESSION_ID, url, re_direct, Options) {
    try {
        Options = !Options ? ({
            redirect: false
        }) : Options;
        sessionStorage.clear();
        if (url.indexOf("idle_session_sign_off") > -1) {
            url = url.replace("&alert=idle_session_sign_off", "");
        }
        sessionStorage.setItem("xmleditor:docid", DOC_ID);
        sessionStorage.setItem("sessionid", NEW_SESSION_ID);
        sessionStorage.setItem("redirect", url);
        if (window.MAINTENANCE && MAINTENANCE.ON) {
            sessionStorage.setItem("MAINTENANCE_START", MAINTENANCE.START);
        }
        if (Options.redirect) {
            window.location.href = re_direct;
            console.log('redirect');
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('setItemsandReDirect', err.message);
    }
}
const ValidateUserSession = function (eMail) {
    try {
        let reCheck = document.getElementById('eMailValidate');
        if (eMail) {
            USER_INFO.MAIL_ID = eMail;
            // localStorage.setItem("xmleditor:username", eMail);
            VALIDATE_BTN.click();
        } else {
            reCheck.classList.remove('ds-none');
            VALIDATE_BTN.classList.add('d-none');
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('ValidateUserSession', err.message);
    }
};

function Invalid_Alertfn(AlertKey, Options = {}) {
    try {
        iGetElmById('ValidateBtnOpt', {
            addClass: 'ds-none'
        });
        if (['undefined', 'defined'].includes(typeof AlertNewDialog)) {
            setTimeout(function (Key, Opt) {
                Invalid_Alertfn(Key, Opt);
            }, 750, AlertKey, Options)
            return;
        }
        AlertKey = (AlertKey == null ? 'Land_Page_INVALID' : AlertKey);
        AlertNewDialog.fire(AlertKey).then((result) => {
            if (result.isConfirmed) {
                if (Options.confirm == 'confirm_redirect') {
                    window.location = Options.redirect;
                } else {

                }
                debug.log(Options);
            }
        });
        if (AlertKey.match(/INVALID/) != null || AlertKey == null) {
            // ErrorLogTrace('InvalidKey', Options.url ? Options.url : DOMAIN_URL);
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('Invalid_Alertfn', err.message);
    }
}

function CloseToOpen_Dev() {
    try {
        let tempjson = {
            "tbl": "Shareandinvite",
            "find": {
                "id": SHARED_KEY['_id']
            },
            "update": {
                "status": "active"
            }
        }
        commonfn.callajax(tempjson, 'opensharedpost', API_FIND_UPDATE_INSERT);
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('CloseToOpen_Dev', err.message);
    }

}


function GuidedTourLanding() {
    const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
            //confirmButton: 'btn-success-auto',
            cancelButton: 'btn btn-danger'
        },
        buttonsStyling: false
    });
    swalWithBootstrapButtons.fire({
        html: "The guided tour assists in familiarizing users with key features of the proofing system, enhancing navigation. Upon clicking the 'Agree and Continue' button located at the bottom of this page, you will gain access to the editor page for proofing and editing tasks. For first-time users, the system automatically guides the essential IMPACT features. You can activate this guidance by using the 'Guided Tour' button found at the top right corner of the editor page.",
        imageUrl: "UI/svg/landing/LandGT.png",
        width: '41em',
        imageWidth: 497,
        imageHeight: 155,
        showConfirmButton: false,
        showCancelButton: true,
        cancelButtonText: "Close",
        imageAlt: "guidedtour"
    });
}


function isLinkActive(linkStatus) {
    return linkStatus && linkStatus == "active";
}

/**
 * Checks if a user has free access based on the API response
 * Handles multiple temporaryAccess formats and access conditions
 * 
 * @param {Object} response - The API response object
 * @returns {Boolean} - Returns true if user has free access, false otherwise
 */
function canUserAccessFreely(resData, response) {
    // Case 1: Standard access without security (r=1)
    if (response.r === 1) {
        // return true;
    }


    // Case 2: Check for temporary access
    if (resData.hasOwnProperty('temporaryAccess') && resData.temporaryAccess) {
        const { $numberLong } = resData.temporaryAccess
        const currentTime = new Date();

        // Try parsing as JSON format first
        try {
            let accessData;

            // Check if it's already a JSON object or a JSON string
            if (typeof $numberLong === 'string') {
                // Handle string format
                if ($numberLong.startsWith('{')) {
                    // Try to parse as JSON string
                    accessData = JSON.parse($numberLong);
                } else {
                    // Handle legacy format (direct timestamp string)
                    const accessTime = new Date(parseInt($numberLong));
                    const hoursDifference = (currentTime - accessTime) / (1000 * 60 * 60);
                    return hoursDifference < 4;
                }
            } else {
                // Already an object
                accessData = resData.temporaryAccess;
            }

            // Process the JSON access data
            // Case 2.1: If expiry exists and has value, validate against current time
            if (accessData.hasOwnProperty('expiry') && accessData.expiry) {
                const expiryTime = new Date(parseInt(accessData.expiry.$numberLong));
                return currentTime < expiryTime;
            }
            // Case 2.2: If no expiry or empty expiry, check 4-hour window from create_at
            else if (accessData.hasOwnProperty('create_at') && accessData.create_at) {
                const createTime = new Date(parseInt(accessData.create_at.$numberLong));
                const hoursDifference = (currentTime - createTime) / (1000 * 60 * 60);
                return hoursDifference < 4;
            }
            // Case 2.3: No valid timestamp found in JSON
            return false;

        } catch (error) {
            // If parsing failed, try to handle as a direct timestamp string
            try {
                const accessTime = new Date(parseInt($numberLong));
                // Verify we got a valid date
                if (!isNaN(accessTime.getTime())) {
                    const hoursDifference = (currentTime - accessTime) / (1000 * 60 * 60);
                    return hoursDifference < 4;
                }
            } catch (e) {
                // Invalid date format, no access
                return false;
            }
        }
    }

    // Case 3: No free access for other response codes (r=2,3,4) or invalid temporaryAccess
    // User needs to complete security requirements
    return false;
}


async function handleUserValidation(resData, response) {

    // ? 3362545: PLOS - Multiple Author Email Address in Access Code Authentication

    try {
        var canShowAuth = isPlosClient();
        var multiUser = shouldValidateMultiUser(resData);
        const {
            r,
            m
        } = response;

        if (r === 0 || r === 4) {
            return Invalid_Alertfn(
                r === 4 ? 'SECURITY_INVALID_IP' : 'Land_Page_Access_Denied',
                r === 4 ? {} : {
                    find: "%1%",
                    replace: m
                }
            );
        }

        if (multiUser) {
            var mailId = await validateUserEmail(resData);
            // ValidateUserSession(userEmail);
            let reCheck = document.getElementById('eMailValidate');
            if (mailId) {
                USER_INFO.MAIL_ID = mailId;
                // localStorage.setItem("xmleditor:username", mailId);
                closeExistingSession(mailId);
                if (canShowAuth) {

                } else {
                    saveLocalStorageData(resData);
                    VALIDATE_BTN.click();
                    return;
                }
            } else {
                reCheck.classList.remove('ds-none');
                VALIDATE_BTN.classList.add('d-none');
                return;
            }
        } else {
            saveLocalStorageData(resData);
        }

        if (resData.enable == "none") {
            showValidateButton(resData);
        } else if (resData.temporaryAccess && canUserAccessFreely(resData, response)) {
            showValidateButton(resData, true);
        } else if (canShowAuth) {
            return await handlePlosAuthentication(resData);
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('handleUserValidation', err.message);
    }
}

function isPlosClient() {
    return window.LANDING_CLIENT === 'plos';
}

async function handlePlosAuthentication(resData) {
    window.authFlow = new AuthenticationFlow(resData, {});
    const landingForm = document.getElementById('formLanding');
    authFlow.initializeAuthentication(landingForm).then(result => {
        if (result) {
            console.log('Authentication process initiated');
        } else {
            console.log('Authentication failed or OTP flow initiated');
        }
        if (IS_LOCAL_HOST) {
            // setTimeout(() => {}, 2500);
        }
    }).catch(error => {
        console.error('Authentication error:', error.message);
        return false;
    });
}

function finalizeUserPost(resData) {
    saveLocalStorageData(resData);
    updateDocViewHistory(resData);
}

function initializeGlobalVariables(resData) {
    RES_DATA = SHARED_KEY = resData;
    DOC_ID = resData.docid;
    DOC_DTD = resData.dtd;
    USER_INFO.MAIL_ID = resData.emailto || URL_PARAMETER.username;
    if (Array.isArray(resData.emailto)) {
        if (resData.emailto.length == 1) {
            USER_INFO.MAIL_ID = resData.emailto[0];
        } else { }
    }
    setOpenPagesSignal(DOC_ID);
}

function isLandPageLinkOpened(docId) {
    if (!docId) return false;
    var hasPageAvailableFlag = localStorage['page_available_' + docId] === "true";
    return hasPageAvailableFlag || (docId === oPage_DOCID && CHECK_OPAGE);
}

function waitForExistingPageSignal(docId, timeoutMs) {
    return new Promise(function (resolve) {
        var maxWait = timeoutMs || 700;
        var startedAt = Date.now();
        var checker = setInterval(function () {
            var found = isLandPageLinkOpened(docId);
            if (found || (Date.now() - startedAt) >= maxWait) {
                clearInterval(checker);
                resolve(found);
            }
        }, 80);
    });
}

function shouldValidateMultiUser(resData, isActive) {
    isActive = resData.status == "active";
    return Array.isArray(resData.emailto) && resData.emailto.length > 1 && isActive;
}

async function validateUserEmail(resData) {
    try {
        const result = await Swal.fire({
            title: 'Validate user',
            input: 'email',
            inputPlaceholder: 'Enter your email address',
            showCancelButton: true,
            allowOutsideClick: false,
            inputValidator: (value) => validateEmailInput(value, resData.emailto)
        });

        if (result.isDismissed || !result.value) {
            return null; // User cancelled or entered nothing
        }

        const userEmail = result.value;
        return userEmail;

    } catch (error) {
        console.error('Error in email validation:', error);
        return false;
    }
}


function validateEmailInput(value, emailto) {
    return new Promise((resolve) => {
        if (!value || !value.trim()) {
            resolve('Email address is required.'); // alert message
            return;
        }

        const lowercaseValue = value.toLowerCase();

        // Handle both array and single string cases, converting emailto to lowercase too
        const isValidEmail = Array.isArray(emailto)
            ? emailto.map(email => email.toLowerCase()).includes(lowercaseValue)
            : emailto.toLowerCase() === lowercaseValue;

        if (isValidEmail) {
            resolve(); // ✅ valid → no error
        } else {
            resolve('The provided email is not valid or has not been configured in the system.');
        }
    });
}



function updateUserInfo(resData) {
    if (!resData.emailto) {
        resData.emailto = USER_INFO.MAIL_ID;
    }
}

function updateUIWithDocumentInfo(resData) {
    if (resData.apikey || resData.docid) {
        const titleInfo = resData.titleinfo;
        const tempAuthor = titleInfo.authorgroup && titleInfo.authorgroup !== "null" ? titleInfo.authorgroup : '';
        const {
            articletitle,
            journaltitle
        } = resData.xmltohtmlres || {};
        const showDocTitle = {
            JATS: "Journal Title",
            BITS: "Book Title"
        };
        const showDocType = {
            JATS: "Article Title",
            BITS: "Chapter Title"
        };
        const doctitle = titleInfo.doctitle || articletitle || "";

        $('#title1').html(resData.projecttitle);

        $('#authorname').html(tempAuthor);
        $('#doi').html(titleInfo.identifier);
        $('#vmaintitle').html(showDocTitle[DOC_DTD]);

        if (resData.dtd == "JATS") {
            $('#headerlabel').html(showDocType[DOC_DTD]);
            $('#title2').html(doctitle);
        } else {
            $('#headerlabel,#title2').addClass("ds-none");
        }

        updateDynamicElements(resData, titleInfo);
    }
}

function updateDynamicElements(resData, titleInfo) {
    try {
        const helpDeskObj = GET_SENDER_RECEIVER_ID('HELP_DESK', resData.client);
        const dynamicObject = {
            "support_mail_id": {
                href: `mailto:${helpDeskObj.MAIL}?subject=${titleInfo.identifier}&body=Hi IMPACT,`
            },
            "video_tour": {
                href: `videotour.html?client=${resData.client}&role=${resData.role}&docid=${resData.docid}`
            },
            "UKUS": {
                text: {
                    "UK (LWW)": "optimise",
                    "US (LWW)": "optimize"
                }
            }
        };

        for (const [key, value] of Object.entries(dynamicObject)) {
            const element = document.getElementById(key);
            if (element && value.href) {
                element.setAttribute('href', value.href);
            } else if (element && value.text && resData.division) {
                element.textContent = value.text[resData.division] || value.text[resData.division.match(/UK/) ? "UK (LWW)" : "US (LWW)"];
            }
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('updateDynamicElements', err.message);
    }
}

function handleCoverImage(resData) {
    try {
        const titleInfo = resData.titleinfo;
        if (titleInfo.cover) {
            const xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        updateCoverImage(titleInfo, resData);
                    } else if (this.status == 404) {
                        showValidateButton(resData);
                    }
                }
            };
            xhttp.open('GET', GET_COVER_IMG_URL(titleInfo.cover, resData.client), true);
            xhttp.send();
        } else if (resData.dtd) {
            showValidateButton(resData);
        }

    } catch (err) {
        console.warn(err.message);
        // ErrorLogTrace('handleCoverImage', err.message);
    }
}

function updateCoverImage(titleInfo, resData) {
    try {
        const coverDiv = document.querySelector(".cover_div");
        if (!coverDiv) return;

        const coverUrl = GET_COVER_IMG_URL(titleInfo.cover, resData.client);

        const image = Object.assign(document.createElement("img"), {
            id: "image000",
            className: "card-img-left shadow",
            alt: "cover",
            src: coverUrl
        });

        coverDiv.classList.remove("ds-none");
        coverDiv.appendChild(image);

        showValidateButton(resData);
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace("updateCoverImage", err.message);
    }
}

function showValidateButton(resData, forceOpen = false) {
    try {
        if (!LINK_STATUS_ALRET.includes(resData.status) && (!localStorage['page_available_' + DOC_ID] || localStorage['page_available_' + DOC_ID] !== "true")) {
            if (resData.r == 1 || forceOpen) {
                VALIDATE_BTN.classList.remove('d-none', 'ds-none');
            }
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('showValidateButton', err.message);
    }
}

function handleLinkStatus(linkStatus, isExpired, resData) {
    try {
        if (linkStatus && LINK_STATUS_ALRET.includes(linkStatus)) {
            VALIDATE_BTN.classList.add('d-none');
            let redirectUrl = '';
            let _IsSignOff = false;

            if (linkStatus === LINK_STATUS_ALRET[0]) {
                _IsSignOff = true;
                if (RES_DATA.docid && RES_DATA.dtd) {
                    redirectUrl = DOMAIN_ROOT + PAGE_ReDIRECT[1] + RES_DATA.docid;
                }
            } else if (linkStatus === LINK_STATUS_ALRET[1]) {
                redirectUrl = DOMAIN_ROOT + "index.html";
            }

            let status = "SIGN_OFF";
            if (_IsSignOff && isExpired) {
                status = "FILE_DELETED";
            } else if (!_IsSignOff) {
                status = "EXPIRED";
            }
            const caseType = `Land_Page_${status}`;
            Invalid_Alertfn(caseType, {
                confirm: (_IsSignOff && !isExpired) ? "confirm_redirect" : false,
                redirect: redirectUrl
            });

            saveLocalStorageData(resData); // Setting localdata - TrackView not open 30_SEP_2024
            setItemsandReDirect(DOC_ID, NEW_SESSION_ID, window.location.href, redirectUrl, {
                redirect: false
            });
            return false;
        } else {
            closeExistingSession()
            return true;
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('handleLinkStatus', err.message);
    }
}
function closeExistingSession(email = null) {
    try {
        const jsonData = {
            tbl: "linksharing",
            docid: DOC_ID,
            find: {
                docid: DOC_ID,
                docstatus: "1"
            }
        };

        const isCollabEnabled = localStorage.getItem(`xmleditor:collabEnabled:${DOC_ID}`) === "true";

        if (email) {
            // ensure find exists
            jsonData.find.username = email;
            jsonData.find.role = SHARED_KEY.role;

            jsonData.username = email;
            jsonData.role = SHARED_KEY.role;
        } else if (isCollabEnabled) {
            return; // stop here, don't call ajax
        }
        commonfn.callajax(jsonData, "autoCloseCheckPoint", API_GET_DOCS);
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('closeExistingSession', err.message);
    }
}
function clearXmleditorStorage() {
    try {
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith("xmleditor")) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace("clearXmleditorStorage", err.message);
    }
}


function saveLocalStorageData(resData) {
    try {
        const { docid, apikey, emailto, role, sharedcolor, collaborative, status } = resData || {};

        if (!(apikey || (docid && emailto))) {
            console.log("API key missing.");
            Invalid_Alertfn(null, { url: apikey });
            return;
        }

        // clearXmleditorStorage();

        // Save common keys
        localStorage.setItem("xmleditor:appkey", "xmleditor");
        localStorage.setItem("xmleditor:apikey", apikey);
        localStorage.setItem(`xmleditor:shared:${docid}`, JSON.stringify(resData));

        // Determine email and collab state        
        const isCollab = resData && resData.client && typeof resData.client === "string" && resData.client.toLowerCase() === "oso" && typeof collaborative === "string" && collaborative.toLowerCase() === "yes";
        const emailId = (Array.isArray(emailto) && emailto.length > 1) ? USER_INFO.MAIL_ID : emailto;

        // Compute user color (index as color when collab is active)
        const isActive = isLinkActive(status);
        let finalUserColor = 0;
        if (isActive) {
            if (isCollab && Array.isArray(emailto)) {
                const index = emailto.indexOf(emailId);
                finalUserColor = index >= 0 ? index + 1 : 55; // fallback if not found
            } else {
                finalUserColor = sharedcolor || 99;
            }
        }
        // ? Map remaining values in one pass
        const mappings = {
            username: emailId,
            userRole: role || DEFAULT_ROLE,
            usercolor: finalUserColor,
            collabEnabled: isCollab ? "true" : "false"
        };

        for (const [key, value] of Object.entries(mappings)) {
            localStorage.setItem(`xmleditor:${key}:${docid}`, value);
        }
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace("saveLocalStorageData", err.message);
    }
}

function updateDocViewHistory(resData) {
    const jsondata = ADD_DEFAULT_KEYS("default");
    jsondata['tbl'] = 'docviewhistory';
    commonfn.callajaxwithoutjsontype(jsondata, 'docviewpost', API_UPDATE_INSERT, [resData.math, resData.docid, resData.editor]);
}
