# GuidedTour Design Spec

## Context

Fourth sub-project in the `impactweb` → `impact_react_vite` editor migration,
building on **Module Runtime Foundation** (`useModuleLifecycle`) for
analytics/lifecycle tracking.

Legacy's `GuidedTour` (`impactweb/src/modules/standalone/guide_tour/index.js`,
709 lines) wraps the jQuery-based `bootstraptour` library
(https://bootstraptour.com/api/), targeting legacy DOM selectors
(`#iEditorSection`, `.pdf-section`, `.pdf-menu-header`, `#filesaving`) that do
not exist in `impact_react_vite`'s actual component tree (`Navbar1`/`Navbar2`/
`NavigationPanel`/`PdfPreview`/`ThumbnailPanel`/`EditorFooter`). Per the
approved design conversation, this is **not** a port of `bootstraptour` or a
custom-built-from-scratch overlay — it adopts `react-joyride` (a maintained
React tour library) for the step/overlay/navigation mechanics, with a thin
custom wrapper feeding this app's own analytics (`useModuleLifecycle`) and
"seen tour" state, rather than legacy's session-storage tracking
(`HandlingSessionStorage`) or its bespoke pause/resume/backdrop code.

## Architecture

```
EditorPage.jsx
  ├─ data-tour="toc" / "editor-canvas" / "pdf-preview" / "thumbnails" / "footer"
  │  (new attributes on existing wrapper divs — the real join points)
  │
  ├─ useGuidedTour(docId)
  │    ├─ run, stepIndex           (local state)
  │    ├─ steps                     (from tourSteps.js)
  │    ├─ startTour()               (checks hasSeenTour, then sets run:true)
  │    └─ handleJoyrideCallback(data) — maps Joyride events to:
  │           ├─ useModuleLifecycle('guidedTour','GuidedTour').open()   on tour start
  │           ├─ .recordStat('buttonClicked', {buttonId:'next'|'skip'}) on step nav
  │           └─ .close() + setHasSeenTour(docId)                       on tour end
  │
  └─ <Joyride steps={steps} run={run} stepIndex={stepIndex}
              callback={handleJoyrideCallback}
              continuous showProgress showSkipButton />
```

## Components

### `src/features/editor/tour/tourSteps.js` (new)
```js
export const tourSteps = [
  { target: '[data-tour="toc"]', title: 'Navigation', content: '...' },
  { target: '[data-tour="editor-canvas"]', title: 'Editor Section', content: '...' },
  { target: '[data-tour="pdf-preview"]', title: 'Proof Section', content: '...' },
  { target: '[data-tour="thumbnails"]', title: 'Thumbnails', content: '...' },
  { target: '[data-tour="footer"]', title: 'Document Controls', content: '...' }
];
```
Content adapted from legacy's actual copy (`guide_tour/index.js`'s
`InitalSteps`) where it still applies to this app's real feature set. Legacy's
"File Saving... will be autosaved once every 30 seconds" copy for the
`#filesaving` step is **not** carried over verbatim — this app has no save
functionality yet (SaveModule — Core Flow is a separate, not-yet-implemented
spec). The `footer` step's copy in this spec describes only what exists today
(document controls in `EditorFooter`); once SaveModule ships, updating this
one step's copy to mention autosave is a one-line follow-up, not part of this
spec.

### `src/features/editor/tour/useGuidedTour.js` (new)
```js
export function useGuidedTour(docId) {
  // returns { run, stepIndex, steps, startTour, handleJoyrideCallback }
}
```
- `startTour()`: reads `hasSeenTour(docId)` (new helper, below); if `false`,
  sets `run: true`, `stepIndex: 0`, and calls `useModuleLifecycle('guidedTour','GuidedTour').open()`.
  Always callable regardless of the flag — a future "Take the tour" button can
  call `startTour({ force: true })` to re-run it (the `force` flag skips the
  `hasSeenTour` check, since a manual re-trigger is an explicit user choice).
- `handleJoyrideCallback({ status, action, index, type })` (react-joyride's
  actual callback payload shape): on `type === 'step:after'`, updates
  `stepIndex` and calls `recordStat('buttonClicked', { buttonId: action })`
  (`action` is react-joyride's own `'next'|'prev'|'skip'|'close'` value —
  reused directly, not reinvented). On `status` being one of react-joyride's
  terminal statuses (`'finished'|'skipped'`), calls `close()` and
  `setHasSeenTour(docId, true)`.

