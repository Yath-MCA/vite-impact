import { describe, it, expect, vi, beforeEach } from 'vitest';
import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';

const navigateMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock
}));

vi.mock('../../../src/services/session/sessionGateway.js', () => ({
  loginFromLanding: vi.fn(),
  continueBlockedSession: vi.fn(),
  pollAndResolve: vi.fn()
}));

vi.mock('../../../src/services/session/sessionStorage.js', () => ({
  buildSessionContextFromDocData: (docData, overrides = {}) => ({
    docId: docData.docid,
    client: docData.client,
    ...overrides
  })
}));

import {
  loginFromLanding,
  continueBlockedSession,
  pollAndResolve
} from '../../../src/services/session/sessionGateway.js';
import useLandingSessionFlow from '../../../src/features/landing/useLandingSessionFlow.js';

function renderHook(hook, props) {
  const container = document.createElement('div');
  const root = createRoot(container);
  let latest = null;

  function Harness() {
    const value = hook(props);
    useEffect(() => {
      latest = value;
    }, [value]);
    return null;
  }

  act(() => {
    root.render(React.createElement(Harness));
  });

  return {
    get current() {
      return latest;
    },
    unmount() {
      act(() => {
        root.unmount();
      });
    }
  };
}

describe('useLandingSessionFlow CTA orchestration', () => {
  const docData = { docid: 'DOC123', client: 'oup' };

  beforeEach(() => {
    vi.clearAllMocks();
    navigateMock.mockReset();
  });

  it('calls gateway check before navigating to editor on grant', async () => {
    loginFromLanding.mockResolvedValueOnce({ status: 'granted', ctx: { docId: 'DOC123' } });

    const hook = renderHook(useLandingSessionFlow, docData);

    await act(async () => {
      await hook.current.startLogin();
    });

    expect(loginFromLanding).toHaveBeenCalledWith(docData, expect.objectContaining({
      buildContext: expect.any(Function)
    }));
    expect(navigateMock).toHaveBeenCalledWith('/editor');
    expect(hook.current.ui.phase).toBe('redirecting');
    hook.unmount();
  });

  it('does not navigate when session is blocked', async () => {
    loginFromLanding.mockResolvedValueOnce({
      status: 'blocked',
      ctx: { docId: 'DOC123', sessionId: '1', sessionStartTime: '1' },
      checkResponse: { r: 0, requeststatus: 0 }
    });

    const hook = renderHook(useLandingSessionFlow, docData);

    await act(async () => {
      await hook.current.startLogin();
    });

    expect(navigateMock).not.toHaveBeenCalled();
    expect(hook.current.ui.phase).toBe('blocked');
    expect(hook.current.ui.showSendRequest).toBe(true);
    hook.unmount();
  });

  it('runs request and poll flow before editor navigation', async () => {
    loginFromLanding.mockResolvedValueOnce({
      status: 'blocked',
      ctx: { docId: 'DOC123', sessionId: '1', sessionStartTime: '1' },
      checkResponse: { r: 0, requeststatus: 0 }
    });
    continueBlockedSession.mockResolvedValueOnce({
      status: 'waiting',
      ctx: { docId: 'DOC123', sessionId: '1', sessionStartTime: '1', requestId: '999' },
      waitMs: 0
    });
    pollAndResolve.mockResolvedValueOnce({ status: 'granted', ctx: { docId: 'DOC123' } });

    const hook = renderHook(useLandingSessionFlow, docData);

    await act(async () => {
      await hook.current.startLogin();
    });

    await act(async () => {
      await hook.current.confirmSendRequest();
    });

    expect(continueBlockedSession).toHaveBeenCalled();
    expect(pollAndResolve).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/editor');
    hook.unmount();
  });
});
