import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useEditorContent } from '../../../src/services/editorConfig/useEditorContent.js';

const mockAxiosGet = vi.hoisted(() => vi.fn());

vi.mock('axios', () => ({
  default: {
    get: mockAxiosGet
  }
}));

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
    mockAxiosGet.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in a loading state with no content', () => {
    mockAxiosGet.mockReturnValue(new Promise(() => {}));
    const harness = renderHook(useEditorContent, 'DOC123');
    expect(harness.result.loading).toBe(true);
    expect(harness.result.content).toBeNull();
    expect(harness.result.error).toBeNull();
  });

  it('sets content once the fetch resolves successfully', async () => {
    mockAxiosGet.mockResolvedValue({
      status: 200,
      data: '<p>Hello document</p>'
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
    mockAxiosGet.mockResolvedValue({ status: 404, data: '' });

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
    expect(mockAxiosGet).not.toHaveBeenCalled();
  });
});
