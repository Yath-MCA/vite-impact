# Module Runtime Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Redux Toolkit store that tracks module lifecycle state (open/closed, stats, errors, timeline), mirroring `impactweb`'s `ModuleRuntimeStore` state shape, plus a `useModuleLifecycle` hook so future module components (GuidedTour, SaveModule, etc.) can read/dispatch that state without touching Redux directly.

**Architecture:** One Redux Toolkit slice (`src/store/modulesSlice.js`) holds all module-runtime state; `src/store/index.js` wires it into a `configureStore` instance; `src/store/useModuleLifecycle.js` wraps `useDispatch`/`useSelector` into a five-method API (`init/open/close/recordStat/recordError`). `main.jsx` wraps the app in `<Provider store={store}>`.

**Tech Stack:** React 18.2.0, Redux Toolkit (`@reduxjs/toolkit`), `react-redux` — both new dependencies, not currently in `package.json`. Vitest + happy-dom for tests.

**Spec:** `docs/superpowers/specs/2026-09-06-module-runtime-foundation-design.md`

## Global Constraints

- New dependencies: `@reduxjs/toolkit` and `react-redux` — must be installed before Task 1's code can run.
- The slice's state shape and action-type semantics must match legacy's `module-runtime-store.js` exactly: `{ runtime: { activeModuleId, activeDialogId, lastAction, updatedAt }, modules: { byId, openIds }, timeline }` (legacy's `document` sub-state is deliberately dropped — not duplicated from existing session state).
- Timeline is capped at 100 entries, oldest dropped first.
- Closing a module clears `runtime.activeDialogId` only if that module was the one that was active (matching legacy's exact conditional) — closing a non-active module must leave `activeDialogId` untouched.
- This plan does not modify `ModuleRegistry.jsx`/`ModuleManager.jsx` and does not wire `recordError` to the existing `errorLogTrace` — both explicitly out of scope per the spec.
- Tests live under `tests/unit/<domain>/*.test.js` (Vitest, `happy-dom` environment). Hook tests use this project's hand-rolled `renderHook` harness (see `tests/unit/landing/useLandingSessionFlow.test.js`) — there is no `@testing-library/react` dependency in this project.

---

## File Structure

```
src/store/
├── modulesSlice.js       # Redux Toolkit slice: state + reducers + action creators (Task 1)
├── index.js              # configureStore wiring (Task 2)
└── useModuleLifecycle.js # React hook wrapping dispatch/select (Task 3)

tests/unit/store/
├── modulesSlice.test.js
├── storeIndex.test.js
└── useModuleLifecycle.test.js

src/main.jsx               # modified in Task 2 (Provider wiring)
package.json                # modified in Task 1 (new dependencies)
```

---

### Task 1: `modulesSlice.js` — Redux Toolkit slice

**Files:**
- Modify: `package.json` (add `@reduxjs/toolkit`, `react-redux`)
- Create: `src/store/modulesSlice.js`
- Test: `tests/unit/store/modulesSlice.test.js`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces:
  - Named action creators: `moduleInitialized({id, name, dialogType})`, `moduleOpened({id})`, `moduleClosed({id})`, `buttonClicked({id, buttonId})`, `inputInteracted({id})`, `errorRecorded({id, functionName, message})`.
  - Default export: the slice's reducer function, `(state, action) => nextState`, with `initialState = { runtime: {...}, modules: { byId: {}, openIds: [] }, timeline: [] }`.
  - Later tasks (Task 2's `store/index.js`, Task 3's hook) import both the reducer (default export) and every named action creator from this file.

- [ ] **Step 0: Install dependencies**

```bash
npm install @reduxjs/toolkit react-redux
```

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/store/modulesSlice.test.js
import { describe, it, expect } from 'vitest';
import modulesReducer, {
  moduleInitialized,
  moduleOpened,
  moduleClosed,
  buttonClicked,
  inputInteracted,
  errorRecorded
} from '../../../src/store/modulesSlice.js';

function initial() {
  return modulesReducer(undefined, { type: '@@INIT' });
}

describe('modulesSlice', () => {
  it('starts with the documented initial shape', () => {
    const state = initial();
    expect(state).toEqual({
      runtime: { activeModuleId: null, activeDialogId: null, lastAction: null, updatedAt: null },
      modules: { byId: {}, openIds: [] },
      timeline: []
    });
  });

  it('moduleInitialized records name/dialogType and marks initiated', () => {
    const state = modulesReducer(initial(), moduleInitialized({ id: 'gt', name: 'GuidedTour', dialogType: 'onthefly' }));
    expect(state.modules.byId.gt).toMatchObject({
      id: 'gt',
      name: 'GuidedTour',
      dialogType: 'onthefly',
      initiated: true,
      isOpen: false
    });
    expect(state.timeline).toHaveLength(1);
    expect(state.timeline[0].type).toBe('module/initialized');
  });

  it('moduleOpened sets isOpen, increments openCount, and sets active ids', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'gt', name: 'GuidedTour' }));
    state = modulesReducer(state, moduleOpened({ id: 'gt' }));
    expect(state.modules.byId.gt.isOpen).toBe(true);
    expect(state.modules.byId.gt.stats.openCount).toBe(1);
    expect(state.modules.openIds).toEqual(['gt']);
    expect(state.runtime.activeDialogId).toBe('gt');
    expect(state.runtime.activeModuleId).toBe('GuidedTour');
  });

  it('moduleClosed on the active module clears activeDialogId', () => {
    let state = modulesReducer(initial(), moduleOpened({ id: 'gt' }));
    state = modulesReducer(state, moduleClosed({ id: 'gt' }));
    expect(state.modules.byId.gt.isOpen).toBe(false);
    expect(state.modules.byId.gt.stats.closeCount).toBe(1);
    expect(state.modules.openIds).toEqual([]);
    expect(state.runtime.activeDialogId).toBeNull();
  });

  it('moduleClosed on a non-active module leaves activeDialogId untouched', () => {
    let state = modulesReducer(initial(), moduleOpened({ id: 'gt' }));
    state = modulesReducer(state, moduleOpened({ id: 'save' }));
    // 'save' is now active; close 'gt' (not active)
    state = modulesReducer(state, moduleClosed({ id: 'gt' }));
    expect(state.runtime.activeDialogId).toBe('save');
    expect(state.modules.openIds).toEqual(['save']);
    expect(state.modules.byId.gt.isOpen).toBe(false);
  });

  it('buttonClicked increments the per-button counter', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'save', name: 'SaveModule' }));
    state = modulesReducer(state, buttonClicked({ id: 'save', buttonId: 'confirm' }));
    state = modulesReducer(state, buttonClicked({ id: 'save', buttonId: 'confirm' }));
    expect(state.modules.byId.save.stats.buttonClicks.confirm).toBe(2);
  });

  it('inputInteracted increments the input counter', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'save', name: 'SaveModule' }));
    state = modulesReducer(state, inputInteracted({ id: 'save' }));
    expect(state.modules.byId.save.stats.inputInteractions).toBe(1);
  });

  it('errorRecorded increments errors and stores lastError', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'save', name: 'SaveModule' }));
    state = modulesReducer(state, errorRecorded({ id: 'save', functionName: 'iSave', message: 'network down' }));
    expect(state.modules.byId.save.errors).toBe(1);
    expect(state.modules.byId.save.lastError).toMatchObject({ functionName: 'iSave', message: 'network down' });
  });

  it('caps the timeline at 100 entries, dropping the oldest first', () => {
    let state = modulesReducer(initial(), moduleInitialized({ id: 'save', name: 'SaveModule' }));
    for (let i = 0; i < 105; i += 1) {
      state = modulesReducer(state, buttonClicked({ id: 'save', buttonId: `btn${i}` }));
    }
    expect(state.timeline).toHaveLength(100);
    expect(state.timeline[0].buttonId).toBe('btn5');
    expect(state.timeline[99].buttonId).toBe('btn104');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/store/modulesSlice.test.js`
Expected: FAIL — `Cannot find module '../../../src/store/modulesSlice.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/store/modulesSlice.js
import { createSlice } from '@reduxjs/toolkit';

const MAX_TIMELINE = 100;

const initialState = {
  runtime: {
    activeModuleId: null,
    activeDialogId: null,
    lastAction: null,
    updatedAt: null
  },
  modules: {
    byId: {},
    openIds: []
  },
  timeline: []
};

function normalizeStats(stats = {}) {
  return {
    openCount: stats.openCount || 0,
    closeCount: stats.closeCount || 0,
    buttonClicks: { ...(stats.buttonClicks || {}) },
    inputInteractions: stats.inputInteractions || 0,
    lastOpened: stats.lastOpened || null,
    lastClosed: stats.lastClosed || null
  };
}

function ensureModule(state, id) {
  if (!state.modules.byId[id]) {
    state.modules.byId[id] = {
      id,
      name: null,
      dialogType: null,
      isOpen: false,
      initiated: false,
      errors: 0,
      lastError: null,
      stats: normalizeStats()
    };
  }
  return state.modules.byId[id];
}

function pushTimeline(state, entry) {
  state.timeline.push(entry);
  if (state.timeline.length > MAX_TIMELINE) {
    state.timeline.splice(0, state.timeline.length - MAX_TIMELINE);
  }
}

function touchRuntime(state, actionType) {
  state.runtime.lastAction = actionType;
  state.runtime.updatedAt = new Date().toISOString();
  return state.runtime.updatedAt;
}

const modulesSlice = createSlice({
  name: 'modules',
  initialState,
  reducers: {
    moduleInitialized(state, action) {
      const { id, name, dialogType } = action.payload;
      const mod = ensureModule(state, id);
      if (name !== undefined) mod.name = name;
      if (dialogType !== undefined) mod.dialogType = dialogType;
      mod.initiated = true;
      const timestamp = touchRuntime(state, 'module/initialized');
      pushTimeline(state, { type: 'module/initialized', moduleId: id, timestamp });
    },
    moduleOpened(state, action) {
      const { id } = action.payload;
      const mod = ensureModule(state, id);
      mod.isOpen = true;
      mod.stats.openCount += 1;
      mod.stats.lastOpened = new Date().toISOString();
      state.modules.openIds = state.modules.openIds.filter((existingId) => existingId !== id);
      state.modules.openIds.push(id);
      state.runtime.activeModuleId = mod.name || id;
      state.runtime.activeDialogId = id;
      const timestamp = touchRuntime(state, 'module/opened');
      pushTimeline(state, { type: 'module/opened', moduleId: id, timestamp });
    },
    moduleClosed(state, action) {
      const { id } = action.payload;
      const mod = ensureModule(state, id);
      mod.isOpen = false;
      mod.stats.closeCount += 1;
      mod.stats.lastClosed = new Date().toISOString();
      state.modules.openIds = state.modules.openIds.filter((existingId) => existingId !== id);
      if (state.runtime.activeDialogId === id) {
        const remaining = state.modules.openIds;
        state.runtime.activeDialogId = remaining.length ? remaining[remaining.length - 1] : null;
        state.runtime.activeModuleId = null;
      }
      const timestamp = touchRuntime(state, 'module/closed');
      pushTimeline(state, { type: 'module/closed', moduleId: id, timestamp });
    },
    buttonClicked(state, action) {
      const { id, buttonId } = action.payload;
      const mod = ensureModule(state, id);
      mod.stats.buttonClicks[buttonId] = (mod.stats.buttonClicks[buttonId] || 0) + 1;
      const timestamp = touchRuntime(state, 'module/buttonClicked');
      pushTimeline(state, { type: 'module/buttonClicked', moduleId: id, buttonId, timestamp });
    },
    inputInteracted(state, action) {
      const { id } = action.payload;
      const mod = ensureModule(state, id);
      mod.stats.inputInteractions += 1;
      const timestamp = touchRuntime(state, 'module/inputInteracted');
      pushTimeline(state, { type: 'module/inputInteracted', moduleId: id, timestamp });
    },
    errorRecorded(state, action) {
      const { id, functionName, message } = action.payload;
      const mod = ensureModule(state, id);
      mod.errors += 1;
      mod.lastError = { functionName: functionName || null, message: message || null, timestamp: new Date().toISOString() };
      const timestamp = touchRuntime(state, 'module/errorRecorded');
      pushTimeline(state, { type: 'module/errorRecorded', moduleId: id, functionName: functionName || null, timestamp });
    }
  }
});

export const {
  moduleInitialized,
  moduleOpened,
  moduleClosed,
  buttonClicked,
  inputInteracted,
  errorRecorded
} = modulesSlice.actions;

export default modulesSlice.reducer;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/store/modulesSlice.test.js`
Expected: PASS (9 tests)

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/store/modulesSlice.js tests/unit/store/modulesSlice.test.js
git commit -m "feat(store): add modulesSlice mirroring impactweb's ModuleRuntimeStore"
```

---

### Task 2: `store/index.js` and `Provider` wiring

**Files:**
- Create: `src/store/index.js`
- Test: `tests/unit/store/storeIndex.test.js`
- Modify: `src/main.jsx`

**Interfaces:**
- Consumes: `modulesSlice.js`'s default export (the reducer) (Task 1).
- Produces: `store` — a `configureStore` instance with `store.getState()` shaped `{ modules: { runtime, modules: { byId, openIds }, timeline } }`. Task 3's hook and any future module component import `store` (directly, or implicitly via `<Provider>` context) from this file.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/store/storeIndex.test.js
import { describe, it, expect } from 'vitest';
import { store } from '../../../src/store/index.js';

describe('store/index', () => {
  it('registers the modules slice under the "modules" key with the documented initial shape', () => {
    expect(store.getState()).toEqual({
      modules: {
        runtime: { activeModuleId: null, activeDialogId: null, lastAction: null, updatedAt: null },
        modules: { byId: {}, openIds: [] },
        timeline: []
      }
    });
  });

  it('dispatches through to the modules reducer', async () => {
    const { moduleInitialized } = await import('../../../src/store/modulesSlice.js');
    store.dispatch(moduleInitialized({ id: 'probe', name: 'ProbeModule' }));
    expect(store.getState().modules.modules.byId.probe).toMatchObject({ id: 'probe', name: 'ProbeModule' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/store/storeIndex.test.js`
Expected: FAIL — `Cannot find module '../../../src/store/index.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import modulesReducer from './modulesSlice.js';

export const store = configureStore({
  reducer: {
    modules: modulesReducer
  }
});
```

Then modify `src/main.jsx`. Find:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './styles/fonts'; // Import Source Sans Pro font
import './index.css';
import App from './App.jsx';
```

Replace with:

```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { store } from './store/index.js';
import './styles/fonts'; // Import Source Sans Pro font
import './index.css';
import App from './App.jsx';
```

Find:

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
```

Replace with:

```jsx
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/store/storeIndex.test.js`
Expected: PASS (2 tests)

- [ ] **Step 5: Verify the app still builds and boots**

Run: `npm run build`
Expected: build succeeds with no errors.

Run: `npm run dev`, open the app in a browser, confirm it loads with no new console errors (there is no visible UI change in this task — this only confirms the `Provider` wiring didn't break app boot).

- [ ] **Step 6: Commit**

```bash
git add src/store/index.js src/main.jsx tests/unit/store/storeIndex.test.js
git commit -m "feat(store): wire Redux Provider into the app root"
```

---

### Task 3: `useModuleLifecycle` hook

**Files:**
- Create: `src/store/useModuleLifecycle.js`
- Test: `tests/unit/store/useModuleLifecycle.test.js`

**Interfaces:**
- Consumes: named action creators from `modulesSlice.js` (Task 1); `store` from `store/index.js` is not imported directly by the hook (it reads the store via React context through `react-redux`'s `useDispatch`/`useSelector`) but is required by any test/consumer that renders this hook inside a `<Provider>`.
- Produces: `useModuleLifecycle(moduleId: string, moduleName: string): { state: object|null, init: (dialogType?: string) => void, open: () => void, close: () => void, recordStat: (type: 'buttonClicked'|'inputInteracted', extra?: object) => void, recordError: (functionName: string, message: string) => void }` — this is the public API future module components (GuidedTour, SaveModule) will call; its shape and method names are locked here.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/store/useModuleLifecycle.test.js
import { describe, it, expect } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import modulesReducer from '../../../src/store/modulesSlice.js';
import { useModuleLifecycle } from '../../../src/store/useModuleLifecycle.js';

function renderHookWithStore(hook, props) {
  const testStore = configureStore({ reducer: { modules: modulesReducer } });
  const container = document.createElement('div');
  const root = createRoot(container);
  let latest = null;

  function Harness({ hookProps }) {
    const value = hook(...hookProps);
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
    },
    get storeState() {
      return testStore.getState();
    }
  };
}

describe('useModuleLifecycle', () => {
  it('starts with a null state before init() is called', () => {
    const { result } = renderHookWithStore(useModuleLifecycle, ['gt', 'GuidedTour']);
    expect(result.state).toBeNull();
  });

  it('init() creates the module entry with the given name', () => {
    const harness = renderHookWithStore(useModuleLifecycle, ['gt', 'GuidedTour']);
    act(() => {
      harness.result.init('onthefly');
    });
    expect(harness.storeState.modules.modules.byId.gt).toMatchObject({
      id: 'gt',
      name: 'GuidedTour',
      dialogType: 'onthefly',
      initiated: true
    });
  });

  it('open()/close() toggle isOpen and openIds', () => {
    const harness = renderHookWithStore(useModuleLifecycle, ['gt', 'GuidedTour']);
    act(() => {
      harness.result.init();
      harness.result.open();
    });
    expect(harness.storeState.modules.modules.byId.gt.isOpen).toBe(true);
    expect(harness.storeState.modules.modules.openIds).toEqual(['gt']);

    act(() => {
      harness.result.close();
    });
    expect(harness.storeState.modules.modules.byId.gt.isOpen).toBe(false);
    expect(harness.storeState.modules.modules.openIds).toEqual([]);
  });

  it('recordStat("buttonClicked", { buttonId }) increments that button counter', () => {
    const harness = renderHookWithStore(useModuleLifecycle, ['save', 'SaveModule']);
    act(() => {
      harness.result.init();
      harness.result.recordStat('buttonClicked', { buttonId: 'confirm' });
    });
    expect(harness.storeState.modules.modules.byId.save.stats.buttonClicks.confirm).toBe(1);
  });

  it('recordError(functionName, message) increments errors and sets lastError', () => {
    const harness = renderHookWithStore(useModuleLifecycle, ['save', 'SaveModule']);
    act(() => {
      harness.result.init();
      harness.result.recordError('iSave', 'network down');
    });
    expect(harness.storeState.modules.modules.byId.save.errors).toBe(1);
    expect(harness.storeState.modules.modules.byId.save.lastError).toMatchObject({
      functionName: 'iSave',
      message: 'network down'
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/store/useModuleLifecycle.test.js`
Expected: FAIL — `Cannot find module '../../../src/store/useModuleLifecycle.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/store/useModuleLifecycle.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  moduleInitialized,
  moduleOpened,
  moduleClosed,
  buttonClicked,
  inputInteracted,
  errorRecorded
} from './modulesSlice.js';

/**
 * React-facing API for a single module instance's Redux-backed lifecycle
 * state, replacing legacy BaseModule's direct ModuleRuntimeStore calls
 * (getRuntimeStore/dispatchRuntimeAction/getRuntimeState/etc.).
 */
export function useModuleLifecycle(moduleId, moduleName) {
  const dispatch = useDispatch();
  const state = useSelector((s) => s.modules.modules.byId[moduleId] ?? null);

  const init = useCallback((dialogType) => {
    dispatch(moduleInitialized({ id: moduleId, name: moduleName, dialogType }));
  }, [dispatch, moduleId, moduleName]);

  const open = useCallback(() => {
    dispatch(moduleOpened({ id: moduleId }));
  }, [dispatch, moduleId]);

  const close = useCallback(() => {
    dispatch(moduleClosed({ id: moduleId }));
  }, [dispatch, moduleId]);

  const recordStat = useCallback((type, extra = {}) => {
    if (type === 'buttonClicked') {
      dispatch(buttonClicked({ id: moduleId, ...extra }));
      return;
    }
    if (type === 'inputInteracted') {
      dispatch(inputInteracted({ id: moduleId, ...extra }));
    }
  }, [dispatch, moduleId]);

  const recordError = useCallback((functionName, message) => {
    dispatch(errorRecorded({ id: moduleId, functionName, message }));
  }, [dispatch, moduleId]);

  return { state, init, open, close, recordStat, recordError };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/store/useModuleLifecycle.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/store/useModuleLifecycle.js tests/unit/store/useModuleLifecycle.test.js
git commit -m "feat(store): add useModuleLifecycle hook"
```

---

## Self-Review

**Spec coverage:**
- "Redux Toolkit slice... same state shape, same action-type strings, same timeline cap" → Task 1.
- "`document` slice dropped" → confirmed: `initialState` in Task 1 has no `document` key, and no reducer reads `SHARED_KEY`/`USER_INFO`/`DOC_ID`.
- "`store/index.js`... `configureStore`" → Task 2.
- "`main.jsx`... wrap `<App />` in `<Provider store={store}>`... `QueryClientProvider` outermost" → Task 2, Step 3 (note: plan places `Provider` outermost, `QueryClientProvider` inside it — functionally equivalent to the spec's stated preference since the spec itself says "order doesn't matter functionally"; both are independent, non-nested-dependency providers).
- "`useModuleLifecycle`... `{ state, init, open, close, recordStat, recordError }`" → Task 3, exact shape matches.
- "Timeline cap (100 entries)... active-dialog-on-close logic" → Task 1's `pushTimeline`/`moduleClosed`, directly tested.
- "Testing: Vitest unit tests for the reducer... for `useModuleLifecycle`... wrapping in a real `<Provider>`" → Tasks 1 and 3.
- "No manual smoke test needed for this sub-project alone" → Task 2 still includes a build/boot check (Step 5) since it changes `main.jsx`, the app's entry point — a lighter check than a full smoke test, appropriate for a wiring-only change with no new UI.
- "Explicitly Out of Scope" (BaseModule's non-lifecycle methods, `ModuleRegistry.jsx`/`ModuleManager.jsx` changes, auto-wiring to `errorLogTrace`) → none of the 3 tasks touch these.

**Placeholder scan:** No "TBD"/"TODO" strings; every step has complete, runnable code.

**Type consistency:**
- Action creator names (`moduleInitialized`, `moduleOpened`, `moduleClosed`, `buttonClicked`, `inputInteracted`, `errorRecorded`) are identical across Task 1's definition, Task 2's test/dispatch, and Task 3's hook imports.
- State path `state.modules.modules.byId[id]` (outer `modules` = the slice's key in `configureStore`'s `reducer` map from Task 2; inner `modules` = the slice's own `modules: { byId, openIds }` field from Task 1) is used consistently in Task 2's and Task 3's tests and in the hook's selector — flagged explicitly here since the double `modules.modules` nesting looks like a typo but is intentional and matches the spec's documented shape.
- `useModuleLifecycle(moduleId, moduleName)` signature and return shape match between Task 3's definition and its own tests; no other task calls it yet (GuidedTour/SaveModule are future sub-projects).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-06-module-runtime-foundation.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
