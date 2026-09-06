# GuidedTour Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an onboarding guided tour to the editor using `react-joyride`, with a per-document "seen" flag and analytics wired into the existing `useModuleLifecycle` infra.

**Architecture:** `tourSeenStorage.js` (localStorage) + `tourSteps.js` (step config targeting new `data-tour` attributes) + `useGuidedTour.js` (the hook: run/stepIndex state, `startTour`, `handleJoyrideCallback`) + a small `EditorPage.jsx` wiring task that adds the `data-tour` attributes and renders `<Joyride>`.

**Tech Stack:** React (hooks), `react-joyride` (new dependency). Vitest + happy-dom for tests.

**Spec:** `docs/superpowers/specs/2026-09-06-guided-tour-design.md`

## Global Constraints

- New dependency: `react-joyride` — not currently in `package.json`.
- `data-tour` attribute values are the stable contract between `EditorPage.jsx` and `tourSteps.js` — a step's `target` selector must exactly match its wrapper's `data-tour` value.
- `localStorage` keys follow this project's existing `xmleditor:` prefix convention.
- `localStorage` access failures (private browsing, quota) are caught and treated as "not seen" / silent no-op write — never a hard failure.
- Tests live under `tests/unit/<domain>/*.test.js` (Vitest, `happy-dom` environment). Hook tests use this project's hand-rolled `renderHook` harness, accessing returned state via a live property (`harness.result.xxx`), **never** via `const { result } = renderHook(...)` destructuring — that pattern silently freezes state at its initial value (a real bug found and fixed during the Editor Bootstrap Foundation plan).
- No test of `react-joyride`'s own rendering/positioning — that's the library's tested behavior, not this plan's to re-verify.

---

## File Structure

```
src/features/editor/tour/
├── tourSeenStorage.js    # localStorage seen-flag helpers (Task 1)
├── tourSteps.js          # step config array (Task 2)
└── useGuidedTour.js      # the hook (Task 3)

tests/unit/tour/
├── tourSeenStorage.test.js
├── tourSteps.test.js
└── useGuidedTour.test.js

src/features/editor/pages/EditorPage.jsx   # modified in Task 4
```

---

### Task 1: `tourSeenStorage.js`

**Files:**
- Create: `src/features/editor/tour/tourSeenStorage.js`
- Test: `tests/unit/tour/tourSeenStorage.test.js`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces: `hasSeenTour(docId: string): boolean`, `setHasSeenTour(docId: string, seen?: boolean): void` — consumed by Task 3's `useGuidedTour`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/tour/tourSeenStorage.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { hasSeenTour, setHasSeenTour } from '../../../src/features/editor/tour/tourSeenStorage.js';

