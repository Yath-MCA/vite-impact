# STEP 06 — CLIENT Config Schema: All 12 Clients

> **Goal**: Provide the complete `CLIENT: { ... }` configuration block to add to each client's
> deployment environment file (`global.config` or `env/env.*.js`).
>
> Add the `CLIENT` object to the top-level config exported from the relevant env file.
> `replacePlaceholders.js` reads each `CLIENT.*` property via dot-notation when it encounters
> a `${{CLIENT.PROPERTY_NAME}}$` token in a template.

---

## 1. How to Add CLIENT Config to an Env File

Open the relevant `env/env.*.js` and add the `CLIENT` block as a top-level property:

```js
export default {
  APP_KEY: '...',
  API_KEY: '...',
  // ... existing properties ...

  CLIENT: {
    INSTRUCTIONS_TPL:     'nihr',          // ← selects instruction fragment
    PAGE_TITLE:           'IMPACT - Landing Page',
    FAVICON:              'UI/client_logo/NIHR_FAVICON.svg',
    DOI_HIDE_STYLE:       '<style>[id="doi"]{display:none}</style>',
    NAVBAR_CSS:           'bt-border-color',
    LOGO_HREF:            'https://www.nihr.ac.uk/',
    LOGO_LINK_ATTRS:      'target="_blank" rel="noopener"',
    LOGO_SRC:             'UI/client_logo/NIHR.svg',
    LOGO_HEIGHT:          '30',
    LOGO_WIDTH:           '',
    LOGO_ALT:             'NIHR logo',
    NAV_LINK_CSS:         '',
    NAV_ICON_VARIANT:     'dark',
    NAV_ICON_SIZE:        '18',
    CONTAINER_EXTRA_CSS:  '',
    WELCOME_TEXT:         'Welcome to<span class="impact-title">IMPACT</span>, the online proofing tool for collaborating on proofing journal content for National Institute for Health and Care Research.',
    FOOTER_LOGO_HTML:     ''
  }
};
```

---

## 2. Property Reference

| Property | Type | Purpose |
|---|---|---|
| `INSTRUCTIONS_TPL` | string | Selects `component/instructions/{value}.html` fragment |
| `PAGE_TITLE` | string | Browser tab `<title>` |
| `FAVICON` | string | Path to favicon file (relative to deployment root) |
| `DOI_HIDE_STYLE` | string | `<style>` block to hide DOI field, or `''` to show it |
| `NAVBAR_CSS` | string | CSS classes applied to `<nav class="navbar navbar-expand-lg ___">` |
| `LOGO_HREF` | string | Navbar brand link URL (or `'#'` for no external link) |
| `LOGO_LINK_ATTRS` | string | Extra attrs on navbar brand `<a>` (e.g. `target="_blank" rel="noopener"`) |
| `LOGO_SRC` | string | Navbar logo `<img src>` |
| `LOGO_HEIGHT` | string | Navbar logo `height` attribute (in px, no unit) |
| `LOGO_WIDTH` | string | Navbar logo `width` attribute (in px, no unit, or `''`) |
| `LOGO_ALT` | string | Navbar logo `alt` text |
| `NAV_LINK_CSS` | string | CSS class on nav link `<a>` elements (`''` or `'text-light'`) |
| `NAV_ICON_VARIANT` | string | Icon set: `'dark'` (for light navbars) or `'white'` (for dark navbars) |
| `NAV_ICON_SIZE` | string | Size for FAQ/UserGuide icons in px |
| `CONTAINER_EXTRA_CSS` | string | Extra CSS appended to `.container-fluid` (`''` or `' mt-5'` for fixed-top navbars) |
| `WELCOME_TEXT` | string | Full HTML for the `<h3>` welcome heading |
| `FOOTER_LOGO_HTML` | string | Footer client logo HTML, or `''` |

---

## 3. Quick Reference — Navbar Variants

| `NAVBAR_CSS` value | `NAV_ICON_VARIANT` | `NAV_LINK_CSS` | `CONTAINER_EXTRA_CSS` | Clients |
|---|---|---|---|---|
| `bt-border-color` | `dark` | `''` | `''` | nihr, acs, lww, brill, tnf, tnfjournals |
| `navbar-dark bg-blue` | `white` | `text-light` | `''` | plos, intellect |
| `fixed-top navbar-dark bg-blue` | `white` | `text-light` | `' mt-5'` | oup, oso, oho, medknow |

---

## 4. All 12 Client Configs

---

