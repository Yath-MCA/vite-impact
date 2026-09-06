# SaveModule Core Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `saveDocument` service function and a `useSaveModule` hook implementing the core save flow (session-validation-before-save → basic content validation → save request → autosave scheduling), with no new UI wiring in this plan.

**Architecture:** `src/services/save/saveDocument.js` is a plain async function posting to the existing `FORM_TO_FILE_FIELD` API endpoint. `src/services/save/useSaveModule.js` is a React hook composing three pieces of existing infrastructure — `useEditor()` (dirty state/content), `useModuleLifecycle()` (lifecycle/error tracking from Module Runtime Foundation), and `claimValidateTab()` (session-tab-ownership check from Editor Bootstrap Foundation's session infra) — around `saveDocument`.

**Tech Stack:** React (hooks), no new dependencies. Vitest + happy-dom for tests, this project's hand-rolled `renderHook` pattern.

**Spec:** `docs/superpowers/specs/2026-09-06-save-module-core-flow-design.md`

## Global Constraints

- No new npm dependencies.
- `saveDocument.js` never throws past its own boundary — always returns `{ ok, message }`.
- A stale/lost session (per `claimValidateTab`) is caught before any network call, shows the existing `EditorMessageKey.EXPIRED_SESSION_ALERT` message, and returns `{ ok: false, reason: 'stale_session' }` without attempting a save.
- Empty/whitespace-only content is caught before any network call, returns `{ ok: false, reason: 'empty_content' }` without a network call.
- Reuses existing infrastructure rather than reimplementing it: `claimValidateTab`/`getValidateAccessKey` (`src/services/session/`), `useEditor()` (`src/context/EditorContext.jsx`), `useModuleLifecycle` (`src/store/useModuleLifecycle.js`), `showEditorMessage`/`EditorMessageKey` (`src/features/editor/messages/editorMessages.js`), `apiService.makeRequest`/`API_ENDPOINTS.FORM_TO_FILE_FIELD` (`src/services/api/apiService.js`).
- Tests live under `tests/unit/<domain>/*.test.js` (Vitest, `happy-dom` environment). Hook tests use this project's hand-rolled `renderHook` harness, accessing returned state via a live property (`harness.result.xxx`), **never** via `const { result } = renderHook(...)` destructuring — that pattern silently freezes state at its initial value (a real bug found and fixed during the Editor Bootstrap Foundation plan).
- This plan does not add any UI (Save button, spinner, toast) — wiring `useSaveModule` into `EditorPage.jsx` is a future, separate change.

---

## File Structure

```
src/services/save/
├── saveDocument.js       # POST to FORM_TO_FILE_FIELD (Task 1)
└── useSaveModule.js      # session guard → validate → save → state (Task 2)

tests/unit/save/
├── saveDocument.test.js
└── useSaveModule.test.js
```

---

### Task 1: `saveDocument.js`

**Files:**
- Create: `src/services/save/saveDocument.js`
- Test: `tests/unit/save/saveDocument.test.js`

**Interfaces:**
- Consumes: `apiService` (default/named export) and `API_ENDPOINTS` from `src/services/api/apiService.js` (existing).
- Produces: `saveDocument({ docId, content }): Promise<{ ok: boolean, message: string }>` — consumed by Task 2's `useSaveModule`.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/save/saveDocument.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: { makeRequest: vi.fn() },
  API_ENDPOINTS: { FORM_TO_FILE_FIELD: '/api/formfieldtofile' }
}));

import { apiService } from '../../../src/services/api/apiService.js';
import { saveDocument } from '../../../src/services/save/saveDocument.js';

