# SaveModule — Core Flow Design Spec

## Context

This is the third sub-project in the `impactweb` → `impact_react_vite` editor
migration, building on the first two:

- **Editor Bootstrap Foundation** (`2026-09-05-editor-bootstrap-foundation-design.md`) —
  real document content loading, config-driven UI.
- **Module Runtime Foundation** (`2026-09-06-module-runtime-foundation-design.md`) —
  the Redux-backed `useModuleLifecycle` hook for module-instance state/stats/errors.

`impact_react_vite` currently has **no save functionality at all** — confirmed
by searching the codebase for any save-related code touching the document
editor (the one hit, `ConfigEditor.jsx`, is an unrelated admin config screen).

Legacy's `SaveModule` (`impactweb/src/js/editor_page_events_fn.js:3614-5216`,
~1,600 lines, 50+ methods) is the largest single class in that codebase. This
spec deliberately covers only its **core flow**: session-validation-before-save,
basic content validation, the online save request, autosave scheduling, and
save-state tracking. Deferred to future specs: CJK-specific content validation
and its auto-mail-on-failure flow, offline-save mode, save-history comparison,
and the query-restore integration inside `performOnlineSave`.

## Reference Behavior (impactweb)

`SaveModule.save()` → `validateSessionBeforeSave()` → `validateContent()` →
`performOnlineSave()` → `handleSaveResponse()`. Key details found in the
actual source:

- `validateSessionBeforeSave` (lines 3928-4028) skips validation entirely for
  offline saves, otherwise calls `LinkSessionCore.getInstance().guardEditorSession()`
  and maps the result to `allow` / `postpone` (transient failure, retried) /
  `stale` (redirects to a safe page and blocks the save). This project has no
  `LinkSessionCore`/`guardEditorSession` — its closest existing equivalent is
  `claimValidateTab({ docId, key })` from `src/services/session/tabPresence.js`,
  already used in `EditorPage.jsx` to confirm tab ownership on mount.
- `performOnlineSave` (lines 4251-4322) posts via
  `commonfn.callajax(saveData, "saveResponse", API_FORM_TO_FILE_FIELD, options)`.
  `API_FORM_TO_FILE_FIELD` corresponds to this project's existing
  `API_ENDPOINTS.FORM_TO_FILE_FIELD` (`src/services/api/apiService.js:57`,
  resolving to `API_PATH + "formfieldtofile"`).
- `startAutoSave`/`stopAutoSave` (lines 4909, 4948 relative — i.e. absolute
  lines 4523/4562) start/clear a `setInterval` that calls `save({ autoSave: true })`.

## Architecture

```
src/services/save/
├── saveDocument.js     — plain async function, posts to FORM_TO_FILE_FIELD
└── useSaveModule.js     — the hook: session guard → validate → save → state

Editor component (future wiring, not part of this spec)
  └─ useSaveModule(docId)
       ├─ save({ autoSave }) ──► claimValidateTab (existing)
       │                         │
       │                         ├─ invalid ──► showEditorMessage(EXPIRED_SESSION_ALERT)
       │                         │              return { ok: false, reason: 'stale_session' }
       │                         │
       │                         └─ valid ──► validate content (non-empty)
       │                                       │
       │                                       ├─ invalid ──► return { ok:false, reason:'empty_content' }
       │                                       │
       │                                       └─ valid ──► saveDocument(docId, content)
       │                                                     │
       │                                                     ├─ success ──► useModuleLifecycle.recordStat
       │                                                     └─ failure ──► useModuleLifecycle.recordError
       ├─ startAutoSave(intervalMs)
       ├─ stopAutoSave()
       └─ saveState: 'idle' | 'validating' | 'saving' | 'saved' | 'error'
```

## Components

### `src/services/save/saveDocument.js` (new)
```js
export async function saveDocument({ docId, content }) {
  // returns { ok: boolean, message: string }
}
```
Calls `apiService.makeRequest(API_ENDPOINTS.FORM_TO_FILE_FIELD, { docid: docId, content }, { method: 'POST' })`
(both already exported from `src/services/api/apiService.js`). `makeRequest`
returns `response.data` on success or throws on failure (per its existing
implementation — it wraps `axios.request` in a try/catch that rethrows).
`saveDocument` catches that throw and returns `{ ok: false, message: err.message }`
rather than letting it propagate — this is the boundary where HTTP failures
become a plain result object the hook can act on without try/catch at every
call site.

### `src/services/save/useSaveModule.js` (new)
```js
export function useSaveModule(docId) {
  // returns { saveState, save, startAutoSave, stopAutoSave, isDirty }
}
```
- Uses `useEditor()` (existing `EditorContext`) for `content`/`isDirty`/`setIsDirty` —
  dirty-state tracking is NOT reimplemented, it's read from the context that
  already owns it.
- Uses `useModuleLifecycle('saveModule', 'SaveModule')` (existing, from Module
  Runtime Foundation) for `recordStat('buttonClicked', { buttonId: 'save' })`
  on manual saves and `recordError('save', message)` on failure — this is the
  same instrumentation pattern any future module gets for free.