### `src/features/editor/tour/tourSeenStorage.js` (new)
```js
export function hasSeenTour(docId) { /* localStorage read */ }
export function setHasSeenTour(docId, seen = true) { /* localStorage write */ }
```
Plain `localStorage` helpers, keyed `xmleditor:tourSeen:<docId>` (matching
this project's existing `xmleditor:` key-naming convention seen throughout
`sessionConstants.js`). Per-document, not global — matches legacy's
per-session tracking granularity more closely than a single global flag would.

### `EditorPage.jsx` (modified)
- Add `data-tour="toc"`/`"editor-canvas"`/`"pdf-preview"`/`"thumbnails"`/`"footer"`
  to the five existing wrapper `<div>`s (`NavigationPanel`'s container, the
  CKEditor canvas container, `PdfPreview`'s container, `ThumbnailPanel`'s
  container, `<EditorFooter />`'s wrapper).
- Call `useGuidedTour(sessionDocId)`, render `<Joyride ... />` alongside the
  existing `<ModuleManager />` at the bottom of the component tree, and call
  `startTour()` once in a `useEffect` after `editorContent.content` resolves
  (no point starting a tour over a "Loading document…" placeholder).

## Data Flow

```
EditorPage mounts → content resolves (Editor Bootstrap Foundation's useEditorContent)
  → useGuidedTour's effect calls startTour()
  → hasSeenTour(docId)? → no → open() + run:true
  → Joyride renders step 0's overlay targeting [data-tour="toc"]
  → user clicks Next → handleJoyrideCallback → recordStat + stepIndex++
  → ... → user finishes/skips → close() + setHasSeenTour(docId, true)
```

## Error Handling

- A step whose `target` selector isn't currently in the DOM (e.g. `thumbnails`
  panel hidden via `toggles.showThumbnails`) is react-joyride's own concern —
  its documented behavior is to skip/warn on a missing target, not something
  this spec re-implements or papers over.
- `localStorage` access failing (private browsing, quota) is caught inside
  `hasSeenTour`/`setHasSeenTour` and treated as "not seen" / "write silently
  no-op" — worst case the tour shows again next visit, never a hard failure.

## Testing

- Vitest unit tests for `tourSeenStorage.js`: set/read round-trip, per-docId
  isolation (two different docIds don't share a flag), graceful handling when
  `localStorage` throws.
- Vitest unit tests for `useGuidedTour.js` using the hand-rolled `renderHook`
  pattern wrapped in a `<Provider>` (for `useModuleLifecycle`): `startTour()`
  respects `hasSeenTour`, `startTour({ force: true })` bypasses it,
  `handleJoyrideCallback` advances `stepIndex` and calls `recordStat`, and a
  terminal status calls `close()` + sets the seen flag.
- `tourSteps.js` gets one simple structural test: every step has a non-empty
  `target` matching the `[data-tour="..."]` pattern and non-empty `content`.
- No test of `react-joyride`'s own rendering/positioning — that's the
  library's tested behavior, not this spec's to re-verify.

## Explicitly Out of Scope

- Custom pause/resume UI (legacy's `togglePauseResume`/`onPause`/`onResume`) —
  react-joyride's `continuous` mode with skip/next covers the practical need;
  a pause feature can be added later if actually requested.
- Custom backdrop/accessibility-focus code (legacy's `setRemoveCustomBackDrop`,
  `setAccessibilityFocus`) — react-joyride ships its own backdrop and focus
  handling; not re-implemented.
- Step-duration-based analytics (legacy's `recordStepStart`/`recordStepEnd`/
  `calculateDuration`) — this spec's analytics are limited to
  `useModuleLifecycle`'s existing `buttonClicked`/open/close tracking; per-step
  timing is a possible future enhancement, not built speculatively now.
- A "Take the tour" manual re-trigger button/menu entry — the hook supports it
  (`startTour({ force: true })`) but wiring an actual UI trigger is a small
  follow-up, not part of this spec (matches the same UI-deferral pattern used
  in SaveModule's spec).

## Global Constraints

- New dependency: `react-joyride` — not currently in `package.json`. This is
  a deliberate addition per the approved design (adopting a maintained
  library for tour mechanics rather than porting `bootstraptour` or building
  custom overlay/positioning code from scratch).
- `data-tour` attribute values are the stable contract between `EditorPage.jsx`
  and `tourSteps.js` — any future rename of a wrapper's `data-tour` value must
  update the matching step's `target` selector in the same change.
- `localStorage` keys follow this project's existing `xmleditor:` prefix
  convention.
