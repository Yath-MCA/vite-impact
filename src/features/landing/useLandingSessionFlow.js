import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionConfig } from '../../services/session/sessionConfig.js';
import {
  loginFromLanding,
  continueBlockedSession,
  pollAndResolve
} from '../../services/session/sessionGateway.js';
import { buildSessionContextFromDocData } from '../../services/session/sessionStorage.js';

const INITIAL_UI = {
  phase: 'idle',
  message: '',
  showSendRequest: false,
  showWaiting: false,
  waitingSeconds: 0
};

export default function useLandingSessionFlow(docData) {
  const navigate = useNavigate();
  const [ui, setUi] = useState(INITIAL_UI);
  const [sessionCtx, setSessionCtx] = useState(null);
  const [lastCheckResponse, setLastCheckResponse] = useState(null);

  const buildContext = useCallback((data, overrides = {}) => {
    return buildSessionContextFromDocData(data, overrides);
  }, []);

  const goToEditor = useCallback(() => {
    navigate(sessionConfig.editorPath);
  }, [navigate]);

  const startLogin = useCallback(async () => {
    setUi({ ...INITIAL_UI, phase: 'checking', message: 'Starting session…' });

    try {
      const result = await loginFromLanding(docData, { buildContext });

      if (result.status === 'granted') {
        setUi({ ...INITIAL_UI, phase: 'redirecting', message: 'Opening editor…' });
        goToEditor();
        return;
      }

      if (result.status === 'blocked' || result.status === 'verify_failed') {
        setSessionCtx(result.ctx);
        setLastCheckResponse(result.checkResponse || null);
        setUi({
          phase: 'blocked',
          message: 'Another active session is using this document. You can send an access request.',
          showSendRequest: true,
          showWaiting: false,
          waitingSeconds: 0
        });
        return;
      }

      if (result.status === 'denied') {
        setUi({
          phase: 'denied',
          message: result.message || 'Access denied.',
          showSendRequest: false,
          showWaiting: false,
          waitingSeconds: 0
        });
        return;
      }

      setUi({
        phase: 'error',
        message: 'Unexpected session response. Please try again.',
        showSendRequest: false,
        showWaiting: false,
        waitingSeconds: 0
      });
    } catch (err) {
      setUi({
        phase: 'error',
        message: err.message || 'Session check failed.',
        showSendRequest: false,
        showWaiting: false,
        waitingSeconds: 0
      });
    }
  }, [buildContext, docData, goToEditor]);

  const confirmSendRequest = useCallback(async () => {
    if (!sessionCtx || !lastCheckResponse) return;

    setUi((prev) => ({ ...prev, phase: 'requesting', message: 'Sending access request…' }));

    try {
      const result = await continueBlockedSession(sessionCtx, lastCheckResponse);

      if (result.status === 'try_again') {
        setUi({
          phase: 'blocked',
          message: 'A request was already sent recently. Please try again later.',
          showSendRequest: true,
          showWaiting: false,
          waitingSeconds: 0
        });
        return;
      }

      if (result.status === 'granted') {
        setUi({ ...INITIAL_UI, phase: 'redirecting', message: 'Access granted. Opening editor…' });
        goToEditor();
        return;
      }

      if (result.status === 'waiting') {
        setSessionCtx(result.ctx);
        const totalSeconds = Math.ceil(result.waitMs / 1000);
        setUi({
          phase: 'waiting',
          message: 'Waiting for approval…',
          showSendRequest: false,
          showWaiting: true,
          waitingSeconds: totalSeconds
        });

        await new Promise((resolve) => setTimeout(resolve, result.waitMs));
        const pollResult = await pollAndResolve(result.ctx);

        if (pollResult.status === 'granted') {
          setUi({ ...INITIAL_UI, phase: 'redirecting', message: 'Access granted. Opening editor…' });
          goToEditor();
          return;
        }

        if (pollResult.status === 'denied') {
          setUi({
            phase: 'denied',
            message: pollResult.message || 'Access denied.',
            showSendRequest: false,
            showWaiting: false,
            waitingSeconds: 0
          });
          return;
        }

        setUi({
          phase: 'blocked',
          message: 'Request is still pending. Please try again shortly.',
          showSendRequest: true,
          showWaiting: false,
          waitingSeconds: 0
        });
        return;
      }

      setUi({
        phase: 'error',
        message: result.message || 'Unable to process access request.',
        showSendRequest: true,
        showWaiting: false,
        waitingSeconds: 0
      });
    } catch (err) {
      setUi({
        phase: 'error',
        message: err.message || 'Access request failed.',
        showSendRequest: true,
        showWaiting: false,
        waitingSeconds: 0
      });
    }
  }, [goToEditor, lastCheckResponse, sessionCtx]);

  const isBusy = useMemo(
    () => ['checking', 'requesting', 'waiting', 'redirecting'].includes(ui.phase),
    [ui.phase]
  );

  return {
    ui,
    isBusy,
    startLogin,
    confirmSendRequest
  };
}
