# STEP 01 — Analysis: Combining ValidateUrl.jsx + validateurl.html

> **Goal**: Merge the UX patterns from `src/pages/ValidateUrl.jsx` (React) with the real
> production system (`src/snippets/validateurl.html` + `_vanilaProject/queue/LandingPage.js`)
> into a single coherent, browser-compatible vanilla-JS delivery in `_vanilaProject/queue/`.

---

## 1. The Two Parallel Systems

### 1a. `src/pages/ValidateUrl.jsx` — React Dev Stub

| Property | Value |
|---|---|
| Route | `/validateurl/:client` (React Router) |
| Entry param | `:client` route segment (e.g. `nihr`, `oup`) |
| Auth | None — calls `loadClientById(client)` (local config lookup) |
| Backend call | `clientLoader.js` — reads from `CLIENT_CONFIGS` map, **no real API** |
| State machine | `loading → success → error` with animated progress bar |
| Redirect | `navigate('/dashboard')` or `navigate('/editor')` based on `config.features` |
| Error UI | Two buttons: "Use Default Client" / "Go Home" |
| Status | ✅ Working stub — **disconnected from real backend** |

**Key UX pattern to preserve:**
```
state: loading  → blue spinner icon + progress bar 0%→90%→100%
state: success  → green checkmark icon + "Redirecting…"
state: error    → red X icon + error message + two action buttons
```

---

### 1b. `src/snippets/validateurl.html` + `LandingPage.js` — Real Production

| Property | Value |
|---|---|
| URL | `http://host/impactweb_live/ValidateUrl?key=<encrypted_token>` |
| Entry param | `?key=` — encrypted JWT-like access token (server-side signed) |
| Auth | Full: token decode → `validateuserpost` API → session setup |
| Backend calls | `API_URL_VALIDITY` (POST) → `API_LINK_SHARE` (POST) → `commonfn.checkaccess()` |
| State machine | DOM-driven via `Invalid_Alertfn()` + SweetAlert modals |
| Redirect | `setItemsandReDirect()` → editor or trackview URL |
| Error UI | 10 typed SweetAlert states (see §3 below) |
| Status | ✅ Real production code — **no loading/progress UX** |

---

## 2. File Inventory

### Production HTML Template

```
src/snippets/validateurl.html              ← unified ${{CLIENT.*}}$ template (✅ done)
src/snippets/component/doi_info.html       ← doc title / author / DOI / cover art panel
src/snippets/component/browser_checker.html← loads browser-compatible/index.js
src/snippets/component/browser.html        ← footer browser/OS badge
src/snippets/component/instructions/      ← 13 per-client instruction fragments
  default.html, nihr.html, oup.html, oso.html, oho.html,
  acs.html, lww.html, brill.html, plos.html, intellect.html,
  medknow.html, tnf.html, tnfjournals.html
```

### Queue Files (to be finalized)

```
_vanilaProject/queue/LandingPage.js           ← 1560-line production JS (needs loading UX)
_vanilaProject/queue/browser-compatible/index.js  ← browser detection + gate
_vanilaProject/queue/authenticator/index.js   ← AuthenticationFlow (reCAPTCHA + OTP)
```

### React Files (reference only — not to be shipped)

```
src/pages/ValidateUrl.jsx          ← UX pattern reference (progress/state machine)
src/utils/clientLoader.js          ← client config map (not used in production)
src/context/ClientContext.jsx      ← React context (not used in production)
```

---

## 3. LandingPage.js — Alert State Inventory

The `Invalid_Alertfn(type)` function handles these named states:

| State key | Meaning | UI action |
|---|---|---|
| `SIGN_OFF` | Proof already signed off | SweetAlert info → auto-close |
| `INVALID` | Token not found / malformed | SweetAlert error → close |
| `DEACTIVE` | Link deactivated by publisher | SweetAlert warning |
| `EXPIRY` | Link expired | SweetAlert warning |
| `IP_BLOCK` | Request from blocked IP | SweetAlert error |
| `FILE_DELETE` | Source file deleted | SweetAlert error |
| `MULTI_USER` | Multiple users on same link | Email-chooser modal |
| `REDIRECT` | Old-format URL auto-redirect | Transparent redirect |
| `AUTH` | PLOS auth required | `AuthenticationFlow` init |
| `OK` | Valid, active link | Show doc info + button |

