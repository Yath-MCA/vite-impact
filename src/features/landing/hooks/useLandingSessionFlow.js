import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionConfig } from '../../../services/session/sessionConfig.js';
import {
  loginFromLanding,
  continueBlockedSession,
  pollAndResolve
} from '../../../services/session/sessionGateway.js';
import { buildSessionContextFromDocData } from '../../../services/session/sessionStorage.js';

const INITIAL_UI = {
  phase: 'idle',
  message: '',
  showSendRequest: false,
  showWaiting: false,
  waitingSeconds: 0
};

function applyResultStatus(setUi, setSessionCtx, setLastCheckResponse, result) {
  if (result.status === 'blocked') {
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

  if (result.status === 'verify_failed') {
    setSessionCtx(result.ctx || null);
    setLastCheckResponse(result.checkResponse || null);
    setUi({
      phase: 'verify_failed',
      message: 'Session verification failed. Please try again or request access if another user holds the document.',
      showSendRequest: Boolean(result.checkResponse),
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
  }
}

export default function useLandingSessionFlow(docData) {
  const navigate = useNavigate();
  const [ui, setUi] = useState(INITIAL_UI);
  const [sessionCtx, setSessionCtx] = useState(null);
  const [lastCheckResponse, setLastCheckResponse] = useState(null);
  const mountedRef = useRef(true);
  const waitTimerRef = useRef(null);
  const countdownRef = useRef(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (waitTimerRef.current) clearTimeout(waitTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

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
      if (!mountedRef.current) return;

      if (result.status === 'granted') {
        setUi({ ...INITIAL_UI, phase: 'redirecting', message: 'Opening editor…' });
        goToEditor();
        return;
      }

      if (result.status === 'blocked' || result.status === 'verify_failed' || result.status === 'denied') {
        applyResultStatus(setUi, setSessionCtx, setLastCheckResponse, result);
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
      if (!mountedRef.current) return;
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
      if (!mountedRef.current) return;

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

      if (result.status === 'verify_failed') {
        applyResultStatus(setUi, setSessionCtx, setLastCheckResponse, result);
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

        if (countdownRef.current) clearInterval(countdownRef.current);
        countdownRef.current = setInterval(() => {
          if (!mountedRef.current) return;
          setUi((prev) => ({
            ...prev,
            waitingSeconds: Math.max(0, (prev.waitingSeconds || 0) - 1)
          }));
        }, 1000);

        await new Promise((resolve) => {
          waitTimerRef.current = setTimeout(resolve, result.waitMs);
        });
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
        if (!mountedRef.current) return;

        const pollResult = await pollAndResolve(result.ctx);
        if (!mountedRef.current) return;

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

        if (pollResult.status === 'verify_failed') {
          applyResultStatus(setUi, setSessionCtx, setLastCheckResponse, pollResult);
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
      if (!mountedRef.current) return;
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
