# STEP 02 — HTML Template: Adding Loading Overlay to validateurl.html

> **Goal**: Extend the unified `src/snippets/validateurl.html` with:
> 1. A `window.LANDING_CLIENT` injection (fixes `isPlosPath()` detection)
> 2. A loading overlay (spinner + progress bar + status text — ported from `ValidateUrl.jsx`)
>
> The loading overlay is pure HTML + inline CSS + controlled by `LandingPage.js` (see STEP-03).
> No new dependencies.

---

## 1. What Changes and Why

| Change | Reason |
|---|---|
| `window.LANDING_CLIENT = '${{CLIENT.INSTRUCTIONS_TPL}}$'` | Replaces path-based `isPlosPath()` — see STEP-01 §5 |
| `#link-validating-overlay` div | Visual feedback during `validateuserpost` API call — mirrors React progress card |
| Three state classes: `.state-loading`, `.state-success`, `.state-error` | Toggled by `LoadingUI` in LandingPage.js |
| Existing `.container-fluid` body hidden initially | Prevents flash of unstyled content before API responds |

---

## 2. The Loading Overlay — Visual Design

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              ┌───────────────────────┐                  │
│              │   [●  spinner icon]   │   ← blue/green/red │
│              │                       │                  │
│              │  Validating your      │                  │
│              │  proof link...        │                  │
│              │                       │                  │
│              │  ████████░░░░░  70%   │   ← progress bar │
│              │  Checking access...   │   ← status text  │
│              └───────────────────────┘                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Three visual states map directly from `ValidateUrl.jsx`:

| State | Icon color | Heading | When |
|---|---|---|---|
| `loading` | Blue `#2563eb` | "Validating your proof link…" | Initial → during API call |
| `success` | Green `#059669` | "Link validated!" | API returns OK, before fade-out |
| `error` | Red `#dc2626` | "Unable to open link" | API returns error state |

---

## 3. Complete Updated `validateurl.html`

Apply this complete replacement to `src/snippets/validateurl.html`:

