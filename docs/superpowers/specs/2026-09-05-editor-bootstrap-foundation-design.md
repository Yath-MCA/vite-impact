# Editor Bootstrap Foundation — Design Spec

## Context

`impact_react_vite` is a React/Vite rewrite of `impactweb` (the current
production app, vanilla JS, git remote `bitbucket.org/ngimpact/impact_web.git`,
branch `vite_implementation`), which itself replaced the older `impact_qa`
jQuery codebase. `impactweb`'s real editor bootstrap sequence is fully
documented in code (`src/js/_initialScriptLoader.js`,
`src/js/_initalLoadingDialog.js`, `src/js/editorBootInit.js`) and in
`src/static/workflows/workflows.json`.

Today `impact_react_vite`'s `EditorPage.jsx` renders a hardcoded content
string with no config loading and no real document fetch. This spec defines
the first of three sub-projects that bring the React app to parity with
`impactweb`'s bootstrap:

1. **Editor Bootstrap Foundation** (this spec) — config loading, document
   content loading, and the session-gate/shell phase.
2. Immediate Module Bootstrap (query + tier2 phases — GuidedTour, thumbnail,
   query/comment, CHECK_REQUEST scheduler, etc.) — future spec.
3. Track View & Lazy/On-Demand Modules — future spec.

## Reference Behavior (impactweb, current production)

`LoadingConfig` (`_initialScriptLoader.js`) parallel-fetches five resources
via `XMLHttpRequest` against `assets/<version>/config/<dtd>/<client>/...`:

| Resource | URL pattern | Purpose |
|---|---|---|
| `META_CONFIG` | `.../config.xml` | Per-journal/book config: `editor6Layout`, `Generate_Items` (fig/tab caption prefs) |
| `ICO_FILE` | `assets/images/client_logo/<CLIENT>_FAVICON.svg` | Per-client favicon |
| `LANG_CONFIG` | `assets/<version>/config/lang/<lang>.js` | i18n strings |
| `CLIENT_CONFIG` (client-split) | `.../split/<SHORT_TITLE>.xml` | Per-sub-journal override of `config.xml` |
| `CEG_CONFIG` | `.../ceg/refStyling_<SHORT_TITLE|refstyle>.xml` | Reference/citation styling rules |

Once all five resolve, `InitialLoadDialog.runConfigCompleteGate()` validates
the session (`confirmLinkSessionOnServer`), then `EDITOR_INITIALIZE.TRY_START()`
→ `RUN_READY_TO_OPEN()` fetches document content (`openhtml` AJAX call) and
CKEditor is initialized with it. Only after that does the module-bootstrap
chain (tier1/query/tier2 — out of scope here) begin.

`impact_react_vite` already has a different-shaped but complete session
validation on the **landing page** (`useLandingSessionFlow`,
`useLandingUserValidation`, `sessionGateway.js`) — that responsibility is
NOT being re-built here. This spec only covers what happens once the editor
route itself mounts.

## Architecture

Two new hooks plus one small init function, all called from `EditorPage.jsx`,
replacing the hardcoded `INITIAL_CONTENT` and adding config-driven UI toggles:

```
EditorPage.jsx mounts (docId already resolved by landing-page session flow)
  │
  ├─ useClientConfig(docId) ─────► fetch + parse 3 XML resources in parallel
  │                                (config.xml, split override, ceg refStyling)
  │                                → { toggles, refStyleRules, loading, error }
  │
  └─ useEditorContent(docId) ────► fetch document content from server
                                   → { content, loading, error }
```

No favicon/lang fetch in this spec (out of scope — see below).

## Components

### `src/services/editorConfig/editorConfigConstants.js` (new)
Constants: base path builder mirroring `LoadingConfig.FOLDER_PATH` —
`assets/<version>/config/<dtd>/<client>/` — built from `env()`-driven
version/base values, following the exact pattern in `sessionConfig.js`.

```js
export const editorConfigBase = {
  configAssetBase: env('EDITOR_CONFIG_ASSET_BASE', 'VITE_EDITOR_CONFIG_ASSET_BASE', '/assets/config'),
  configVersion: env('EDITOR_CONFIG_VERSION', 'VITE_EDITOR_CONFIG_VERSION', 'v1')
};
```

### `src/services/editorConfig/parseClientConfigXml.js` (new)
Pure function: `(xmlDoc) => toggles` — parses `config.xml`'s
`editor6Layout` and `Generate_Items` nodes into a flat object, mirroring
`SET_EDITOR_LAYOUT_CONFIG` and the `GENERATE`/`FIG_CAP`/`TAB_CAP` reads in
`MetaConfig.handleResponse`. Returns a safe default object
(`{ layoutMode: 'default', figCap: null, tabCap: null }`) when the XML is
missing expected nodes — never throws.