### 4.1 NIHR (`nihr`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'nihr',
  PAGE_TITLE:           'IMPACT - NIHR Proofing Portal',
  FAVICON:              'UI/client_logo/NIHR_FAVICON.svg',
  DOI_HIDE_STYLE:       '<style>[id="doi"]{display:none}</style>',
  NAVBAR_CSS:           'bt-border-color',
  LOGO_HREF:            'https://www.nihr.ac.uk/',
  LOGO_LINK_ATTRS:      'target="_blank" rel="noopener"',
  LOGO_SRC:             'UI/client_logo/NIHR.svg',
  LOGO_HEIGHT:          '30',
  LOGO_WIDTH:           '',
  LOGO_ALT:             'NIHR logo',
  NAV_LINK_CSS:         '',
  NAV_ICON_VARIANT:     'dark',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  '',
  WELCOME_TEXT:         'Welcome to<span class="impact-title">IMPACT</span>, the online proofing tool for collaborating on proofing journal content for National Institute for Health and Care Research.',
  FOOTER_LOGO_HTML:     ''
}
```

---

### 4.2 OUP Journals (`oup`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'oup',
  PAGE_TITLE:           'IMPACT - Oxford University Press Journals',
  FAVICON:              'UI/client_logo/OUP_FAVICON.svg',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'fixed-top navbar-dark bg-blue',
  LOGO_HREF:            'https://global.oup.com',
  LOGO_LINK_ATTRS:      'rel="noopener" target="_blank"',
  LOGO_SRC:             'UI/client_logo/OUP_WHITE.svg',
  LOGO_HEIGHT:          '30',
  LOGO_WIDTH:           '150',
  LOGO_ALT:             'OUP Logo',
  NAV_LINK_CSS:         'text-light',
  NAV_ICON_VARIANT:     'white',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  ' mt-5',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span>, the online proofing tool that permits authors to directly edit and collaborate on journal content for Oxford University Press.',
  FOOTER_LOGO_HTML:     '<a class="navbar-brand" href="https://global.oup.com" rel="noopener" target="_blank"><img alt="OUP Logo" src="UI/client_logo/OUP_WHITE.svg" height="50" /></a>'
}
```

---

### 4.3 Oxford Scholarship Online — Books (`oso`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'oso',
  PAGE_TITLE:           'IMPACT - Oxford Scholarship Online',
  FAVICON:              'UI/client_logo/OUP_FAVICON.svg',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'fixed-top navbar-dark bg-blue',
  LOGO_HREF:            'https://global.oup.com',
  LOGO_LINK_ATTRS:      'rel="noopener" target="_blank"',
  LOGO_SRC:             'UI/client_logo/OUP_WHITE.svg',
  LOGO_HEIGHT:          '30',
  LOGO_WIDTH:           '150',
  LOGO_ALT:             'logo',
  NAV_LINK_CSS:         'text-light',
  NAV_ICON_VARIANT:     'white',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  ' mt-5',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span>, the online proofing tool that permits authors to directly edit and collaborate on book content for Oxford University Press.',
  FOOTER_LOGO_HTML:     '<a class="navbar-brand" href="https://global.oup.com" rel="noopener" target="_blank"><img alt="logo" src="UI/client_logo/OUP_WHITE.svg" height="50" /></a>'
}
```

---

### 4.4 Oxford Handbooks Online — Books (`oho`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'oho',
  PAGE_TITLE:           'IMPACT - Oxford Handbooks Online',
  FAVICON:              'UI/client_logo/OUP_FAVICON.svg',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'fixed-top navbar-dark bg-blue',
  LOGO_HREF:            'https://global.oup.com',
  LOGO_LINK_ATTRS:      'rel="noopener" target="_blank"',
  LOGO_SRC:             'UI/client_logo/OUP_WHITE.svg',
  LOGO_HEIGHT:          '30',
  LOGO_WIDTH:           '150',
  LOGO_ALT:             'OHO logo',
  NAV_LINK_CSS:         'text-light',
  NAV_ICON_VARIANT:     'white',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  ' mt-5',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span>, the online proofing tool that permits authors to directly edit and collaborate on book content for Oxford University Press.',
  FOOTER_LOGO_HTML:     '<a class="navbar-brand" href="https://global.oup.com" rel="noopener" target="_blank"><img alt="OHO Logo" src="UI/client_logo/OUP_WHITE.svg" height="50" /></a>'
}
```

---

