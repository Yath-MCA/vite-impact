import { normalizeSessionSource, toSessionContext } from './sessionSource.js';
import { resolveShareKeyContext } from './shareKeyContext.js';
import {
  resolveEditorDocId,
  loadOrRecoverEditorSession,
  resolveEditorUserInfo,
  assertEditorAccess,
  verifyEditorSession
} from './editorSessionSteps.js';

export { resolveEditorDocId } from './editorSessionSteps.js';

export async function bootstrapEditorSession({
  docId,
  locationSearch = typeof window !== 'undefined' ? window.location.search : '',
  allowRecovery = true
} = {}) {
  const resolvedDocId = resolveEditorDocId({ docId, locationSearch });

  if (!resolvedDocId) {
    return {
      ok: false,
      reason: 'no_doc_id',
      message: 'Missing document id.',
      redirectTo: '/validateurl'
    };
  }

  const loaded = await loadOrRecoverEditorSession({
    docId: resolvedDocId,
    allowRecovery
  });
  if (!loaded.ok) {
    return {
      ok: false,
      reason: loaded.reason,
      message: loaded.message,
      redirectTo: loaded.redirectTo || '/validateurl'
    };
  }

  const shareKey = await resolveShareKeyContext(resolvedDocId);
  if (!shareKey.ok) {
    return {
      ok: false,
      reason: 'missing_share_key',
      message: shareKey.message || 'ShareKey details are required.',
      redirectTo: '/validateurl'
    };
  }

  const sessionSource = normalizeSessionSource(
    loaded.docData,
    loaded.validateResponse
  );
  const userInfo = resolveEditorUserInfo({
    sessionSource,
    shareKeyCtx: shareKey.ctx
  });

  const access = assertEditorAccess({
    sessionId: loaded.sessionId,
    userInfo
  });
  if (!access.ok) {
    return access;
  }

  const verify = await verifyEditorSession({
    ...toSessionContext(sessionSource),
    ...shareKey.ctx,
    docId: resolvedDocId,
    sessionId: loaded.sessionId,
    sessionStartTime: loaded.sessionStartTime,
    username: userInfo.username || shareKey.ctx.username
  });
  if (!verify.ok) {
    return verify;
  }

  return {
    ok: true,
    docId: resolvedDocId,
    sessionId: loaded.sessionId,
    sessionStartTime: loaded.sessionStartTime,
    validateKey: loaded.validateKey || '',
    sessionSource,
    userInfo,
    recovered: loaded.recovered,
    bypassed: verify.bypassed === true
  };
}
