import { useCallback, useRef } from 'react';
import { SESSION_REMARKS } from '../../../services/session/sessionConstants.js';
import {
  applySelectedEmailToResData,
  shouldValidateMultiUser
} from '../../../services/session/sessionSource.js';
import {
  getPendingValidateResponse,
  saveLegacyLocalStorageData,
  setPendingValidateResponse
} from '../../../services/session/sessionStorage.js';
import { setUserInfo, toLegacyUserInfo } from '../../../services/session/userInfoBridge.js';
import { normalizeSessionSource } from '../../../services/session/sessionSource.js';
import { promptValidateUserEmail } from '../sessionDialogs.js';
import { isPlosClient, shouldRunPlosAuth } from '../landingAccess.js';
import usePlosAuthentication from '../plos/usePlosAuthentication.js';

/**
 * Post-urlvalidity user validation: multi-user email, PLOS auth, auto-login on email entry.
 */
export default function useLandingUserValidation({
  docData,
  validateResponse,
  startLogin
}) {
  const { runPlosAuth, status } = usePlosAuthentication();
  const resolvedEmailRef = useRef(null);

  const runUserValidation = useCallback(async () => {
    if (!docData) return { ok: false, reason: 'missing_doc' };

    let workingDoc = { ...docData };
    let showValidateEmailButton = false;
    let plosAuthRequired = false;

    if (shouldValidateMultiUser(workingDoc)) {
      const email = await promptValidateUserEmail(workingDoc.emailto);
      if (!email) {
        return { ok: false, showValidateEmailButton: true, reason: 'email_cancelled' };
      }

      workingDoc = applySelectedEmailToResData(workingDoc, email);
      resolvedEmailRef.current = email;

      const pending = getPendingValidateResponse();
      if (pending?.data) {
        pending.data = applySelectedEmailToResData({ ...pending.data }, email);
        setPendingValidateResponse(pending);
      }

      saveLegacyLocalStorageData(workingDoc);
      const src = normalizeSessionSource(workingDoc, validateResponse || pending, {
        selectedEmail: email
      });
      setUserInfo(toLegacyUserInfo(src));

      if (!isPlosClient(workingDoc.client)) {
        await startLogin({
          remarks: SESSION_REMARKS.USER_ENTER_VALID_EMAIL,
          username: email
        });
        return { ok: true, autoLogin: true };
      }
    }

    if (shouldRunPlosAuth(workingDoc, validateResponse, workingDoc.client)) {
      plosAuthRequired = true;
      const authResult = await runPlosAuth(validateResponse?.data || workingDoc, {
        docId: workingDoc.docid,
        userEmail: resolvedEmailRef.current || workingDoc.username,
        onShowAcceptButton: () => {},
        onAuthSuccess: () => {}
      });
      if (authResult.status !== 'passed') {
        return { ok: false, reason: 'plos_auth_failed', plosAuthRequired };
      }
    }

    return {
      ok: true,
      docData: workingDoc,
      showValidateEmailButton,
      plosAuthRequired
    };
  }, [docData, validateResponse, runPlosAuth, startLogin]);

  return {
    runUserValidation,
    resolvedEmail: resolvedEmailRef.current,
    plosAuthStatus: status
  };
}