### 4.5 American Chemical Society (`acs`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'acs',
  PAGE_TITLE:           'IMPACT - American Chemical Society',
  FAVICON:              'UI/client_logo/ACS_FAVICON.ico',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'bt-border-color',
  LOGO_HREF:            'https://www.acs.org/about.html',
  LOGO_LINK_ATTRS:      '',
  LOGO_SRC:             'UI/client_logo/ACS_WHITE.svg',
  LOGO_HEIGHT:          '60',
  LOGO_WIDTH:           '186',
  LOGO_ALT:             'Logo',
  NAV_LINK_CSS:         '',
  NAV_ICON_VARIANT:     'dark',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  '',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span>, the online proofing tool that permits authors to directly edit and collaborate on journal content for American Chemical Society.',
  FOOTER_LOGO_HTML:     ''
}
```

> **Note**: ACS instruction fragment (`acs.html`) contains inline buttons and does NOT use
> `${{form_button_group}}$`. The `CLIENT.INSTRUCTIONS_TPL = 'acs'` fragment handles this.

---

### 4.6 Lippincott Williams & Wilkins (`lww`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'lww',
  PAGE_TITLE:           'IMPACT - LWW Proofing Portal',
  FAVICON:              'UI/client_logo/LWW_FAVICON.svg',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'bt-border-color',
  LOGO_HREF:            'https://journals.lww.com/',
  LOGO_LINK_ATTRS:      'target="_blank" rel="noopener"',
  LOGO_SRC:             'UI/client_logo/LWW.svg',
  LOGO_HEIGHT:          '',
  LOGO_WIDTH:           '',
  LOGO_ALT:             'LWW logo',
  NAV_LINK_CSS:         '',
  NAV_ICON_VARIANT:     'dark',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  '',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span>, the online proofing tool for collaborating on proofing journal content for Lippincott Williams &amp; Wilkins.',
  FOOTER_LOGO_HTML:     ''
}
```

---

### 4.7 Brill Publishers (`brill`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'brill',
  PAGE_TITLE:           'IMPACT - Brill Proofing Portal',
  FAVICON:              'UI/client_logo/BRILL_FAVICON.png',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'bt-border-color',
  LOGO_HREF:            'https://brill.com/',
  LOGO_LINK_ATTRS:      'target="_blank"',
  LOGO_SRC:             'UI/client_logo/BRILL.svg',
  LOGO_HEIGHT:          '60',
  LOGO_WIDTH:           '100',
  LOGO_ALT:             'IMPACT Logo',
  NAV_LINK_CSS:         '',
  NAV_ICON_VARIANT:     'dark',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  '',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span> the online proofing tool for collaborating on proofing journal content for BRILL.',
  FOOTER_LOGO_HTML:     ''
}
```

---

### 4.8 PLOS — Public Library of Science (`plos`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'plos',
  PAGE_TITLE:           'IMPACT - PLOS Proofing Portal',
  FAVICON:              'UI/client_logo/PLOS_FAVICON.ico',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'navbar-dark bg-blue',
  LOGO_HREF:            'https://plos.org/',
  LOGO_LINK_ATTRS:      'target="_blank" rel="noopener"',
  LOGO_SRC:             'UI/client_logo/PLOS_WHITE.svg',
  LOGO_HEIGHT:          '40',
  LOGO_WIDTH:           '60',
  LOGO_ALT:             'PLOS logo',
  NAV_LINK_CSS:         'text-light',
  NAV_ICON_VARIANT:     'white',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  '',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span>, the online proofing tool for collaborating on proofing journal content for Public Library of Science.',
  FOOTER_LOGO_HTML:     ''
}
```

> **Note**: PLOS is the only client that activates `AuthenticationFlow`. Requires:
> - `CLIENT.INSTRUCTIONS_TPL = 'plos'` (so `window.LANDING_CLIENT === 'plos'` → `isPlosClient()` true)
> - `plos.html` fragment includes `${{reCaptcha_google}}$` (STEP-05 change)
> - `authenticator/index.js` loaded in template (STEP-05 change)

---

