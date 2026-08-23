import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BrowserCompatibilityGate from '../../../src/core/router/BrowserCompatibilityGate.jsx';
import { LandingMessageKey } from '../../../src/features/landing/messages/landingMessageKeys.js';

vi.mock('../../../src/services/core/browserCompatibility.js', () => ({
  checkBrowserCompatibility: vi.fn()
}));

vi.mock('../../../src/features/landing/messages/index.js', () => ({
  showLandingMessage: vi.fn(() => Promise.resolve())
}));

import { checkBrowserCompatibility } from '../../../src/services/core/browserCompatibility.js';
import { showLandingMessage } from '../../../src/features/landing/messages/index.js';

function renderGate(children) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(React.createElement(BrowserCompatibilityGate, null, children));
  });

  return { container, root };
}

describe('BrowserCompatibilityGate', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
    delete window.browserInfo;
  });

  it('blocks route content and shows the unsupported browser message', async () => {
    const browserInfo = {
      browser: 'Internet Explorer',
      isAllowed: false,
      isCompatible: false
    };
    checkBrowserCompatibility.mockReturnValue(browserInfo);

    const { container } = renderGate(React.createElement('main', null, 'Dashboard content'));

    await vi.waitFor(() => {
      expect(showLandingMessage).toHaveBeenCalledWith(LandingMessageKey.UNSUPPORTED_BROWSER);
    });

    expect(container.textContent).not.toContain('Dashboard content');
    expect(window.browserInfo).toBe(browserInfo);
  });

  it('renders route content for supported browsers without an alert', async () => {
    const browserInfo = {
      browser: 'Chrome',
      isAllowed: true,
      isCompatible: true
    };
    checkBrowserCompatibility.mockReturnValue(browserInfo);

    const { container } = renderGate(React.createElement('main', null, 'Editor content'));

    await vi.waitFor(() => {
      expect(container.textContent).toContain('Editor content');
    });

    expect(showLandingMessage).not.toHaveBeenCalled();
    expect(window.browserInfo).toBe(browserInfo);
  });
});
