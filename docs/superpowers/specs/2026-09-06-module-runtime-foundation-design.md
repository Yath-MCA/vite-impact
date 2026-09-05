# Module Runtime Foundation — Design Spec

## Context

This is the second sub-project in the `impactweb` → `impact_react_vite` editor
migration (see `2026-09-05-editor-bootstrap-foundation-design.md` for the
first). It targets the shared foundation that concrete modules (GuidedTour,
SaveModule, future ones) will be built on: legacy's `BaseModule`
(`impactweb/src/modules/_runtime/BaseModule.js`, ~1,900 lines, ES6 class) and
`ModuleRuntimeStore` (`impactweb/src/modules/context/store/module-runtime-store.js`,
a hand-rolled Redux-style observer store).

`BaseModule` is a legacy god-class: alongside lifecycle management
(`init`/`show`/`closeDialog`) it also constructs a file uploader, an error
tracker, a track-change manager, and Summernote setup directly in its
constructor, and owns jQuery-style DOM helpers, regex setup, and a
template-bundle-with-fallback loader. Investigation found no actual
`ContextMenuGroup` class exists anywhere in the codebase — it is referenced
only in two docs (`templates_migration.md`,
`query-comment-system/README.md`); the template-loading behavior described
for it actually lives inside `BaseModule` itself
(`getTemplatePath`/`recoverTemplateFromStore`/`GetTemplate`).

Per the approved design conversation, this spec does **not** port
`BaseModule` wholesale (Approach B, rejected as a YAGNI violation — most of
its 60+ methods are legacy-specific plumbing unrelated to lifecycle/state).
Instead it takes **Approach A**: port only `ModuleRuntimeStore`'s proven
state shape into a real Redux store (per explicit requirement — this app
currently has no Redux, only `@tanstack/react-query` for server state and
React Context for UI state), plus a thin lifecycle hook. Everything else
`BaseModule` does (Summernote, file upload, DOM helpers, template bundling)
is deferred to whichever concrete module actually needs it.

`impact_react_vite` already has `ModuleRegistry.jsx`/`ModuleManager.jsx` — a
working overlay/dialog rendering system (modal/sidebar/popout). This spec
does not replace it. The new Redux slice tracks *lifecycle state* of a
module instance (is it open, how many times has it been opened, has it
errored); `ModuleRegistry`/`ModuleManager` still own *what component renders
as the overlay*. The two compose together but are independent concerns.

## Architecture

```
main.jsx
  └─ <Provider store={store}>          ← new
       └─ <QueryClientProvider>         ← existing
            └─ <App /> → ... → module component
                 └─ useModuleLifecycle('queryDialog', 'QueryDialogModule')
                      ├─ init()   → dispatch(moduleInitialized)
                      ├─ open()   → dispatch(moduleOpened)
                      ├─ close()  → dispatch(moduleClosed)
                      ├─ recordStat(type) → dispatch(buttonClicked | inputInteracted)
                      ├─ recordError(fn, msg) → dispatch(errorRecorded)
                      └─ state    → useSelector(s => s.modules.byId[moduleId])
```

`src/store/modulesSlice.js` is a Redux Toolkit slice whose reducer logic is a
direct, faithful translation of legacy's `reducer(state, action)` function
in `module-runtime-store.js` — same state shape, same action-type strings,
same timeline cap (100 entries) — so any legacy behavioral expectations
(e.g. "only the most recent 100 actions are kept", "closing the active
dialog clears `activeDialogId`") carry over unchanged, just re-expressed as
Redux Toolkit reducers instead of a hand-written `Object.assign` reducer.

## Components

### `src/store/modulesSlice.js` (new)
Redux Toolkit slice, `name: 'modules'`. State shape (matches legacy exactly):
```js
{
  runtime: { activeModuleId: null, activeDialogId: null, lastAction: null, updatedAt: null },
  modules: { byId: {}, openIds: [] },
  timeline: []   // capped at 100 entries, oldest dropped first
}
```
Note: legacy's `document` slice (`docid`/`dtd`/`client`/`role` pulled from
globals `SHARED_KEY`/`USER_INFO`/`DOC_ID`) is dropped — this app already has
that data in React state/session storage (`sessionSource.js`), so
duplicating it into Redux would be a second source of truth. Nothing in this
spec reads `state.modules.document`.

Reducers (each takes a normalized module payload, mirroring legacy's
`normalizeModule`):
- `moduleInitialized(state, action: { id, name, dialogType })`
- `moduleOpened(state, action: { id })` — sets `isOpen: true`, increments
  `stats.openCount`, sets `stats.lastOpened`, updates `runtime.activeModuleId`/`activeDialogId`, pushes `id` onto `modules.openIds`.