### `src/services/editorConfig/useClientConfig.js` (new hook)
```js
function useClientConfig({ docId, client, dtd, journalCode, refStyle }) {
  // returns { toggles, refStyleDoc, loading, error }
}
```
Fetches (via `fetch`, not `XMLHttpRequest`) `config.xml`,
`split/<journalCode>.xml`, and `ceg/refStyling_<journalCode|refStyle>.xml`
in parallel with `Promise.allSettled` — a failure in any one resource does
not block the others. Parses each response with `DOMParser`. On total
failure, returns the safe-default `toggles` from `parseClientConfigXml`
(all-optional-UI-hidden fallback) and `error` set, but never rejects.

### `src/services/editorConfig/useEditorContent.js` (new hook)
```js
function useEditorContent(docId) {
  // returns { content, loading, error }
}
```
Fetches document content from the existing document API (same base as
`sessionGateway.js`'s `getdocs`-style calls — reuses
`sessionConfig.sessionServiceApiBase`/existing document endpoint, exact
endpoint TBD against backend contract at implementation time — see Open
Question below). On error, sets `error` and leaves `content` `null` — the
page shows a blocking error state (no silent fallback to placeholder text).

### `EditorPage.jsx` (modify)
- Replace `const [editorData, setEditorData] = useState(INITIAL_CONTENT)`
  initialization with `useEditorContent(docId)`'s `content`, falling back to
  an explicit "Loading document…" placeholder only while `loading` is true.
- Consume `useClientConfig(...)`'s `toggles` to conditionally show/hide the
  toolbar items and panels that `Generate_Items`/`editor6Layout` control
  today via `EDITOR_LAYOUT_CONFIG` (e.g., three-column mode maps to hiding
  `PdfPreview`/`ThumbnailPanel`, matching `enforceProfileLayout`'s
  `hidePdf`/`hideThumbnail` behavior) — reusing the existing `useLayout()`
  toggle mechanism rather than replacing it.
- On `useEditorContent` error, render a blocking error panel instead of the
  CKEditor shell.

## Data Flow

```
Landing page grants session (existing flow, unchanged)
  → navigate(sessionConfig.editorPath) with docId in session storage
  → EditorPage mounts
  → useClientConfig + useEditorContent fire in parallel
  → useClientConfig resolves (or safe-defaults) → toggles applied to useLayout
  → useEditorContent resolves → CKEditor initData set
  → (existing) loadCKEditor() + claimValidateTab() flow proceeds unchanged
```

## Error Handling

- **Config fetch failure** (any of the 3 XML resources): logged via the
  existing `ErrorLogTrace`-equivalent pattern used elsewhere in this app
  (check `src/services/error/index.js`'s `initErrorOps` for the current
  hook), falls back to safe defaults, editor still loads — matches
  `impactweb`'s own tolerance (missing `Generate_Items` just means
  `FIG_CAP`/`TAB_CAP` stay `null`, nothing blocks).
- **Content fetch failure**: blocking error state, no hardcoded fallback —
  showing wrong/stale content is worse than showing an error.
- Both hooks expose `error` as a plain object (`{ message, cause }`), never
  throw past their own boundary — `EditorPage.jsx` decides what to render.

## Testing

- Vitest unit tests for `parseClientConfigXml.js` (valid XML → toggles,
  missing nodes → defaults, malformed XML → defaults + no throw).
- Vitest unit tests for `useClientConfig`/`useEditorContent` with mocked
  `fetch` (success, partial failure, total failure paths).
- Manual smoke test: load `/editor` with a valid `docId` in session storage,
  confirm real fetched content renders (not hardcoded `INITIAL_CONTENT`) and
  toggles reflect a test `config.xml`'s `editor6Layout` value.

## Explicitly Out of Scope

- Favicon and language-pack fetching (`ICO_FILE`, `LANG_CONFIG`) — no
  current UI need; add only if a concrete requirement appears.
- Everything in `EditorBootInit`'s `tier1`/`query`/`tier2`/`track` phases
  (session-bridge module registration beyond what `sessionGateway.js`
  already does, GuidedTour, SweetAlert2 usage beyond what's already ported,
  SaveModule, toc/floats, query/comment, thumbnail lazy-load, socket
  activation, user activity tracker) — sub-projects 2 and 3.
- Porting `_editorLayout.js`'s column-class/dialog-docking mechanics —
  `useLayout()`'s existing simpler toggle model stays as the mechanism;
  only the *inputs* to it change (config-driven instead of hardcoded).

## Open Question

The exact document-content-fetch endpoint/contract for
`useEditorContent.js` is not yet confirmed against the backend — `impactweb`
uses an `openhtml`/`getdocsreports` AJAX call with legacy request shape.
Implementation should confirm the equivalent REST contract (likely already
exposed via the existing document API this app's `sessionGateway.js` talks
to) before writing the fetch call. If no such endpoint exists yet, this
becomes a backend-coordination blocker for this sub-project.