```html
<!doctype html>
<html lang="en" translate="no">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="google" content="notranslate">
    <title>${{CLIENT.PAGE_TITLE}}$</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="${{CLIENT.FAVICON}}$" rel="icon">
    ${{CLIENT.DOI_HIDE_STYLE}}$
    <!-- custom and library css -->
    <link rel="stylesheet" href="assets/${{VERSION}}$/vendor/vendor_jbt.css?_${{TIMESTAMP}}$">
    <link rel="stylesheet" href="assets/${{VERSION}}$/css/landing.css?_${{TIMESTAMP}}$">
    <!-- Combine version of third party -->
    <script src="assets/${{VERSION}}$/vendor/vendor_jbt.js?_${{TIMESTAMP}}$"></script>
    <script src="assets/${{VERSION}}$/vendor/vendor_smt.js?_${{TIMESTAMP}}$"></script>

    ${{browser_checker}}$

    <!-- Client identity for JS feature detection (replaces isPlosPath()) -->
    <script>window.LANDING_CLIENT = '${{CLIENT.INSTRUCTIONS_TPL}}$';</script>

    <!-- Page Script -->
    <script src="assets/${{VERSION}}$/js/landing.js?_${{TIMESTAMP}}$" type="text/javascript"></script>

    <!-- Loading overlay styles (self-contained, no extra file) -->
    <style>
        #link-validating-overlay {
            position: fixed;
            inset: 0;
            background: rgba(248, 250, 252, 0.97);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            transition: opacity 0.35s ease;
        }
        #link-validating-overlay.hide {
            opacity: 0;
            pointer-events: none;
        }
        .lvo-card {
            background: #fff;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.12);
            padding: 2.5rem 2rem;
            width: 100%;
            max-width: 420px;
            text-align: center;
        }
        .lvo-icon-wrap {
            width: 64px;
            height: 64px;
            border-radius: 14px;
            margin: 0 auto 1.25rem;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #2563eb;
            transition: background 0.3s ease;
        }
        .lvo-icon-wrap.state-success { background: #059669; }
        .lvo-icon-wrap.state-error   { background: #dc2626; }
        /* CSS-only spinner */
        .lvo-spinner {
            width: 32px; height: 32px;
            border: 3px solid rgba(255,255,255,0.4);
            border-top-color: #fff;
            border-radius: 50%;
            animation: lvo-spin 0.75s linear infinite;
        }
        .lvo-spinner.hidden { display: none; }
        @keyframes lvo-spin { to { transform: rotate(360deg); } }
        /* checkmark / x icons (CSS only) */
        .lvo-check, .lvo-xmark {
            display: none;
            color: #fff;
            font-size: 1.75rem;
            font-weight: 700;
            line-height: 1;
        }
        .lvo-check.visible, .lvo-xmark.visible { display: block; }
        .lvo-heading {
            font-size: 1.35rem;
            font-weight: 700;
            color: #111827;
            margin-bottom: 0.5rem;
        }
        .lvo-subtitle {
            font-size: 0.925rem;
            color: #6b7280;
            margin-bottom: 1.5rem;
        }
        .lvo-progress-track {
            height: 8px;
            background: #e5e7eb;
            border-radius: 99px;
            overflow: hidden;
            margin-bottom: 0.5rem;
        }
        .lvo-progress-fill {
            height: 100%;
            background: #2563eb;
            border-radius: 99px;
            width: 0%;
            transition: width 0.3s ease, background 0.3s ease;
        }
        .lvo-progress-fill.state-success { background: #059669; }
        .lvo-progress-fill.state-error   { background: #dc2626; }
        .lvo-progress-row {
            display: flex;
            justify-content: space-between;
            font-size: 0.8rem;
            color: #9ca3af;
            margin-bottom: 1rem;
        }
    </style>
</head>

<body>

    <!-- ═══════════════════════════════════════════════════════
         LOADING OVERLAY  (controlled by LoadingUI in landing.js)
         Visible on page load, hidden once API responds.
    ═══════════════════════════════════════════════════════ -->
    <div id="link-validating-overlay">
        <div class="lvo-card">
            <div class="lvo-icon-wrap" id="lvo-icon-wrap">
                <div class="lvo-spinner" id="lvo-spinner"></div>
                <span class="lvo-check" id="lvo-check">&#10003;</span>
                <span class="lvo-xmark" id="lvo-xmark">&#10007;</span>
            </div>
            <div class="lvo-heading" id="lvo-heading">Validating your proof link&hellip;</div>
            <div class="lvo-subtitle" id="lvo-subtitle">Please wait while we check your access.</div>
            <div class="lvo-progress-track">
                <div class="lvo-progress-fill" id="lvo-progress-fill"></div>
            </div>
            <div class="lvo-progress-row">
                <span id="lvo-status-text">Connecting&hellip;</span>
                <span id="lvo-pct">0%</span>
            </div>
        </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════
         MAIN PAGE CONTENT  (hidden until overlay dismisses)
    ═══════════════════════════════════════════════════════ -->
    <nav class="navbar navbar-expand-lg ${{CLIENT.NAVBAR_CSS}}$">
        <div class="container-fluid">
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#navbarTogglerDemo03" aria-controls="navbarTogglerDemo03"
                aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <a class="navbar-brand" href="${{CLIENT.LOGO_HREF}}$" ${{CLIENT.LOGO_LINK_ATTRS}}$>
                <img src="${{CLIENT.LOGO_SRC}}$" height="${{CLIENT.LOGO_HEIGHT}}$"
                     width="${{CLIENT.LOGO_WIDTH}}$" alt="${{CLIENT.LOGO_ALT}}$">
            </a>
            <div class="collapse navbar-collapse justify-content-end" id="navbarTogglerDemo03">
                <ul class="navbar-nav mb-2 mb-lg-0">
                    <li class="nav-item mr-4" id="FAQ_UI" title="Click to download the FAQs">
                        <a class="nav-link ${{CLIENT.NAV_LINK_CSS}}$"
                           href="javascript:iDownloadMethod.click('Help_FAQ_pdf', 'landing')">
                            <img class="menu-icon mr-1"
                                 src="UI/svg/landing/FAQ_${{CLIENT.NAV_ICON_VARIANT}}$.svg"
                                 height="${{CLIENT.NAV_ICON_SIZE}}$" width="${{CLIENT.NAV_ICON_SIZE}}$"
                                 alt="FAQ Icon">FAQs</a>
                    </li>
                    <li class="nav-item" id="User_Guide_UI" title="Click to download the User Guide">
                        <a class="nav-link ${{CLIENT.NAV_LINK_CSS}}$" aria-current="page"
                           href="javascript:iDownloadMethod.click('Help_Guide_pdf', 'landing')">
                            <img class="menu-icon mr-1"
                                 src="UI/svg/landing/UserGuide_${{CLIENT.NAV_ICON_VARIANT}}$.svg"
                                 height="${{CLIENT.NAV_ICON_SIZE}}$" width="${{CLIENT.NAV_ICON_SIZE}}$"
                                 alt="User Guide Icon">User Guide</a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <div class="container-fluid${{CLIENT.CONTAINER_EXTRA_CSS}}$">
        <div class="row">
            <div class="col-12 col-sm-12 col-md-12 col-lg-12 p-5 blue-text">
                <h3 class="px-4 mx-4 fw-600">${{CLIENT.WELCOME_TEXT}}$</h3>
            </div>
        </div>
        <div class="row">
            <div class="col-sm-12 col-md-6 col-lg-6 bg-light-blue">
                <div class="card bg-light-blue pad-2rem">
                    <div class="card-body">
                        ${{client_instructions}}$
                    </div>
                </div>
            </div>
            <div class="col-sm-12 col-md-6 col-lg-6">
                ${{doi_info}}$
            </div>
        </div>
        <div class="row p-3 text-light bg-blue">
            <footer class="container mw-100">
                <div class="row">
                    <div class="col-6 col-sm-6 col-md-6 col-lg-6">
                        ${{CLIENT.FOOTER_LOGO_HTML}}$
                    </div>
                    ${{browser}}$
                </div>
            </footer>
        </div>
    </div>

    <div id="ModelDialogAppend"></div>
</body>

</html>
```