describe('tourSeenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns false when nothing has been recorded', () => {
    expect(hasSeenTour('DOC1')).toBe(false);
  });

  it('round-trips true after setHasSeenTour', () => {
    setHasSeenTour('DOC1', true);
    expect(hasSeenTour('DOC1')).toBe(true);
  });

  it('keeps different docIds isolated', () => {
    setHasSeenTour('DOC1', true);
    expect(hasSeenTour('DOC2')).toBe(false);
  });

  it('returns false when docId is falsy', () => {
    expect(hasSeenTour('')).toBe(false);
    expect(hasSeenTour(undefined)).toBe(false);
  });

  it('returns false without throwing when localStorage.getItem throws', () => {
    const original = localStorage.getItem;
    localStorage.getItem = () => {
      throw new Error('boom');
    };
    expect(hasSeenTour('DOC1')).toBe(false);
    localStorage.getItem = original;
  });

  it('does not throw when localStorage.setItem throws', () => {
    const original = localStorage.setItem;
    localStorage.setItem = () => {
      throw new Error('boom');
    };
    expect(() => setHasSeenTour('DOC1', true)).not.toThrow();
    localStorage.setItem = original;
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/tour/tourSeenStorage.test.js`
Expected: FAIL — `Cannot find module '../../../src/features/editor/tour/tourSeenStorage.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/features/editor/tour/tourSeenStorage.js
const SEEN_KEY_PREFIX = 'xmleditor:tourSeen:';

export function hasSeenTour(docId) {
  if (!docId || typeof localStorage === 'undefined') return false;
  try {
    return localStorage.getItem(`${SEEN_KEY_PREFIX}${docId}`) === 'true';
  } catch {
    return false;
  }
}

export function setHasSeenTour(docId, seen = true) {
  if (!docId || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(`${SEEN_KEY_PREFIX}${docId}`, seen ? 'true' : 'false');
  } catch {
    // Quota exceeded or private-browsing restriction — silently no-op,
    // the tour just shows again next visit, never a hard failure.
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/tour/tourSeenStorage.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/tour/tourSeenStorage.js tests/unit/tour/tourSeenStorage.test.js
git commit -m "feat(tour): add tour-seen localStorage helpers"
```

---

### Task 2: `tourSteps.js`

**Files:**
- Create: `src/features/editor/tour/tourSteps.js`
- Test: `tests/unit/tour/tourSteps.test.js`

**Interfaces:**
- Consumes: nothing (leaf module — a static config array).
- Produces: `tourSteps: Array<{ target: string, title: string, content: string }>` — consumed by Task 3's `useGuidedTour` and Task 4's `<Joyride steps={tourSteps} />`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/tour/tourSteps.test.js
import { describe, it, expect } from 'vitest';
import { tourSteps } from '../../../src/features/editor/tour/tourSteps.js';

describe('tourSteps', () => {
  it('has at least one step', () => {
    expect(tourSteps.length).toBeGreaterThan(0);
  });

  it('every step has a data-tour target selector, a title, and non-empty content', () => {
    tourSteps.forEach((step) => {
      expect(step.target).toMatch(/^\[data-tour="[a-z-]+"\]$/);
      expect(typeof step.title).toBe('string');
      expect(step.title.length).toBeGreaterThan(0);
      expect(typeof step.content).toBe('string');
      expect(step.content.length).toBeGreaterThan(0);
    });
  });

  it('has no duplicate target selectors', () => {
    const targets = tourSteps.map((step) => step.target);
    expect(new Set(targets).size).toBe(targets.length);
  });

  it('covers the five real EditorPage regions', () => {
    const targets = tourSteps.map((step) => step.target);
    expect(targets).toEqual([
      '[data-tour="toc"]',
      '[data-tour="editor-canvas"]',
      '[data-tour="pdf-preview"]',
      '[data-tour="thumbnails"]',
      '[data-tour="footer"]'
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/tour/tourSteps.test.js`
Expected: FAIL — `Cannot find module '../../../src/features/editor/tour/tourSteps.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/features/editor/tour/tourSteps.js
/**
 * Step content adapted from impactweb's GuidedTour.InitalSteps where it
 * still applies to this app's real feature set. The legacy "File Saving...
 * autosaved every 30 seconds" copy for its #filesaving step is NOT carried
 * over here — this app has no save functionality yet (see the SaveModule
 * Core Flow spec). Once that ships, updating the "footer" step's content to
 * mention autosave is a one-line follow-up, not part of this plan.
 */
export const tourSteps = [
  {
    target: '[data-tour="toc"]',
    title: 'Navigation',
    content: 'Use this panel to jump between sections of the document.'
  },
  {
    target: '[data-tour="editor-canvas"]',
    title: 'Editor Section',
    content: 'Make your corrections here. Place the cursor where you want to edit and start typing.'
  },
  {
    target: '[data-tour="pdf-preview"]',
    title: 'Proof Section',
    content: 'This is a read-only preview of the typeset proof, provided for reference while you edit.'
  },
  {
    target: '[data-tour="thumbnails"]',
    title: 'Thumbnails',
    content: 'Use these thumbnails to jump to a specific page of the proof.'
  },
  {
    target: '[data-tour="footer"]',
    title: 'Document Controls',
    content: 'Document-level controls and status are shown here.'
  }
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/tour/tourSteps.test.js`
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/features/editor/tour/tourSteps.js tests/unit/tour/tourSteps.test.js
git commit -m "feat(tour): add tour step config"
```

---

### Task 3: `useGuidedTour` hook

**Files:**
- Modify: `package.json` (add `react-joyride`)
- Create: `src/features/editor/tour/useGuidedTour.js`
- Test: `tests/unit/tour/useGuidedTour.test.js`

**Interfaces:**
- Consumes:
  - `hasSeenTour(docId)`, `setHasSeenTour(docId, seen)` (Task 1)
  - `tourSteps` (Task 2)
  - `useModuleLifecycle(moduleId, moduleName)` from `src/store/useModuleLifecycle.js` (existing) — uses `open()`, `close()`, `recordStat(type, extra)`
  - `STATUS`, `EVENTS` named exports from `react-joyride`
- Produces: `useGuidedTour(docId): { run: boolean, stepIndex: number, steps: Array, startTour: (opts?: {force?: boolean}) => void, handleJoyrideCallback: (data: {status, action, index, type}) => void }` — consumed by Task 4's `EditorPage.jsx`.

- [ ] **Step 0: Install dependency**

```bash
npm install react-joyride
```

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/tour/useGuidedTour.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { STATUS, EVENTS } from 'react-joyride';
import modulesReducer from '../../../src/store/modulesSlice.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../../src/features/editor/tour/tourSeenStorage.js', () => ({
  hasSeenTour: vi.fn(),
  setHasSeenTour: vi.fn()
}));

import { hasSeenTour, setHasSeenTour } from '../../../src/features/editor/tour/tourSeenStorage.js';
import { useGuidedTour } from '../../../src/features/editor/tour/useGuidedTour.js';

function renderHookWithStore(hook, props) {
  const testStore = configureStore({ reducer: { modules: modulesReducer } });
  const container = document.createElement('div');
  const root = createRoot(container);
  let latest = null;

  function Harness({ hookProps }) {
    const value = hook(hookProps);
    useEffect(() => {
      latest = value;
    });
    return null;
  }

  act(() => {
    root.render(
      React.createElement(Provider, { store: testStore },
        React.createElement(Harness, { hookProps: props })
      )
    );
  });

  return {
    get result() {
      return latest;
    }
  };
}

describe('useGuidedTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not start the tour when hasSeenTour is true', () => {
    hasSeenTour.mockReturnValue(true);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    expect(harness.result.run).toBe(false);
  });

  it('starts the tour at step 0 when hasSeenTour is false', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    expect(harness.result.run).toBe(true);
    expect(harness.result.stepIndex).toBe(0);
  });

  it('startTour({ force: true }) bypasses hasSeenTour', () => {
    hasSeenTour.mockReturnValue(true);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour({ force: true });
    });

    expect(harness.result.run).toBe(true);
  });

  it('handleJoyrideCallback advances stepIndex on a step:after event', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.RUNNING,
        action: 'next',
        index: 0,
        type: EVENTS.STEP_AFTER
      });
    });

    expect(harness.result.stepIndex).toBe(1);
  });

  it('handleJoyrideCallback ends the tour and marks it seen on a terminal status', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.FINISHED,
        action: 'next',
        index: 4,
        type: EVENTS.TOUR_END
      });
    });

    expect(harness.result.run).toBe(false);
    expect(setHasSeenTour).toHaveBeenCalledWith('DOC1', true);
  });

  it('handleJoyrideCallback also ends the tour and marks it seen on SKIPPED status', () => {
    hasSeenTour.mockReturnValue(false);
    const harness = renderHookWithStore(useGuidedTour, 'DOC1');

    act(() => {
      harness.result.startTour();
    });

    act(() => {
      harness.result.handleJoyrideCallback({
        status: STATUS.SKIPPED,
        action: 'skip',
        index: 1,
        type: EVENTS.TOUR_END
      });
    });

    expect(harness.result.run).toBe(false);
    expect(setHasSeenTour).toHaveBeenCalledWith('DOC1', true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/tour/useGuidedTour.test.js`
Expected: FAIL — `Cannot find module '../../../src/features/editor/tour/useGuidedTour.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/features/editor/tour/useGuidedTour.js
import { useCallback, useState } from 'react';
import { STATUS, EVENTS } from 'react-joyride';
import { useModuleLifecycle } from '../../../store/useModuleLifecycle.js';
import { tourSteps } from './tourSteps.js';
import { hasSeenTour, setHasSeenTour } from './tourSeenStorage.js';

const TERMINAL_STATUSES = [STATUS.FINISHED, STATUS.SKIPPED];

/**
 * Wraps react-joyride's step/overlay mechanics with this app's own
 * analytics (useModuleLifecycle) and a per-document "seen" flag, replacing
 * legacy GuidedTour's bootstraptour integration + HandlingSessionStorage.
 */
export function useGuidedTour(docId) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const lifecycle = useModuleLifecycle('guidedTour', 'GuidedTour');

  const startTour = useCallback(({ force = false } = {}) => {
    if (!force && hasSeenTour(docId)) return;
    setStepIndex(0);
    setRun(true);
    lifecycle.open();
  }, [docId, lifecycle]);

  const handleJoyrideCallback = useCallback((data) => {
    const { status, action, index, type } = data;

    if (type === EVENTS.STEP_AFTER) {
      lifecycle.recordStat('buttonClicked', { buttonId: action });
      setStepIndex(index + 1);
    }

    if (TERMINAL_STATUSES.includes(status)) {
      setRun(false);
      lifecycle.close();
      setHasSeenTour(docId, true);
    }
  }, [docId, lifecycle]);

  return { run, stepIndex, steps: tourSteps, startTour, handleJoyrideCallback };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/tour/useGuidedTour.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/features/editor/tour/useGuidedTour.js tests/unit/tour/useGuidedTour.test.js
git commit -m "feat(tour): add useGuidedTour hook"
```

---

### Task 4: Wire the tour into `EditorPage.jsx`

**Files:**
- Modify: `src/features/editor/pages/EditorPage.jsx`

**Interfaces:**
- Consumes: `useGuidedTour(docId)` (Task 3), `Joyride` default export from `react-joyride` (already installed in Task 3).
- Produces: no new exports — this is the leaf consumer.

This task has no unit test of its own (a wiring change in a page component, same rationale as Editor Bootstrap Foundation's Task 5); it is verified with a build check plus the manual smoke steps below.

- [ ] **Step 1: Read the current file to confirm anchors**

Run: `Read src/features/editor/pages/EditorPage.jsx` — locate the Find blocks below by content (line numbers may have drifted since this plan was written).

- [ ] **Step 2: Add the import and hook call**

Find:

```js
import { useClientConfig } from '../../../services/editorConfig/useClientConfig.js';
import { useEditorContent } from '../../../services/editorConfig/useEditorContent.js';
```

Replace with:

```js
import { useClientConfig } from '../../../services/editorConfig/useClientConfig.js';
import { useEditorContent } from '../../../services/editorConfig/useEditorContent.js';
import Joyride from 'react-joyride';
import { useGuidedTour } from '../tour/useGuidedTour.js';
```

Find:

```js
  const editorContent = useEditorContent(sessionDocId);
  const isThreeColumnConfig = clientConfig.toggles.layoutMode === 'three-column';
```

Replace with:

```js
  const editorContent = useEditorContent(sessionDocId);
  const isThreeColumnConfig = clientConfig.toggles.layoutMode === 'three-column';
  const guidedTour = useGuidedTour(sessionDocId);
```

- [ ] **Step 3: Start the tour once content has loaded**

Find:

```js
  useEffect(() => {
    if (editorContent.content == null) return;
    setEditorData(editorContent.content);
    updateContent(editorContent.content);
    setIsDirty(false);
  }, [editorContent.content, setIsDirty, updateContent]);
```

Replace with:

```js
  useEffect(() => {
    if (editorContent.content == null) return;
    setEditorData(editorContent.content);
    updateContent(editorContent.content);
    setIsDirty(false);
  }, [editorContent.content, setIsDirty, updateContent]);

  useEffect(() => {
    if (editorContent.content == null) return;
    guidedTour.startTour();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorContent.content]);
```

(The `startTour` function is intentionally omitted from the dependency array — it's stable in practice via `useCallback`, and this effect must run exactly once when content first resolves, not re-fire if `guidedTour`'s reference identity changes for unrelated reasons.)

- [ ] **Step 4: Add `data-tour` attributes and render `<Joyride>`**

Find:

```js
      <main className="flex min-h-0 flex-1 overflow-hidden pb-16">
        {toggles.showToc && !isThreeColumnConfig && (
          <div className="w-72 flex-shrink-0 border-r border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <NavigationPanel />
            </Suspense>
          </div>
        )}

        <section className="flex min-w-0 flex-1 overflow-hidden">
          <div className="flex min-w-0 flex-1 justify-center overflow-y-auto bg-[#ece7de] px-3 py-4 md:px-6 md:py-6">
            <div className="w-full max-w-5xl rounded-sm border border-gray-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.10)]">
              {editorContent.error ? (
                <div className="flex h-[760px] flex-col items-center justify-center gap-2 text-sm text-red-600">
                  <p className="font-medium">Unable to load this document.</p>
                  <p className="text-gray-500">{editorContent.error.message}</p>
                </div>
              ) : ckeditorReady && !editorContent.loading && editorContent.content != null ? (
                <CKEditor
                  initData={editorData}
                  onChange={handleEditorChange}
                  onInstanceReady={handleEditorReady}
                  onInstanceDestroyed={handleEditorDestroyed}
                  config={editorConfig}
                />
              ) : (
                <div className="flex h-[760px] items-center justify-center text-sm text-gray-500">
                  Loading document…
                </div>
              )}
            </div>
          </div>

          {!isThreeColumnConfig && (
            <div className="hidden w-[32rem] flex-shrink-0 border-l border-gray-200 bg-white xl:block">
              <Suspense fallback={<PanelLoader />}>
                <PdfPreview />
              </Suspense>
            </div>
          )}
        </section>

        {toggles.showThumbnails && !isThreeColumnConfig && (
          <div className="w-[128px] flex-shrink-0 border-l border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <ThumbnailPanel />
            </Suspense>
          </div>
        )}
      </main>

      <EditorFooter />
      <ModuleManager />
    </div>
  );
}
```

Replace with:

```js
      <main className="flex min-h-0 flex-1 overflow-hidden pb-16">
        {toggles.showToc && !isThreeColumnConfig && (
          <div data-tour="toc" className="w-72 flex-shrink-0 border-r border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <NavigationPanel />
            </Suspense>
          </div>
        )}

        <section className="flex min-w-0 flex-1 overflow-hidden">
          <div data-tour="editor-canvas" className="flex min-w-0 flex-1 justify-center overflow-y-auto bg-[#ece7de] px-3 py-4 md:px-6 md:py-6">
            <div className="w-full max-w-5xl rounded-sm border border-gray-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.10)]">
              {editorContent.error ? (
                <div className="flex h-[760px] flex-col items-center justify-center gap-2 text-sm text-red-600">
                  <p className="font-medium">Unable to load this document.</p>
                  <p className="text-gray-500">{editorContent.error.message}</p>
                </div>
              ) : ckeditorReady && !editorContent.loading && editorContent.content != null ? (
                <CKEditor
                  initData={editorData}
                  onChange={handleEditorChange}
                  onInstanceReady={handleEditorReady}
                  onInstanceDestroyed={handleEditorDestroyed}
                  config={editorConfig}
                />
              ) : (
                <div className="flex h-[760px] items-center justify-center text-sm text-gray-500">
                  Loading document…
                </div>
              )}
            </div>
          </div>

          {!isThreeColumnConfig && (
            <div data-tour="pdf-preview" className="hidden w-[32rem] flex-shrink-0 border-l border-gray-200 bg-white xl:block">
              <Suspense fallback={<PanelLoader />}>
                <PdfPreview />
              </Suspense>
            </div>
          )}
        </section>

        {toggles.showThumbnails && !isThreeColumnConfig && (
          <div data-tour="thumbnails" className="w-[128px] flex-shrink-0 border-l border-gray-200 bg-white">
            <Suspense fallback={<PanelLoader />}>
              <ThumbnailPanel />
            </Suspense>
          </div>
        )}
      </main>

      <div data-tour="footer">
        <EditorFooter />
      </div>
      <ModuleManager />
      <Joyride
        steps={guidedTour.steps}
        run={guidedTour.run}
        stepIndex={guidedTour.stepIndex}
        callback={guidedTour.handleJoyrideCallback}
        continuous
        showProgress
        showSkipButton
      />
    </div>
  );
}
```

- [ ] **Step 5: Manual smoke verification**

1. Start the dev server: `npm run dev` (see `.claude/launch.json`, port 3000).
2. Confirm `npm run build` succeeds (no import errors from `react-joyride`).
3. In a browser, with a valid session/docId reaching `/editor` and a resolved document (per Editor Bootstrap Foundation's flow), confirm the tour auto-starts once on first visit for that `docId`, and does not restart on a page refresh (the `xmleditor:tourSeen:<docId>` `localStorage` key is set after finishing/skipping it).
4. Confirm no new console errors.

- [ ] **Step 6: Commit**

```bash
git add src/features/editor/pages/EditorPage.jsx
git commit -m "feat(editor): wire GuidedTour into EditorPage"
```

---

## Self-Review

**Spec coverage:**
- "Adopts `react-joyride`... thin custom wrapper feeding `useModuleLifecycle`" → Task 3.
- "Per-document localStorage seen-flag" → Task 1, keyed `xmleditor:tourSeen:<docId>` per the spec.
- "Step config targeting new `data-tour` selectors" → Task 2, matches Task 4's five new attributes exactly (`toc`, `editor-canvas`, `pdf-preview`, `thumbnails`, `footer`).
- "`startTour()` respects `hasSeenTour`; `startTour({force:true})` bypasses it" → Task 3, tested.
- "`handleJoyrideCallback` maps Joyride's lifecycle events... to `useModuleLifecycle` calls" → Task 3, tested for `STEP_AFTER` and both terminal statuses (`FINISHED`, `SKIPPED`).
- "Tour starts once content resolves, not over a loading placeholder" → Task 4, Step 3.
- Legacy `#filesaving`-step autosave copy explicitly NOT carried over → confirmed in Task 2's step content and its code comment.
- Explicitly Out of Scope items (custom pause/resume, custom backdrop/focus, step-duration analytics, a manual re-trigger UI) → none appear in any of the 4 tasks.

**Placeholder scan:** No "TBD"/"TODO" strings; every code block is complete and runnable.

**Type consistency:**
- `hasSeenTour(docId)`/`setHasSeenTour(docId, seen)` signatures match between Task 1's definition and Task 3's usage.
- `tourSteps` shape (`{target, title, content}`) matches between Task 2's definition, Task 3's re-export as `steps`, and Task 4's `<Joyride steps={guidedTour.steps} />`.
- `useGuidedTour(docId)` return shape (`{run, stepIndex, steps, startTour, handleJoyrideCallback}`) matches between Task 3's definition, its own tests, and Task 4's destructured usage (`guidedTour.run`, `.stepIndex`, `.steps`, `.startTour`, `.handleJoyrideCallback`).
- `data-tour` values (`toc`, `editor-canvas`, `pdf-preview`, `thumbnails`, `footer`) are identical across Task 2's `tourSteps.js` targets and Task 4's `EditorPage.jsx` attributes.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-06-guided-tour.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