---

## 4. The `browser-compatible/index.js` Integration

Already wired into the template via the `${{browser_checker}}$` component:

```html
<!-- browser_checker.html resolves to: -->
<script src="assets/${{VERSION}}$/vendor/vendor_smt.js?_${{TIMESTAMP}}$" defer></script>
<script src="assets/${{VERSION}}$/modules/browser-compatible/index.js?_${{TIMESTAMP}}$"></script>
```

`browser-compatible/index.js` sets `window.browserInfo` and **blocks execution** for
incompatible browsers (IE < 11, very old Safari, etc.) by showing an unsupported-browser
page before `landing.js` runs.

**No changes needed** — wiring is complete. Document only.

---

## 5. The `authenticator/index.js` Integration

Currently gated by a path check in `LandingPage.js`:

```js
// CURRENT (path-based — breaks with unified template)
function isPlosPath() {
  return window.location.pathname.includes("urlplos.html");
}
```

**Must change to**: config-based detection using `window.LANDING_CLIENT`:

```js
// TARGET
function isPlosClient() {
  return window.LANDING_CLIENT === 'plos';
}
```

`window.LANDING_CLIENT` is injected by `replacePlaceholders.js` via:
```html
<script>window.LANDING_CLIENT = '${{CLIENT.INSTRUCTIONS_TPL}}$';</script>
```

---

## 6. The Loading UX Gap — What Needs Adding

### Current Timeline (No Loading UX)

```
User opens URL
  → HTML renders (navbar + welcome text visible immediately)
  → landing.js DOMContentLoaded fires
  → POST to validateuserpost [silent, no indicator]
  → Response arrives (50ms–2s later)
  → UI updates or error modal appears
```

### Target Timeline (With Loading UX from ValidateUrl.jsx)

```
User opens URL
  → HTML renders
  → loading overlay shown immediately (spinner + "Validating your link...")
  → landing.js DOMContentLoaded fires
  → progress bar: 0% → 30% (start of POST)
  → POST to validateuserpost
  → progress bar: 30% → 90% (response received)
  → progress bar: 90% → 100% + overlay fades out
  → Doc info shown + button visible
  OR error state shown (red icon + message)
```

### Vanilla Implementation Plan

Add a `<div id="link-validating-overlay">` to `validateurl.html` containing:
- Spinner icon (CSS animation, no icon library needed)
- Progress bar (`<div class="progress-fill">` with JS `style.width`)
- Status text (`<span id="validation-status-text">`)

Add to `LandingPage.js`:
```js
const LoadingUI = {
  show()    { document.getElementById('link-validating-overlay').style.display = 'flex'; },
  hide()    { document.getElementById('link-validating-overlay').style.display = 'none'; },
  progress(pct) { document.querySelector('.progress-fill').style.width = pct + '%'; },
  text(msg) { document.getElementById('validation-status-text').textContent = msg; }
};
```

---

## 7. Gaps & Decisions Required

| # | Gap | Decision needed |
|---|---|---|
| 1 | `isPlosPath()` path-based detection | Replace with `window.LANDING_CLIENT === 'plos'` |
| 2 | No `window.LANDING_CLIENT` injected yet | Add `<script>window.LANDING_CLIENT='${{CLIENT.INSTRUCTIONS_TPL}}$'</script>` to `validateurl.html` |
| 3 | No loading overlay in HTML | Add `#link-validating-overlay` div to template |
| 4 | No `CLIENT:{}` block in any `env/env.*.js` | Add per deployment (see STEP-06) |
| 5 | `_vanilaProject/done/` sync | After each queue file is finalised, copy to `done/` |

---

## 8. Step-by-Step Sequence

| Step | File | What changes |
|---|---|---|
| **02** | `validateurl.html` | Add `window.LANDING_CLIENT` injection + loading overlay HTML/CSS |
| **03** | `LandingPage.js` | Add `LoadingUI` module, replace `isPlosPath()`, hook progress into flow |
| **04** | `browser-compatible/index.js` | Documentation only — no code changes needed |
| **05** | `authenticator/index.js` | Documentation of integration point — minimal wiring change |
| **06** | `CLIENT` config schema | Full config objects for all 12 clients ready to paste into `env/env.*.js` |

---

*End of STEP-01 — proceed with `STEP-02-html-template.md` when ready.*