- `moduleClosed(state, action: { id })` — mirror of `moduleOpened`, removes
  from `openIds`, clears `runtime.activeDialogId` only if it was the closed module (matching legacy's exact conditional).
- `buttonClicked(state, action: { id, buttonId })` — increments `stats.buttonClicks[buttonId]`.
- `inputInteracted(state, action: { id })` — increments `stats.inputInteractions`.
- `errorRecorded(state, action: { id, functionName, message })` — increments `errors`, sets `lastError`.

Every reducer call also appends one entry to `timeline` (capped at 100,
oldest dropped) — implemented as a slice-level `extraReducers`-free approach:
each reducer pushes its own timeline entry via a shared internal helper
function called from within each case (Redux Toolkit's Immer draft makes
this safe to write imperatively, unlike legacy's manual `clone()`).

### `src/store/index.js` (new)
```js
import { configureStore } from '@reduxjs/toolkit';
import modulesReducer from './modulesSlice.js';

export const store = configureStore({
  reducer: { modules: modulesReducer }
});
```

### `src/store/useModuleLifecycle.js` (new)
```js
function useModuleLifecycle(moduleId, moduleName) {
  // returns { state, init, open, close, recordStat, recordError }
}
```
- `state` — `useSelector((s) => s.modules.byId[moduleId] ?? null)`.
- `init()` — dispatches `moduleInitialized({ id: moduleId, name: moduleName })`. Idempotent: a module component may call this every render; the reducer just overwrites with the same normalized shape (matching legacy's `Object.assign` merge behavior — safe to call repeatedly).
- `open()` / `close()` — dispatch `moduleOpened`/`moduleClosed({ id: moduleId })`.
- `recordStat(type, extra)` — `type` is `'buttonClicked' | 'inputInteracted'`; dispatches the matching action with `{ id: moduleId, ...extra }` (e.g. `{ buttonId }` for `buttonClicked`).
- `recordError(functionName, message)` — dispatches `errorRecorded({ id: moduleId, functionName, message })`. This is module-instance-scoped tracking, separate from and not a replacement for the app's existing global `src/services/error/errorLogTrace.js` — a module should call both when it wants both the global log and its own instance's error count updated (this spec does not wire that cross-call automatically, to avoid coupling the two systems together implicitly).

### `main.jsx` (modify)
Wrap `<App />` in `<Provider store={store}>`, nested inside the existing
`<QueryClientProvider>` (order doesn't matter functionally since neither
depends on the other, but keeping `QueryClientProvider` outermost preserves
the existing structure with a minimal diff).

## Data Flow

```
Module component mounts
  → useModuleLifecycle(id, name) called
  → init() dispatched once (component's own effect decides when)
  → user opens the module (e.g. clicking a toolbar button)
  → open() dispatched → state.modules.byId[id].isOpen = true
  → ModuleRegistry/ModuleManager (existing, unrelated state) renders the actual overlay
  → user interacts → recordStat(...) dispatched for analytics-equivalent tracking
  → user closes → close() dispatched
  → timeline now has entries for initialized/opened/[stat events]/closed, capped at 100
```

## Error Handling

- `recordError` never throws — it's a plain dispatch; Redux reducers here
  are pure and cannot fail at runtime for well-formed actions.
- If `useModuleLifecycle` is used outside a `<Provider>` (e.g. a test that
  forgets to wrap it), `useSelector`/`useDispatch` throw immediately with
  react-redux's own clear error message — no need to add a custom guard on
  top of that.
- No network calls in this spec — everything is synchronous, in-memory
  Redux state. Nothing here can fail asynchronously.

## Testing

- Vitest unit tests for `modulesSlice.js`'s reducers — one test per action
  type, covering: normal case, the `openIds`/`activeDialogId` bookkeeping on
  open/close, the 100-entry timeline cap (dispatch 105 actions, assert
  length 100 and that the oldest 5 were dropped), and closing a module that
  is *not* the current `activeDialogId` (asserts `activeDialogId` is left
  alone, per legacy's conditional).
- Vitest unit tests for `useModuleLifecycle` using this project's hand-rolled
  `renderHook` pattern (see `tests/unit/landing/useLandingSessionFlow.test.js`),
  wrapping the harness component in a real `<Provider store={testStore}>`
  (a fresh `configureStore` per test, not the app singleton) to verify
  `init`/`open`/`close`/`recordStat`/`recordError` each produce the expected
  state changes.
- No manual smoke test needed for this sub-project alone — it has no visible
  UI on its own; it will be exercised end-to-end once GuidedTour or
  SaveModule (future sub-projects) actually call `useModuleLifecycle`.

## Explicitly Out of Scope

- Everything in `BaseModule` unrelated to lifecycle/state: Summernote setup,
  file upload (`FileUploadModule`), the track-change manager
  (`trackManager`), regex pattern setup, jQuery-style DOM helpers
  (`newElm`, `iGetElmById`, `GetFragment`), tooltip setup (`initTippyTooltips`),
  and the template-bundle-with-fallback loader
  (`getTemplatePath`/`recoverTemplateFromStore`/`GetTemplate`, i.e. the
  "ContextMenuGroup" concept) — deferred to whichever concrete module
  (GuidedTour, SaveModule, or a later one) actually needs template loading;
  no module built on this foundation needs it yet.
- Legacy's `document` slice (`docid`/`dtd`/`client`/`role`) — not duplicated
  into Redux; this app's existing session/context state remains the single
  source of truth for that data.
- Any change to `ModuleRegistry.jsx`/`ModuleManager.jsx` — they are
  unmodified; this spec adds a parallel, independent piece of state.
- Wiring `recordError` to the existing global `errorLogTrace` — left as a
  manual choice for each module, not an automatic side effect.

## Global Constraints

- New dependencies: `@reduxjs/toolkit` and `react-redux` — neither exists in
  this project's `package.json` today. This is a deliberate, explicit
  addition per the approved design (Redux was specifically requested for
  module-state handling), not an incidental one.
- The Redux slice's state shape and action-type strings must match legacy's
  `module-runtime-store.js` exactly (documented above) so behavior any
  future module relies on (timeline cap, active-dialog-on-close logic)
  matches the system it's replacing.