- `save({ autoSave = false } = {})`:
  1. Sets `saveState: 'validating'`.
  2. Calls `claimValidateTab({ docId, key: getValidateAccessKey() })`
     (`getValidateAccessKey` already exists in `sessionStorage.js`). If
     `claim.ok` is falsy, calls `showEditorMessage(EditorMessageKey.EXPIRED_SESSION_ALERT)`
     (both already exist), sets `saveState: 'error'`, and returns
     `{ ok: false, reason: 'stale_session' }` without attempting a save.
  3. Basic content validation: if `content` is empty/whitespace-only, sets
     `saveState: 'error'` and returns `{ ok: false, reason: 'empty_content' }`
     without a network call. (CJK character-count validation is explicitly
     deferred — this is only the "don't save nothing" guard.)
  4. Sets `saveState: 'saving'`, calls `saveDocument({ docId, content })`.
  5. On `{ ok: true }`: sets `saveState: 'saved'`, `setIsDirty(false)`,
     `recordStat('buttonClicked', { buttonId: autoSave ? 'autosave' : 'save' })`.
  6. On `{ ok: false }`: sets `saveState: 'error'`, `recordError('save', message)`.
  7. Returns the result object either way, so a caller (e.g. a Save button)
     can react to the outcome directly instead of only polling `saveState`.
- `startAutoSave(intervalMs = 30000)` / `stopAutoSave()`: a `setInterval`
  (stored in a `useRef`) calling `save({ autoSave: true })` only when
  `isDirty` is true at fire time (matches the spirit of legacy's autosave —
  no point saving unchanged content). Cleared on `stopAutoSave()` and on
  unmount.

## Data Flow

```
User clicks Save (future button, not part of this spec) OR autosave timer fires
  → save({ autoSave })
  → claimValidateTab (tab still owns session?)
  → content non-empty?
  → saveDocument → POST FORM_TO_FILE_FIELD
  → saveState updates; isDirty cleared on success
  → useModuleLifecycle records the outcome (stat or error) for observability
```

## Error Handling

- **Stale/lost session**: caught before any network call, shows the existing
  `EXPIRED_SESSION_ALERT` message — no new alert copy invented.
- **Empty content**: caught before any network call — never sends an empty
  save, matches "reject on conflict, don't check-then-insert"-style
  fail-fast philosophy already used elsewhere in this codebase's session
  logic.
- **Network/save failure**: `saveDocument` never throws past its own
  boundary; `useSaveModule` always gets a plain `{ ok, message }` result and
  reflects it in `saveState` plus `useModuleLifecycle.recordError` — no
  silent failures.
- Autosave failures behave identically to manual-save failures (same `save()`
  call, same error path) — no separate autosave-specific error UI in this
  spec.

## Testing

- Vitest unit tests for `saveDocument.js`: mocks `apiService.makeRequest`,
  covers success and thrown-error paths.
- Vitest unit tests for `useSaveModule.js` using this project's hand-rolled
  `renderHook` pattern wrapped in a `<Provider>` (required for
  `useModuleLifecycle`) and a mock `EditorProvider` (or a lightweight stand-in
  exposing `content`/`isDirty`/`setIsDirty`): covers the stale-session
  short-circuit, the empty-content short-circuit, a successful save clearing
  `isDirty`, a failed save setting `saveState: 'error'`, and
  `startAutoSave`/`stopAutoSave` actually starting/stopping a timer (using
  `vi.useFakeTimers()`).
- No manual smoke test in this spec — there is no UI wiring yet (see Out of
  Scope); this is a pure hook/service layer, exercised end-to-end once a
  future task wires a Save button into `EditorPage.jsx`.

## Explicitly Out of Scope

- CJK-specific content validation (`contentValidator.validateDocumentContent`)
  and its auto-mail-on-failure flow (`SupportMailDialog.errorMailWithFallback`) —
  a narrow, client-specific rule; future spec.
- Offline-save mode (`performOfflineSave`, `checkOfflineSave`, `getSaveDataForLogout`) —
  future spec.
- Save-history comparison (`compareSaveHistory`/`compareRecords`) — future spec.
- The `window.queryRestore` integration inside legacy's `performOnlineSave` —
  belongs to the query/comment module, a separate future sub-project.
- Any UI (Save button, spinner, toast) — this spec is the hook/service layer
  only; wiring it into `EditorPage.jsx`'s UI is a small follow-up once this
  lands.
- Session-validation retry/backoff logic (legacy's `handleSessionValidationTransientFailure`
  with bounded retries) — this spec treats any `claimValidateTab` failure as
  final (show the alert, stop), no retry loop. If transient-failure retries
  turn out to be needed in practice, that's a follow-up, not a guess made now.

## Global Constraints

- No new npm dependencies.
- Reuses existing infrastructure rather than re-implementing it:
  `claimValidateTab`/`getValidateAccessKey` (session), `useEditor()` (dirty
  state/content), `useModuleLifecycle` (lifecycle/error tracking),
  `showEditorMessage`/`EditorMessageKey` (alerts), `apiService.makeRequest`/
  `API_ENDPOINTS.FORM_TO_FILE_FIELD` (the save request itself).
- `saveDocument.js` never throws past its own boundary — always returns
  `{ ok, message }`.