describe('saveDocument', () => {
  beforeEach(() => {
    apiService.makeRequest.mockReset();
  });

  it('returns ok:true when the request succeeds', async () => {
    apiService.makeRequest.mockResolvedValue({ status: 'success' });

    const result = await saveDocument({ docId: 'DOC1', content: '<p>hi</p>' });

    expect(result).toEqual({ ok: true, message: 'Saved' });
    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/formfieldtofile',
      { docid: 'DOC1', content: '<p>hi</p>' },
      { method: 'POST' }
    );
  });

  it('returns ok:false with the error message when the request throws', async () => {
    apiService.makeRequest.mockRejectedValue(new Error('network down'));

    const result = await saveDocument({ docId: 'DOC1', content: '<p>hi</p>' });

    expect(result).toEqual({ ok: false, message: 'network down' });
  });

  it('returns a generic message when the thrown error has no message', async () => {
    apiService.makeRequest.mockRejectedValue({});

    const result = await saveDocument({ docId: 'DOC1', content: '<p>hi</p>' });

    expect(result).toEqual({ ok: false, message: 'Save failed' });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/save/saveDocument.test.js`
Expected: FAIL — `Cannot find module '../../../src/services/save/saveDocument.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/services/save/saveDocument.js
import { apiService, API_ENDPOINTS } from '../api/apiService.js';

/**
 * Posts document content to the existing FORM_TO_FILE_FIELD endpoint
 * (impactweb's SaveModule.performOnlineSave equivalent). Never throws —
 * always resolves to { ok, message } so callers don't need try/catch.
 */
export async function saveDocument({ docId, content }) {
  try {
    await apiService.makeRequest(
      API_ENDPOINTS.FORM_TO_FILE_FIELD,
      { docid: docId, content },
      { method: 'POST' }
    );
    return { ok: true, message: 'Saved' };
  } catch (err) {
    return { ok: false, message: (err && err.message) || 'Save failed' };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/save/saveDocument.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/save/saveDocument.js tests/unit/save/saveDocument.test.js
git commit -m "feat(save): add saveDocument service function"
```

---

### Task 2: `useSaveModule` hook

**Files:**
- Create: `src/services/save/useSaveModule.js`
- Test: `tests/unit/save/useSaveModule.test.js`

**Interfaces:**
- Consumes:
  - `saveDocument({ docId, content })` (Task 1)
  - `useEditor()` from `src/context/EditorContext.jsx` (existing) — uses `content`, `isDirty`, `setIsDirty`
  - `useModuleLifecycle(moduleId, moduleName)` from `src/store/useModuleLifecycle.js` (existing) — uses `recordStat(type, extra)`, `recordError(functionName, message)`
  - `claimValidateTab({ docId, key })` from `src/services/session/tabPresence.js` (existing)
  - `getValidateAccessKey()` from `src/services/session/sessionStorage.js` (existing)
  - `showEditorMessage(key)`, `EditorMessageKey` from `src/features/editor/messages/editorMessages.js` (existing) — uses `EditorMessageKey.EXPIRED_SESSION_ALERT`
- Produces: `useSaveModule(docId): { saveState: 'idle'|'validating'|'saving'|'saved'|'error', save: (opts?: {autoSave?: boolean}) => Promise<{ok, reason?, message?}>, startAutoSave: (intervalMs?: number) => void, stopAutoSave: () => void, isDirty: boolean }` — this is the public API a future Save button / autosave wiring will call.

- [ ] **Step 1: Write the failing test**

```js
// tests/unit/save/useSaveModule.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import modulesReducer from '../../../src/store/modulesSlice.js';
import { EditorProvider, useEditor } from '../../../src/context/EditorContext.jsx';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../../../src/services/session/tabPresence.js', () => ({
  claimValidateTab: vi.fn()
}));
vi.mock('../../../src/services/session/sessionStorage.js', () => ({
  getValidateAccessKey: vi.fn(() => 'key123')
}));
vi.mock('../../../src/features/editor/messages/editorMessages.js', () => ({
  showEditorMessage: vi.fn(() => Promise.resolve({ isConfirmed: true })),
  EditorMessageKey: { EXPIRED_SESSION_ALERT: 'EXPIRED_SESSION_ALERT' }
}));
vi.mock('../../../src/services/save/saveDocument.js', () => ({
  saveDocument: vi.fn()
}));

import { claimValidateTab } from '../../../src/services/session/tabPresence.js';
import { showEditorMessage } from '../../../src/features/editor/messages/editorMessages.js';
import { saveDocument } from '../../../src/services/save/saveDocument.js';
import { useSaveModule } from '../../../src/services/save/useSaveModule.js';

function renderHookWithProviders(hook, props) {
  const testStore = configureStore({ reducer: { modules: modulesReducer } });
  const container = document.createElement('div');
  const root = createRoot(container);
  let latest = null;
  let editorApi = null;

  function Harness({ hookProps }) {
    editorApi = useEditor();
    const value = hook(hookProps);
    useEffect(() => {
      latest = value;
    });
    return null;
  }

  act(() => {
    root.render(
      React.createElement(Provider, { store: testStore },
        React.createElement(EditorProvider, null,
          React.createElement(Harness, { hookProps: props })
        )
      )
    );
  });

  return {
    get result() {
      return latest;
    },
    get editor() {
      return editorApi;
    }
  };
}

describe('useSaveModule', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns stale_session and shows the expired-session alert when claimValidateTab fails, without saving', async () => {
    claimValidateTab.mockResolvedValue({ ok: false });
    const harness = renderHookWithProviders(useSaveModule, 'DOC1');

    let saveResult;
    await act(async () => {
      saveResult = await harness.result.save();
    });

    expect(saveResult).toEqual({ ok: false, reason: 'stale_session' });
    expect(showEditorMessage).toHaveBeenCalledWith('EXPIRED_SESSION_ALERT');
    expect(saveDocument).not.toHaveBeenCalled();
    expect(harness.result.saveState).toBe('error');
  });

  it('returns empty_content when editor content is blank, without saving', async () => {
    claimValidateTab.mockResolvedValue({ ok: true });
    const harness = renderHookWithProviders(useSaveModule, 'DOC1');

    let saveResult;
    await act(async () => {
      saveResult = await harness.result.save();
    });

    expect(saveResult).toEqual({ ok: false, reason: 'empty_content' });
    expect(saveDocument).not.toHaveBeenCalled();
  });

  it('saves successfully, clears isDirty, and sets saveState to saved', async () => {
    claimValidateTab.mockResolvedValue({ ok: true });
    saveDocument.mockResolvedValue({ ok: true, message: 'Saved' });

    const harness = renderHookWithProviders(useSaveModule, 'DOC1');

    act(() => {
      harness.editor.updateContent('<p>hello</p>');
      harness.editor.setIsDirty(true);
    });

    let saveResult;
    await act(async () => {
      saveResult = await harness.result.save();
    });

    expect(saveResult).toEqual({ ok: true });
    expect(harness.result.saveState).toBe('saved');
    expect(harness.editor.isDirty).toBe(false);
  });

  it('records an error and sets saveState to error when the save request fails', async () => {
    claimValidateTab.mockResolvedValue({ ok: true });
    saveDocument.mockResolvedValue({ ok: false, message: 'network down' });

    const harness = renderHookWithProviders(useSaveModule, 'DOC1');
    act(() => {
      harness.editor.updateContent('<p>hello</p>');
    });

    let saveResult;
    await act(async () => {
      saveResult = await harness.result.save();
    });

    expect(saveResult).toEqual({ ok: false, reason: 'save_failed', message: 'network down' });
    expect(harness.result.saveState).toBe('error');
  });

  it('startAutoSave calls save on an interval only while dirty, stopAutoSave stops it', async () => {
    vi.useFakeTimers();
    claimValidateTab.mockResolvedValue({ ok: true });
    saveDocument.mockResolvedValue({ ok: true, message: 'Saved' });

    const harness = renderHookWithProviders(useSaveModule, 'DOC1');
    act(() => {
      harness.editor.updateContent('<p>hello</p>');
      harness.editor.setIsDirty(true);
    });

    act(() => {
      harness.result.startAutoSave(1000);
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(saveDocument).toHaveBeenCalledTimes(1);

    act(() => {
      harness.result.stopAutoSave();
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(saveDocument).toHaveBeenCalledTimes(1);
  });

  it('startAutoSave does not call save on tick when not dirty', async () => {
    vi.useFakeTimers();
    claimValidateTab.mockResolvedValue({ ok: true });
    saveDocument.mockResolvedValue({ ok: true, message: 'Saved' });

    const harness = renderHookWithProviders(useSaveModule, 'DOC1');
    act(() => {
      harness.editor.updateContent('<p>hello</p>');
      harness.editor.setIsDirty(false);
    });

    act(() => {
      harness.result.startAutoSave(1000);
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    expect(saveDocument).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/save/useSaveModule.test.js`
Expected: FAIL — `Cannot find module '../../../src/services/save/useSaveModule.js'`

- [ ] **Step 3: Write minimal implementation**

```js
// src/services/save/useSaveModule.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor } from '../../context/EditorContext.jsx';
import { useModuleLifecycle } from '../../store/useModuleLifecycle.js';
import { saveDocument } from './saveDocument.js';
import { claimValidateTab } from '../session/tabPresence.js';
import { getValidateAccessKey } from '../session/sessionStorage.js';
import { showEditorMessage, EditorMessageKey } from '../../features/editor/messages/editorMessages.js';

/**
 * Core save flow: session-validation-before-save (via claimValidateTab) ->
 * basic content validation -> save request -> state update. Dirty-state
 * tracking is read from EditorContext, not reimplemented. Mirrors
 * impactweb's SaveModule.save() core path (CJK validation, offline mode,
 * and save-history comparison are explicitly out of scope here).
 */
export function useSaveModule(docId) {
  const { content, isDirty, setIsDirty } = useEditor();
  const lifecycle = useModuleLifecycle('saveModule', 'SaveModule');
  const [saveState, setSaveState] = useState('idle');

  const autoSaveTimerRef = useRef(null);
  const isDirtyRef = useRef(isDirty);
  const saveRef = useRef(null);

  isDirtyRef.current = isDirty;

  const save = useCallback(async ({ autoSave = false } = {}) => {
    setSaveState('validating');

    const claim = await claimValidateTab({ docId, key: getValidateAccessKey() });
    if (!claim || !claim.ok) {
      await showEditorMessage(EditorMessageKey.EXPIRED_SESSION_ALERT);
      setSaveState('error');
      return { ok: false, reason: 'stale_session' };
    }

    if (!content || !content.trim()) {
      setSaveState('error');
      return { ok: false, reason: 'empty_content' };
    }

    setSaveState('saving');
    const result = await saveDocument({ docId, content });

    if (result.ok) {
      setSaveState('saved');
      setIsDirty(false);
      lifecycle.recordStat('buttonClicked', { buttonId: autoSave ? 'autosave' : 'save' });
      return { ok: true };
    }

    setSaveState('error');
    lifecycle.recordError('save', result.message);
    return { ok: false, reason: 'save_failed', message: result.message };
  }, [docId, content, setIsDirty, lifecycle]);

  saveRef.current = save;

  const startAutoSave = useCallback((intervalMs = 30000) => {
    if (autoSaveTimerRef.current) return;
    autoSaveTimerRef.current = setInterval(() => {
      if (isDirtyRef.current) {
        saveRef.current({ autoSave: true });
      }
    }, intervalMs);
  }, []);

  const stopAutoSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => stopAutoSave(), [stopAutoSave]);

  return { saveState, save, startAutoSave, stopAutoSave, isDirty };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/save/useSaveModule.test.js`
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/save/useSaveModule.js tests/unit/save/useSaveModule.test.js
git commit -m "feat(save): add useSaveModule hook"
```

---

## Self-Review

**Spec coverage:**
- "`saveDocument({docId, content})` posts to `FORM_TO_FILE_FIELD`, never throws" → Task 1.
- "`useSaveModule` uses `useEditor()` for dirty state, `useModuleLifecycle` for tracking, `claimValidateTab` for the session guard" → Task 2, all three imported and used exactly as specified.
- "Stale session → `EXPIRED_SESSION_ALERT`, no save attempted" → Task 2's `save()`, step 2, tested.
- "Empty content → no network call" → Task 2's `save()`, step 3, tested.
- "`startAutoSave`/`stopAutoSave` only save while dirty" → Task 2, tested including the not-dirty no-op case.
- "No UI in this spec" → confirmed, neither task touches `EditorPage.jsx` or any component file.
- Deferred items (CJK validation, offline mode, save-history comparison, query-restore integration, retry/backoff) → none appear in either task.

**Placeholder scan:** No "TBD"/"TODO" strings; every code block is complete and runnable.

**Type consistency:**
- `saveDocument({docId, content}): {ok, message}` matches between Task 1's definition and Task 2's usage (`saveDocument({ docId, content })`, reading `result.ok`/`result.message`).
- `useSaveModule(docId)` return shape `{saveState, save, startAutoSave, stopAutoSave, isDirty}` matches between Task 2's definition and its own tests.
- `save({autoSave})` return shapes (`{ok:true}` / `{ok:false, reason, message?}`) are consistent between the implementation and every test assertion.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-06-save-module-core-flow.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
