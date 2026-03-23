# STEP 05 — Authenticator: Integration with Unified Template

> **Goal**: Ensure `AuthenticationFlow` (reCAPTCHA v2/v3 + OTP) works correctly with the
> unified `validateurl.html` template after the STEP-02/03 changes.
>
> **Two small code changes required:**
> 1. Add the reCAPTCHA widget div (`${{reCaptcha_google}}$`) to `plos.html` instruction fragment
> 2. Add `CLIENT.AUTH_SCRIPT` placeholder to `validateurl.html` HEAD section
>
> **No changes to `authenticator/index.js` itself** — the class is production-ready.

---

## 1. AuthenticationFlow — How It Works

### File
```
_vanilaProject/queue/authenticator/index.js    (source)
assets/{VERSION}/modules/authenticator/index.js (built output)
```

### Constructor — Key Parameters

```js
new AuthenticationFlow(resData, Options)
```

| Parameter | Type | Value |
|---|---|---|
| `resData` | Object | The full `validateuserpost` API response (contains `.r`, `.emailto`, etc.) |
| `Options` | Object | Currently empty `{}` — reserved for future configuration |

### Flow Selection (from constructor)

```js
this.currentFlow = this.url_response.r == 2 ? 'otp' : 'ip';
```

| `response.r` | Flow | Meaning |
|---|---|---|
| `2` | `otp` | OTP via email — user receives a one-time code |
| any other | `ip` | IP-based auth — reCAPTCHA v3 token + server-side IP check |

### reCAPTCHA Site Key Selection

```js
this.config = {
    _isV2: false,
    _isV3: true,           // default: use reCAPTCHA Enterprise v3
    _v3: IS_LIVE_DOMAIN ? "6LdOV5Yq..."        // production key
       : IS_DEV_DOMAIN  ? "6LeiiLoq..."         // dev key
       :                   "6LdgzFAq..."         // local/staging key
};
```

The key is auto-selected from global constants `IS_LIVE_DOMAIN` / `IS_DEV_DOMAIN` defined in
`global.config`.

### API Endpoints Used

```js
this.endPoint_verify_captcha = API_PATH + "verifycaptcha";
this.endPoint_gen_otp        = API_PATH + "generatetokenotpandsendemail";
this.endPoint_verify_otp     = API_PATH + "verifyaccesscode";
```

`API_PATH` is a global constant defined in `global.config` — same config object that powers
the rest of `LandingPage.js`.

### DOM Elements Required

| Element | Purpose | Source |
|---|---|---|
| `#formLanding` | Root form passed to `initializeAuthentication()` | `form_button_group.html` component |
| `#generateOTPBtn` | "Generate OTP" button | `form_button_group.html` |
| `#ValidateBtnOpt` | "Agree & Continue" button | `form_button_group.html` |
| `#divCaptchaRe` | reCAPTCHA v2 widget container | `reCaptcha_google.html` component ← **PLOS only** |

---

## 2. The Problem: `#divCaptchaRe` Missing in Unified Template

In the old `validateurlplos.html`, the instructions section contained `<!--reCaptcha_google-->`
(commented out, but the div was added inline). The PLOS instruction fragment (`plos.html`)
currently does **not** include `${{reCaptcha_google}}$`.

### Current `plos.html` (missing reCAPTCHA div)

```html
<!-- ... 7 bullet points ... -->
${{disc_trans}}$
${{form_button_group}}$          ← #formLanding, #generateOTPBtn, #ValidateBtnOpt present
                                 ← #divCaptchaRe MISSING
```

### Required `plos.html` (with reCAPTCHA div)

```html
<!-- ... 7 bullet points ... -->
${{disc_trans}}$
${{reCaptcha_google}}$           ← adds <div class="g-recaptcha" id="divCaptchaRe">
${{form_button_group}}$
```

> **`reCaptcha_google.html`** resolves to:
> ```html
> <div class="g-recaptcha" id="divCaptchaRe" data-action="landing"></div>
> ```

---

## 3. Change 1 — Update `src/snippets/component/instructions/plos.html`

Add `${{reCaptcha_google}}$` between `${{disc_trans}}$` and `${{form_button_group}}$`:

```
BEFORE (last 2 lines of plos.html):
    ${{disc_trans}}$
    ${{form_button_group}}$

AFTER:
    ${{disc_trans}}$
    ${{reCaptcha_google}}$
    ${{form_button_group}}$
```

