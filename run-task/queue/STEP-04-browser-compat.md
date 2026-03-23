# STEP 04 — Browser-Compatible: Wiring Documentation

> **Status: No code changes required.**
> The `browser-compatible/index.js` is already fully integrated with the unified
> `validateurl.html` template via the `${{browser_checker}}$` component.
> This document records exactly how the wiring works and what to watch for.

---

## 1. File

```
_vanilaProject/queue/browser-compatible/index.js   (source / queue)
assets/{VERSION}/modules/browser-compatible/index.js  (built output, served to browser)
```

---

## 2. Load Order in the Page

The `${{browser_checker}}$` placeholder in `validateurl.html` expands to
`src/snippets/component/browser_checker.html`:

```html
<script src="assets/${{VERSION}}$/vendor/vendor_smt.js?_${{TIMESTAMP}}$" defer></script>
<script src="assets/${{VERSION}}$/modules/browser-compatible/index.js?_${{TIMESTAMP}}$"></script>
```

This is placed in `<head>` **before** the `landing.js` `<script>` tag.

Load order on the page:
```
1. vendor_jbt.js           (jQuery + Bootstrap + SweetAlert)    ← synchronous
2. vendor_smt.js           (SweetAlert modal + utilities)       ← defer
3. browser-compatible/index.js                                   ← synchronous, runs immediately
4. landing.js              (LandingPage.js compiled output)     ← synchronous
```

`browser-compatible/index.js` runs before `landing.js` because it is loaded as a
synchronous `<script>` tag placed earlier in the document.

---

## 3. What browser-compatible/index.js Does

### 3a. Browser Detection

Sets `window.browserInfo` object with:

```js
{
  browser: 'Chrome' | 'Firefox' | 'Microsoft Edge' | 'Opera' | 'Safari' | 'Internet Explorer',
  version: '120.0.0',      // full version string
  majorVersion: 120,        // integer
  isChrome: true,           // per-browser flags
  isFirefox: false,
  isSafari: false,
  isEdge: false,
  isOpera: false,
  isBrave: false,
  isIE: false,
  isAllowed: true,          // browser is in the allowed list
  isCompatible: true,       // allowed AND version meets minimum
  os: 'Windows',
  osVersion: '10',
  screenSize: '1920 x 1080'
}
```

### 3b. Supported Browser Matrix

| Browser | Min version | Allowed |
|---|---|---|
| Chrome | 72 | ✅ |
| Firefox | 66 | ✅ |
| Microsoft Edge | 80 | ✅ |
| Opera | 98 | ✅ |
| Safari | 14 | ✅ |
| Internet Explorer | 11 only | ❌ (allowed: false) |
| Brave | any | ❌ (allowed: false) |

### 3c. Auto-Block on Incompatible Browser

If `!browserInfo.isAllowed` (IE, Brave): removes `#formLanding` from DOM + shows SweetAlert error.
If `!browserInfo.isCompatible` (old version): shows SweetAlert warning (form NOT removed).

Both cases leave `window.browserInfo.isCompatible = false`.

### 3d. Polyfills Included

```js
Promise.allSettled  (if missing — for older browsers)
Object.fromEntries  (if missing — for older browsers)
```

---

## 4. How LandingPage.js Consumes It

`LandingPage.js` (line ~323–347) guards its entire flow on `window.browserInfo.isCompatible`:

```js
document.addEventListener('DOMContentLoaded', async function (event) {
    // 1. If browserInfo not yet set, retry up to 5 × 100ms
    if (!window.browserInfo) { fireEvent_browser_validation(); }
    let retries = 5;
    while (!window.browserInfo && retries-- > 0) {
        await new Promise(r => setTimeout(r, 100));
    }

    // 2. Incompatible → show warning and stop
    if (!window.browserInfo.isCompatible) {
        Invalid_Alertfn('Land_Page_NOT_SUPPORT_BROW', {});
        return;
    }

    // 3. Compatible → proceed with key validation
    // …
});
```

The `fireEvent_browser_validation()` function (from `browser-compatible/index.js`) is
available as a global because the file loads before `landing.js`.

---

## 5. Interaction with the Loading Overlay (STEP-02 / STEP-03)

With the loading overlay added in STEP-02, the incompatible-browser path now looks like:

```
Page loads
  → #link-validating-overlay shown (overlay covers page)
  → browser-compatible/index.js runs — if incompatible, shows SweetAlert ON TOP of overlay
  → DOMContentLoaded in landing.js:
        LoadingUI.show()   ← overlay already showing (no-op, display already flex)
        browser check fails → Invalid_Alertfn('Land_Page_NOT_SUPPORT_BROW')
        returns early (no API call)
  → Overlay stays visible (error state backdrop) behind SweetAlert
```

This is the correct behaviour — the SweetAlert is visible, the overlay acts as a tinted backdrop.

**Optional improvement** (not required): If you want the overlay to show an explicit browser error
state before the SweetAlert appears, add `LoadingUI.error('Your browser is not supported.')` just
before `Invalid_Alertfn('Land_Page_NOT_SUPPORT_BROW')` in `LandingPage.js` (line ~342).

---

## 6. The `${{browser}}$` Footer Component

Separately, `${{browser}}$` in the page footer expands to `component/browser.html` — this shows
the current browser/OS info badge in the footer row. This is **display-only** and uses
`window.browserInfo` after it has been set. No changes needed here.

---

## 7. Deployment Note

When deploying updated `browser-compatible/index.js` from `queue/` to production:

1. Copy `_vanilaProject/queue/browser-compatible/index.js` to the build source
2. Run the asset build process to produce `assets/{VERSION}/modules/browser-compatible/index.js`
3. Increment `VERSION`/`TIMESTAMP` in `global.config` so browsers don't serve the cached old file

> The `?_${{TIMESTAMP}}$` query string on the `<script>` tag acts as a cache-bust.
> This is already handled by the existing `replacePlaceholders.js` system.

---

## 8. No Changes Required

`browser-compatible/index.js` requires **zero code changes** to work with:
- The unified `validateurl.html` template (STEP-02)
- The `LoadingUI` overlay (STEP-02/03)
- The `isPlosClient()` fix (STEP-03)

The file is production-ready as-is. Copy from `queue/` → `done/` and rebuild.

---

*End of STEP-04 — proceed with `STEP-05-authenticator.md` when ready.*
