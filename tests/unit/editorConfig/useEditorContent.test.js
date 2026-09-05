import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useEditorContent } from '../../../src/services/editorConfig/useEditorContent.js';

function renderHook(hook, props) {
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
    root.render(React.createElement(Harness, { hookProps: props }));
  });

  return {
    get result() {
      return latest;
    },
    rerender(nextProps) {
      act(() => {
        root.render(React.createElement(Harness, { hookProps: nextProps }));
      });
    }
  };
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('useEditorContent', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in a loading state with no content', () => {
    global.fetch.mockReturnValue(new Promise(() => {}));
    const harness = renderHook(useEditorContent, 'DOC123');
    expect(harness.result.loading).toBe(true);
    expect(harness.result.content).toBeNull();
    expect(harness.result.error).toBeNull();
  });

  it('sets content once the fetch resolves successfully', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: () => Promise.resolve('<p>Hello document</p>')
    });

    const harness = renderHook(useEditorContent, 'DOC123');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(harness.result.loading).toBe(false);
    expect(harness.result.content).toBe('<p>Hello document</p>');
    expect(harness.result.error).toBeNull();
  });

  it('sets a blocking error and leaves content null on a non-ok response', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404, text: () => Promise.resolve('') });

    const harness = renderHook(useEditorContent, 'DOC123');

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(harness.result.loading).toBe(false);
    expect(harness.result.content).toBeNull();
    expect(harness.result.error).not.toBeNull();
  });

  it('sets an error immediately and never fetches when docId is falsy', () => {
    const harness = renderHook(useEditorContent, '');
    expect(harness.result.loading).toBe(false);
    expect(harness.result.content).toBeNull();
    expect(harness.result.error).not.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