---

## 4. The Problem: `authenticator/index.js` Not Loaded in Unified Template

The old `validateurlplos.html` had a dedicated `<script>` tag for the authenticator.
The unified `validateurl.html` has no way to conditionally include it — unless we add
a `CLIENT.AUTH_SCRIPT` placeholder.

**Two options:**

### Option A (Recommended) — Always load the authenticator script

Since `authenticator/index.js` only declares the `AuthenticationFlow` class and does
nothing until `new AuthenticationFlow(...)` is called, loading it for all clients is
harmless. It adds ~53KB (pre-minification) but requires zero config changes.

**Add to `validateurl.html` HEAD (after `landing.js` script tag):**

```html
<!-- Authenticator (PLOS auth flow — no-op for other clients) -->
<script src="assets/${{VERSION}}$/modules/authenticator/index.js?_${{TIMESTAMP}}$"
        type="text/javascript"></script>
```

### Option B — Config-driven conditional load

Add `CLIENT.AUTH_SCRIPT` to `global.config.CLIENT`:

```js
// For PLOS:
CLIENT.AUTH_SCRIPT = '<script src="assets/v2.4.1/modules/authenticator/index.js?_1718200000$" type="text/javascript"><\/script>'

// For all other clients:
CLIENT.AUTH_SCRIPT = ''
```

Add to `validateurl.html` HEAD:
```html
${{CLIENT.AUTH_SCRIPT}}$
```

**Option A is recommended** — simpler, avoids per-client config entry for a small file.

---

## 5. Change 2 — Update `validateurl.html` HEAD Section

Following Option A, add after the `landing.js` script tag in `validateurl.html`:

```html
<!-- Page Script -->
<script src="assets/${{VERSION}}$/js/landing.js?_${{TIMESTAMP}}$" type="text/javascript"></script>

<!-- Authenticator (PLOS auth flow — class declaration only, harmless for non-PLOS) -->
<script src="assets/${{VERSION}}$/modules/authenticator/index.js?_${{TIMESTAMP}}$"
        type="text/javascript"></script>
```

---

## 6. Complete Interaction: PLOS Auth Flow After Changes

```
Page loads (PLOS deployment):
  window.LANDING_CLIENT = 'plos'          ← injected by STEP-02
  authenticator/index.js loaded           ← class AuthenticationFlow declared
  browser-compatible/index.js runs        ← window.browserInfo set

DOMContentLoaded:
  LoadingUI.show()
  key parsed → callajaxwithoutjsontype(key) → POST to API_URL_VALIDITY

  Response arrives → commonfn.validateuserpost(response):
    resData.r = 2  (OTP flow) or 3 (IP flow)
    handleUserValidation(resData, response):
      canShowAuth = isPlosClient()           ← returns TRUE (window.LANDING_CLIENT === 'plos')
      multiUser check → email chooser (if needed)
      canShowAuth = true → handlePlosAuthentication(resData)
        window.authFlow = new AuthenticationFlow(resData, {})
        authFlow.initializeAuthentication(#formLanding)
          currentFlow = resData.r == 2 ? 'otp' : 'ip'
          if 'ip':  loads reCAPTCHA Enterprise v3 script dynamically
                    executes token → POST to verifycaptcha → on success shows button
          if 'otp': shows #generateOTPBtn
                    user clicks → POST to generatetokenotpandsendemail
                    OTP modal appears → user enters code
                    POST to verifyaccesscode → on success → setItemsandReDirect()

  LoadingUI.success()                      ← overlay fades after button appears
```

---

## 7. For Non-PLOS Clients

```
isPlosClient() returns FALSE
handlePlosAuthentication() is NEVER called
AuthenticationFlow class is declared but NEVER instantiated
#divCaptchaRe does NOT exist in DOM (not in non-PLOS instruction fragments)
→ Zero impact
```

---

## 8. Summary of All Changes for This Step

| File | Change | Type |
|---|---|---|
| `src/snippets/component/instructions/plos.html` | Add `${{reCaptcha_google}}$` between disc_trans and form_button_group | +1 line |
| `src/snippets/validateurl.html` | Add `authenticator/index.js` script tag after `landing.js` tag | +2 lines |

---

## 9. After This Step — What's in `_vanilaProject/done/`

```
done/authenticator/index.js     ← copy of queue version (no changes made)
```

---

*End of STEP-05 — proceed with `STEP-06-client-config.md` when ready.*
