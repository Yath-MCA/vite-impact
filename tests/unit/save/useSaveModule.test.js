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