### 4.9 Intellect Books (`intellect`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'intellect',
  PAGE_TITLE:           'IMPACT - Intellect Proofing Portal',
  FAVICON:              'UI/client_logo/INTELLECT_FAVICON.svg',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'navbar-dark bg-blue',
  LOGO_HREF:            'https://www.intellectbooks.com/journals',
  LOGO_LINK_ATTRS:      'target="_blank" rel="noopener"',
  LOGO_SRC:             'UI/client_logo/INTELLECT.png',
  LOGO_HEIGHT:          '25',
  LOGO_WIDTH:           '',
  LOGO_ALT:             'Intellect logo',
  NAV_LINK_CSS:         'text-light',
  NAV_ICON_VARIANT:     'white',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  '',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span>, the online proofing tool for collaborating on proofing journal content for INTELLECT.',
  FOOTER_LOGO_HTML:     ''
}
```

---

### 4.10 Wolters Kluwer — Medknow (`medknow`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'medknow',
  PAGE_TITLE:           'IMPACT - Medknow Proofing Portal',
  FAVICON:              'UI/client_logo/LWW_FAVICON.svg',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'fixed-top navbar-dark bg-blue',
  LOGO_HREF:            'https://www.wolterskluwer.com/en-in/solutions/medknow',
  LOGO_LINK_ATTRS:      'rel="noopener" target="_blank"',
  LOGO_SRC:             'UI/client_logo/MEDKNOW_WHITE.png',
  LOGO_HEIGHT:          '30',
  LOGO_WIDTH:           '150',
  LOGO_ALT:             'MEDKNOW logo',
  NAV_LINK_CSS:         'text-light',
  NAV_ICON_VARIANT:     'white',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  ' mt-5',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span>, the online proofing tool for collaborating on proofing journal content for Wolters Kluwer - Medknow.',
  FOOTER_LOGO_HTML:     ''
}
```

---

### 4.11 Taylor & Francis Books (`tnf`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'tnf',
  PAGE_TITLE:           'IMPACT - Taylor & Francis Books',
  FAVICON:              'UI/logo/TNF_FAVICON.ico',
  DOI_HIDE_STYLE:       '<style>[id="doi"]{display:none}</style>',
  NAVBAR_CSS:           'bt-border-color',
  LOGO_HREF:            '#',
  LOGO_LINK_ATTRS:      'rel="noopener"',
  LOGO_SRC:             'UI/svg/logo/IMPACT_5_4.svg',
  LOGO_HEIGHT:          '30',
  LOGO_WIDTH:           '150',
  LOGO_ALT:             'T & F Logo',
  NAV_LINK_CSS:         '',
  NAV_ICON_VARIANT:     'dark',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  '',
  WELCOME_TEXT:         'Welcome to <span class="impact-title">IMPACT</span>, the online proofing tool that permits authors to directly edit and collaborate on book content.',
  FOOTER_LOGO_HTML:     ''
}
```

---

### 4.12 Taylor & Francis Journals / OCT (`tnfjournals`)

```js
CLIENT: {
  INSTRUCTIONS_TPL:     'tnfjournals',
  PAGE_TITLE:           'OCT - Taylor & Francis Journals',
  FAVICON:              'UI/client_logo/TNFJOURNALS_FAVICON.svg',
  DOI_HIDE_STYLE:       '',
  NAVBAR_CSS:           'bt-border-color',
  LOGO_HREF:            '',
  LOGO_LINK_ATTRS:      '',
  LOGO_SRC:             'UI/client_logo/TNF_JORUNAL.svg',
  LOGO_HEIGHT:          '55',
  LOGO_WIDTH:           '150',
  LOGO_ALT:             'IMPACT Logo',
  NAV_LINK_CSS:         '',
  NAV_ICON_VARIANT:     'dark',
  NAV_ICON_SIZE:        '18',
  CONTAINER_EXTRA_CSS:  '',
  WELCOME_TEXT:         'Welcome to <span>T&amp;F\'s</span> Online Correction Tool (OCT)',
  FOOTER_LOGO_HTML:     ''
}
```

> **Note**: `tnfjournals` uses "OCT" (Online Correction Tool) branding, not "IMPACT". The
> welcome text and page title reflect this. The instruction fragment (`tnfjournals.html`)
> also contains a Third Party Plug-Ins / Chinese translation block inline.

---

## 5. Deployment Checklist per Client

When deploying for a new/updated client:

- [ ] Add `CLIENT: { ... }` block to the relevant `env/env.{environment}.js`
- [ ] Verify `CLIENT.INSTRUCTIONS_TPL` matches an existing file in `src/snippets/component/instructions/`
- [ ] Confirm favicon file exists at `CLIENT.FAVICON` path
- [ ] Confirm logo file exists at `CLIENT.LOGO_SRC` path
- [ ] Confirm footer logo file path exists (if `FOOTER_LOGO_HTML` is non-empty)
- [ ] For PLOS: verify `authenticator/index.js` is present in built assets
- [ ] Run `replacePlaceholders.js` and review the resolved HTML output before deploying

---

## 6. Adding a New Client

To onboard a client not in this list:

1. Create `src/snippets/component/instructions/{newclient}.html`
2. Add `CLIENT: { INSTRUCTIONS_TPL: 'newclient', ... }` to the env file
3. Add client logo files to `UI/client_logo/`
4. Run `replacePlaceholders.js` — done. No other files need changing.

---

*End of STEP-06 — all 6 markdown steps are complete.*
