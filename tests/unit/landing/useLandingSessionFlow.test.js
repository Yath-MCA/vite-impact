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

vi.mock('../../../src/features/landing/sessionDialogs.js', () => ({
  closeSessionDialogs: vi.fn(),
  promptSendAccessRequest: vi.fn(),
  promptVerifyFailed: vi.fn(),
  showSessionWaiting: vi.fn(),
  showSessionDenied: vi.fn(),
  showSessionError: vi.fn()
}));

import {
  loginFromLanding,
  continueBlockedSession,
  pollAndResolve
} from '../../../src/services/session/sessionGateway.js';
import * as sessionDialogs from '../../../src/features/landing/sessionDialogs.js';
import useLandingSessionFlow from '../../../src/features/landing/hooks/useLandingSessionFlow.js';

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
    sessionDialogs.promptSendAccessRequest.mockResolvedValue(false);
    sessionDialogs.promptVerifyFailed.mockResolvedValue(false);
    sessionDialogs.showSessionDenied.mockResolvedValue(undefined);
    sessionDialogs.showSessionError.mockResolvedValue(undefined);
    sessionDialogs.showSessionWaiting.mockReturnValue({
      updateSeconds: vi.fn(),
      close: vi.fn()
    });
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
    expect(sessionDialogs.promptSendAccessRequest).not.toHaveBeenCalled();
    hook.unmount();
  });

  it('prompts Send Request on blocked and does not rely on inline showSendRequest', async () => {
    loginFromLanding.mockResolvedValueOnce({
      status: 'blocked',
      ctx: { docId: 'DOC123', sessionId: '1', sessionStartTime: '1' },
      checkResponse: { r: 0, requeststatus: 0 }
    });
    sessionDialogs.promptSendAccessRequest.mockResolvedValueOnce(false);

    const hook = renderHook(useLandingSessionFlow, docData);

    await act(async () => {
      await hook.current.startLogin();
    });

    expect(navigateMock).not.toHaveBeenCalled();
    expect(sessionDialogs.promptSendAccessRequest).toHaveBeenCalled();
    expect(hook.current.ui.showSendRequest).toBe(false);
    expect(hook.current.ui.phase).toBe('idle');
    hook.unmount();
  });

  it('surfaces verify_failed via dialog instead of inline panel', async () => {
    loginFromLanding.mockResolvedValueOnce({
      status: 'verify_failed',
      ctx: { docId: 'DOC123', sessionId: '1', sessionStartTime: '1' },
      checkResponse: { r: 1 }
    });
    sessionDialogs.promptVerifyFailed.mockResolvedValueOnce(false);

    const hook = renderHook(useLandingSessionFlow, docData);

    await act(async () => {
      await hook.current.startLogin();
    });

    expect(navigateMock).not.toHaveBeenCalled();
    expect(sessionDialogs.promptVerifyFailed).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ allowSendRequest: true })
    );
    expect(hook.current.ui.phase).toBe('idle');
    hook.unmount();
  });

  it('closes waiting dialog before navigating after grant', async () => {
    const waitingClose = vi.fn();
    loginFromLanding.mockResolvedValueOnce({
      status: 'blocked',
      ctx: { docId: 'DOC123', sessionId: '1', sessionStartTime: '1' },
      checkResponse: { r: 0, requeststatus: 0 }
    });
    sessionDialogs.promptSendAccessRequest.mockResolvedValueOnce(true);
    continueBlockedSession.mockResolvedValueOnce({
      status: 'waiting',
      ctx: { docId: 'DOC123', sessionId: '1', sessionStartTime: '1', requestId: '999' },
      waitMs: 0
    });
    sessionDialogs.showSessionWaiting.mockReturnValueOnce({
      updateSeconds: vi.fn(),
      close: waitingClose
    });
    pollAndResolve.mockResolvedValueOnce({ status: 'granted', ctx: { docId: 'DOC123' } });

    const hook = renderHook(useLandingSessionFlow, docData);

    await act(async () => {
      await hook.current.startLogin();
    });

    expect(continueBlockedSession).toHaveBeenCalled();
    expect(sessionDialogs.showSessionWaiting).toHaveBeenCalled();
    expect(waitingClose).toHaveBeenCalled();
    expect(pollAndResolve).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/editor');
    hook.unmount();
  });
});