---

## 4. Placeholder Reference Table

All `${{...}}$` tokens in the template, their source, and example values:

| Placeholder | Source | Example value |
|---|---|---|
| `${{CLIENT.PAGE_TITLE}}$` | `global.config.CLIENT.PAGE_TITLE` | `"IMPACT - Landing Page"` |
| `${{CLIENT.FAVICON}}$` | `global.config.CLIENT.FAVICON` | `"UI/client_logo/NIHR_FAVICON.svg"` |
| `${{CLIENT.DOI_HIDE_STYLE}}$` | `global.config.CLIENT.DOI_HIDE_STYLE` | `""` or `<style>[id="doi"]{display:none}</style>` |
| `${{VERSION}}$` | `global.config.VERSION` | `"v2.4.1"` |
| `${{TIMESTAMP}}$` | `global.config.TIMESTAMP` | `"1718200000"` |
| `${{CLIENT.INSTRUCTIONS_TPL}}$` | `global.config.CLIENT.INSTRUCTIONS_TPL` | `"nihr"`, `"oup"`, `"plos"`, … |
| `${{CLIENT.NAVBAR_CSS}}$` | `global.config.CLIENT.NAVBAR_CSS` | `"bt-border-color"` or `"fixed-top navbar-dark bg-blue"` |
| `${{CLIENT.LOGO_HREF}}$` | `global.config.CLIENT.LOGO_HREF` | `"https://www.nihr.ac.uk/"` |
| `${{CLIENT.LOGO_LINK_ATTRS}}$` | `global.config.CLIENT.LOGO_LINK_ATTRS` | `'target="_blank" rel="noopener"'` |
| `${{CLIENT.LOGO_SRC}}$` | `global.config.CLIENT.LOGO_SRC` | `"UI/client_logo/NIHR.svg"` |
| `${{CLIENT.LOGO_HEIGHT}}$` | `global.config.CLIENT.LOGO_HEIGHT` | `"30"` |
| `${{CLIENT.LOGO_WIDTH}}$` | `global.config.CLIENT.LOGO_WIDTH` | `""` or `"120"` |
| `${{CLIENT.LOGO_ALT}}$` | `global.config.CLIENT.LOGO_ALT` | `"NIHR logo"` |
| `${{CLIENT.NAV_LINK_CSS}}$` | `global.config.CLIENT.NAV_LINK_CSS` | `""` or `"text-light"` |
| `${{CLIENT.NAV_ICON_VARIANT}}$` | `global.config.CLIENT.NAV_ICON_VARIANT` | `"dark"` or `"white"` |
| `${{CLIENT.NAV_ICON_SIZE}}$` | `global.config.CLIENT.NAV_ICON_SIZE` | `"18"` or `"24"` |
| `${{CLIENT.CONTAINER_EXTRA_CSS}}$` | `global.config.CLIENT.CONTAINER_EXTRA_CSS` | `""` or `" mt-5"` |
| `${{CLIENT.WELCOME_TEXT}}$` | `global.config.CLIENT.WELCOME_TEXT` | `"Welcome to <span class=\"impact-title\">IMPACT</span>…"` |
| `${{client_instructions}}$` | `replacePlaceholders.js` → `component/instructions/${{CLIENT.INSTRUCTIONS_TPL}}$.html` | Full card-body HTML |
| `${{doi_info}}$` | `component/doi_info.html` | Book/article metadata panel |
| `${{CLIENT.FOOTER_LOGO_HTML}}$` | `global.config.CLIENT.FOOTER_LOGO_HTML` | `""` or `<a href="..."><img …></a>` |
| `${{browser}}$` | `component/browser.html` | Footer browser/OS badge |
| `${{browser_checker}}$` | `component/browser_checker.html` | `<script>` tags for browser compat + vendor_smt |

