import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { closeSessionFromEditor } from '../../../services/session/sessionGateway.js';
import { startIdleTimeoutWatcher } from '../../../services/session/idleTimeout.js';
import {
  clearEditorSessionHandshake,
  getEditorSessionContextFromStorage
} from '../../../services/core/editorSessionStorage.js';
import { releaseValidateTab, stopTabPresence } from '../../../services/session/tabPresence.js';

/**
 * Mounts an inactivity watchdog while enabled. On expiry: closes the linksharing
 * session, releases the same-browser tab lock, clears the handshake, and
 * redirects to /validateurl with the idle_session_log_out alert.
 */
export default function useIdleTimeout({ enabled = true } = {}) {
  const navigate = useNavigate();
  const firingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    firingRef.current = false;

    const stop = startIdleTimeoutWatcher({
      onIdle: async () => {
        if (firingRef.current) return;
        firingRef.current = true;

        const { docId, sessionId, accessKey } = getEditorSessionContextFromStorage();

        try {
          await closeSessionFromEditor({ docId, sessionId });
        } finally {
          if (docId) {
            releaseValidateTab({ docId });
          }
          stopTabPresence();
          clearEditorSessionHandshake({ clearValidateKey: false });

          const query = new URLSearchParams();
          if (docId) query.set('docid', docId);
          if (accessKey) query.set('key', accessKey);
          query.set('alert', 'idle_session_log_out');
          navigate(`/validateurl?${query.toString()}`);
        }
      }
    });

    return stop;
  }, [enabled, navigate]);
}
