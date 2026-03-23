# STEP 03 — LandingPage.js: LoadingUI Integration + isPlosPath Fix

> **Goal**: Make two surgical changes to `_vanilaProject/queue/LandingPage.js`:
> 1. Add a `LoadingUI` module and hook it into the existing flow (no restructuring needed)
> 2. Replace `isPlosPath()` (path-based detection) with `isPlosClient()` (config-based detection)
>
> **Key principle**: Minimum viable changes — the existing 1560-line flow is not restructured.
> We hook into existing call sites. Only ~40 lines change.

---

## 1. Change Summary

| Change | Lines affected | Risk |
|---|---|---|
| Add `LoadingUI` module (new code) | +35 lines at top of file | None |
| Hook `LoadingUI.show()` into `DOMContentLoaded` | Line ~327 (+1 line) | None |
| Hook `LoadingUI.progress(30)` before API call | Line ~376 (+1 line) | None |
| Hook `LoadingUI.progress(70)` at top of `validateuserpost` | Line ~515 (+1 line) | None |
| Hook `LoadingUI.success()` after doc info renders | Line ~529 (+1 line) | None |
| Hook `LoadingUI.error()` in ajax error handler | Line ~435 (+1 line) | None |
| Hook `LoadingUI.error()` in `Invalid_Alertfn` error paths | 2 call sites (+2 lines) | None |
| Replace `isPlosPath()` function body | Line ~1168 (1 line change) | Low |
| Replace `canShowAuth = isPlosPath()` call | Line ~1113 (1 word change) | Low |

---

## 2. Add the `LoadingUI` Module

**Insert at the very top of `LandingPage.js`** (before the `const GET_COVER_IMG_URL` line), or
as a self-contained block immediately before the `document.addEventListener('DOMContentLoaded'…)` call.

```js
// ─────────────────────────────────────────────────────────────────────────────
// LoadingUI — controls the #link-validating-overlay added in STEP-02 template
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
        // Do NOT auto-hide on error — let the SweetAlert take over
    }

    function hide() {
        _init();
        if (!overlay) return;
        overlay.classList.add('hide');
        setTimeout(function () { overlay.style.display = 'none'; }, 400);
    }

    return { show: show, progress: progress, success: success, error: error, hide: hide };
}());
```

---

## 3. Hook LoadingUI Into DOMContentLoaded

**File location**: `document.addEventListener('DOMContentLoaded', async function (event) {` (~line 323)

### 3a. Show overlay immediately on DOM ready

```js
// BEFORE (line 323–325):
document.addEventListener('DOMContentLoaded', async function (event) {
    try {
        console.log("Ready function");

// AFTER — add LoadingUI.show() as the very first line inside try:
document.addEventListener('DOMContentLoaded', async function (event) {
    try {
        LoadingUI.show();
        LoadingUI.progress(10, 'Initialising\u2026');
        console.log("Ready function");
```

### 3b. Update progress just before the API call (~line 376)

```js
// BEFORE (line 372–376):
        var jsondata = { "key": String(URL_PARAMETER.key) };
        var endPoint = API_URL_VALIDITY;
        var PostFun = 'validateuserpost';

        commonfn.callajaxwithoutjsontype(jsondata, PostFun, endPoint);

// AFTER:
        var jsondata = { "key": String(URL_PARAMETER.key) };
        var endPoint = API_URL_VALIDITY;
        var PostFun = 'validateuserpost';

        LoadingUI.progress(30, 'Validating link\u2026');
        commonfn.callajaxwithoutjsontype(jsondata, PostFun, endPoint);
```

### 3c. Show error when key is missing (~line 359–364)

```js
// BEFORE:
        if (!URL_PARAMETER.key) {
            console.log("key missing.");
            Invalid_Alertfn(null, { url: URL_PARAMETER.key });
            return false;

// AFTER:
        if (!URL_PARAMETER.key) {
            console.log("key missing.");
            LoadingUI.error('No access key found in this URL.');
            Invalid_Alertfn(null, { url: URL_PARAMETER.key });
            return false;
```

### 3d. Show error in DOMContentLoaded catch block (~line 386)

```js
// BEFORE:
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('addEventListener-DOMContentLoaded', err.message);

// AFTER:
    } catch (err) {
        console.warn(err.message);
        LoadingUI.error('An unexpected error occurred.');
        ErrorLogTrace('addEventListener-DOMContentLoaded', err.message);
```

---

## 4. Hook LoadingUI Into callajaxwithoutjsontype Error Handler

**File location**: `commonfn.callajaxwithoutjsontype` → `error:` callback (~line 433)

```js
// BEFORE:
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
            if (['validateuserpost'].includes(postfun)) {
                Invalid_Alertfn(null, { url: URL_PARAMETER.key });
                return false;

// AFTER:
        error: function (jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
            if (['validateuserpost'].includes(postfun)) {
                LoadingUI.error('Server connection failed. Please try again.');
                Invalid_Alertfn(null, { url: URL_PARAMETER.key });
                return false;
```