---

## 5. How to Apply This Change

1. Open `src/snippets/validateurl.html`
2. Replace the entire file content with the template in §3 above
3. (Optional) Also update `_vanilaProject/done/` if you keep it in sync with `src/snippets/`

> **No changes to `replacePlaceholders.js` are needed for this step** — the new
> `${{CLIENT.INSTRUCTIONS_TPL}}$` placeholder inside `<script>` is resolved by the
> existing dot-notation property lookup already in place.

---

## 6. LoadingUI API (consumed by STEP-03 LandingPage.js)

The loading overlay exposes these element IDs for JS control:

| Element ID | Purpose |
|---|---|
| `link-validating-overlay` | Root element — add class `hide` to fade out |
| `lvo-icon-wrap` | Add class `state-success` or `state-error` to change colour |
| `lvo-spinner` | CSS spinner — add class `hidden` when state transitions |
| `lvo-check` | Checkmark `✓` — add class `visible` on success |
| `lvo-xmark` | X mark `✗` — add class `visible` on error |
| `lvo-heading` | Main heading text |
| `lvo-subtitle` | Secondary status line |
| `lvo-progress-fill` | Progress bar — set `style.width` to `"0%"` … `"100%"` |
| `lvo-status-text` | Small status label (left side of progress row) |
| `lvo-pct` | Percentage label (right side of progress row) |

The `LoadingUI` module implementation is in **STEP-03**.

---

*End of STEP-02 — proceed with `STEP-03-landing-js.md` when ready.*
