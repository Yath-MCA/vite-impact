import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionConfig } from '../../../services/session/sessionConfig.js';
import { closeSessionFromEditor } from '../../../services/session/sessionGateway.js';
import {
  clearEditorSessionHandshake,
  getEditorSessionContextFromStorage
} from '../../../services/session/sessionStorage.js';
import {
  releaseValidateTab,
  stopTabPresence
} from '../../../services/session/tabPresence.js';
import { showEditorMessage } from '../messages/editorMessages.js';

function buildValidateUrlPath(accessKey) {
  const base = sessionConfig.validateUrlPath || '/validateurl';
  if (!accessKey) return base;
  return `${base}?key=${encodeURIComponent(accessKey)}`;
}

/**
 * Editor outer Logout: confirm → linksharing close → release tab → validateurl.
 */
export default function useEditorLogout() {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (isLoggingOut) return;

    const confirm = await showEditorMessage('LogOutShow');
    if (!confirm?.isConfirmed) return;

    const { docId, sessionId, accessKey } = getEditorSessionContextFromStorage();
    setIsLoggingOut(true);

    try {
      const result = await closeSessionFromEditor({
        docId,
        sessionId
      });

      if (!result.ok) {
        await showEditorMessage('ErrorImpact');
        return;
      }

      if (docId) {
        releaseValidateTab({ docId });
      }
      stopTabPresence();
      clearEditorSessionHandshake({ clearValidateKey: false });

      navigate(buildValidateUrlPath(accessKey));
    } catch {
      await showEditorMessage('ErrorImpact');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, navigate]);

  return { logout, isLoggingOut };
}
