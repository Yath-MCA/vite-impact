import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { useClientConfig } from '../../../src/services/editorConfig/useClientConfig.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    }
  };
}

function xmlResponse(xmlString, ok = true) {
  return Promise.resolve({
    status: ok ? 200 : 500,
    data: xmlString
  });
}

describe('useClientConfig', () => {
  beforeEach(() => {
    mockAxiosGet.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in a loading state before resolving', () => {
    mockAxiosGet.mockReturnValue(new Promise(() => {}));
    const harness = renderHook(useClientConfig, {
      client: 'PLOS', dtd: 'JATS', journalCode: 'PONE', refStyle: '', isJournal: true
    });
    expect(harness.result.loading).toBe(true);
  });

  it('parses config.xml into toggles once all requests resolve', async () => {
    mockAxiosGet.mockImplementation((url) => {
      if (url.endsWith('config.xml')) {
        return xmlResponse('<root><item name="editor6Layout" editor6="three-column"></item></root>');
      }
      return xmlResponse('<root></root>');
    });

    const harness = renderHook(useClientConfig, {
      client: 'PLOS', dtd: 'JATS', journalCode: 'PONE', refStyle: '', isJournal: true
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(harness.result.loading).toBe(false);
    expect(harness.result.toggles.layoutMode).toBe('three-column');
    expect(harness.result.error).toBeNull();
  });

  it('falls back to default toggles and sets error when a request fails, without blocking', async () => {
    mockAxiosGet.mockImplementation((url) => {
      if (url.endsWith('config.xml')) {
        return Promise.reject(new Error('network down'));
      }
      return xmlResponse('<root></root>');
    });

    const harness = renderHook(useClientConfig, {
      client: 'PLOS', dtd: 'JATS', journalCode: 'PONE', refStyle: '', isJournal: true
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(harness.result.loading).toBe(false);
    expect(harness.result.toggles.layoutMode).toBe('default');
    expect(harness.result.error).not.toBeNull();
  });

  it('requests the ceg refStyling file using refStyle when isJournal is false', async () => {
    mockAxiosGet.mockImplementation((url) => xmlResponse('<root></root>'));

    renderHook(useClientConfig, {
      client: 'OXMEDO', dtd: 'BITS', journalCode: 'OXMEDO', refStyle: 'apa', isJournal: false
    });

    await act(async () => {
      await Promise.resolve();
    });

    const requestedUrls = mockAxiosGet.mock.calls.map((call) => call[0]);
    expect(requestedUrls.some((url) => url.includes('ceg/refStyling_apa.xml'))).toBe(true);
  });

  it('skips fetching entirely when client or dtd is missing', () => {
    const harness = renderHook(useClientConfig, {
      client: '', dtd: '', journalCode: '', refStyle: '', isJournal: false
    });
    expect(harness.result.loading).toBe(false);
    expect(mockAxiosGet).not.toHaveBeenCalled();
  });
});