---

## 5. Hook LoadingUI Into commonfn.validateuserpost

**File location**: `commonfn.validateuserpost = async function (response) {` (~line 515)

### 5a. Advance progress when API response arrives

```js
// BEFORE (line 515–529):
commonfn.validateuserpost = async function (response) {
    try {
        console.log(JSON.stringify(response));

        const resData = response.data;
        resData['r'] = response.r;
        resData['enable'] = response.enable;

        initializeGlobalVariables(resData);

        updateUserInfo(resData);
        updateUIWithDocumentInfo(resData);
        handleCoverImage(resData);

// AFTER:
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
```

### 5b. Dismiss overlay when all validation passes and button shows

Find `await handleUserValidation(resData, response);` (~line 552) and wrap:

```js
// BEFORE:
        await handleUserValidation(resData, response);

// AFTER:
        await handleUserValidation(resData, response);
        LoadingUI.success();   // fade out overlay — content is ready
```

### 5c. Show error in validateuserpost catch (~line 554)

```js
// BEFORE:
    } catch (err) {
        console.warn(err.message);
        ErrorLogTrace('validateuserpost', err.message);

// AFTER:
    } catch (err) {
        console.warn(err.message);
        LoadingUI.error('Failed to process server response.');
        ErrorLogTrace('validateuserpost', err.message);
```

---

## 6. Fix isPlosPath() → isPlosClient()

Two changes required:

### 6a. Replace the function definition (~line 1167)

```js
// BEFORE:
function isPlosPath() {
    return window.location.pathname.includes("urlplos.html");
}

// AFTER:
function isPlosClient() {
    return window.LANDING_CLIENT === 'plos';
}
```

### 6b. Update the call site (~line 1113)

```js
// BEFORE:
        var canShowAuth = isPlosPath();

// AFTER:
        var canShowAuth = isPlosClient();
```

> **Why this works**: STEP-02 adds `<script>window.LANDING_CLIENT = '${{CLIENT.INSTRUCTIONS_TPL}}$';</script>`
> to the template. For PLOS deployments, `CLIENT.INSTRUCTIONS_TPL = 'plos'`, so
> `window.LANDING_CLIENT === 'plos'` will be `true`.

---

## 7. Complete Flow After Changes

```
DOMContentLoaded fires
  ├─ LoadingUI.show()                     [overlay visible, 0%]
  ├─ LoadingUI.progress(10, 'Initialising…')
  ├─ browser check passes
  ├─ URL key found
  ├─ LoadingUI.progress(30, 'Validating link…')
  └─ callajaxwithoutjsontype(key) → POST to API_URL_VALIDITY

    [network round-trip…]

    ├─ AJAX error → LoadingUI.error('Server connection failed')
    │                Invalid_Alertfn(null, …)
    │
    └─ AJAX success → commonfn.validateuserpost(response)
          ├─ LoadingUI.progress(70, 'Checking access…')
          ├─ initializeGlobalVariables / updateUI / handleCoverImage
          ├─ waitForExistingPageSignal (tab dedup)
          │     ├─ duplicate tab → Invalid_Alertfn('Land_Page_Link_Opened')
          │     │                  [overlay stays visible — modal covers page]
          │     └─ no duplicate → continue
          ├─ handleLinkStatus
          │     ├─ EXPIRED/SIGN_OFF/DEACTIVE → Invalid_Alertfn(…) → return
          │     └─ ACTIVE → continue
          ├─ handleUserValidation
          │     ├─ r=0 → LoadingUI.error(…) + Invalid_Alertfn('Land_Page_Access_Denied')
          │     ├─ r=4 → LoadingUI.error(…) + Invalid_Alertfn('SECURITY_INVALID_IP')
          │     ├─ multiUser → email chooser modal
          │     ├─ isPlosClient() → handlePlosAuthentication
          │     └─ showValidateButton → button visible
          └─ LoadingUI.success()                [overlay fades out — page revealed]
```

---

## 8. Overlay During Error States

When `Invalid_Alertfn` fires a SweetAlert, the overlay should **stay visible in error state**
(the SweetAlert sits on top of it). This happens naturally — `LoadingUI.error()` does **not**
auto-hide the overlay; the error overlay acts as a backdrop for the SweetAlert.

If you want the overlay to disappear when a SweetAlert OK button is clicked, add `LoadingUI.hide()`
in the SweetAlert callback — this is optional and can be done later if desired.

---

## 9. What Changes in `_vanilaProject/done/` After This Step

After finalizing `LandingPage.js` in `queue/`, copy it to `done/` for archival:

```
_vanilaProject/done/LandingPage.js   ← copy of queue version
```

The compiled/minified output (`assets/{VERSION}/js/landing.js`) must also be rebuilt from
the updated `LandingPage.js` source.

---

*End of STEP-03 — proceed with `STEP-04-browser-compat.md` when ready.*
