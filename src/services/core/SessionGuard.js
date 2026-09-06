import { isLocalHost } from '../session/runtimeFlags.js';
import { SESSION_STORAGE_KEYS, SESSION_GUARD_REMARKS } from '../session/sessionConstants.js';
import { readShareKeyFromLocalStorage } from '../session/shareKeyContext.js';
import { devLog } from '../../shared/utils/devLogger.js';

class SessionGuard {
  constructor() {}

  checkStage(stage, ctx) {
    const validation = this._validate(stage, ctx);
    if (validation.ok) {
      devLog.log('[SessionGuard]', stage, 'pass');
      return { ok: true, bypassed: false, stage, remarks: '' };
    }

    if (isLocalHost()) {
      const remarks = `${SESSION_GUARD_REMARKS.LOCALHOST_BYPASS_PREFIX}${validation.remarks}`;
      devLog.warn('[SessionGuard]', stage, remarks);
      return { ok: true, bypassed: true, stage, remarks };
    }

    devLog.warn('[SessionGuard]', stage, validation.remarks);
    return { ok: false, bypassed: false, stage, remarks: validation.remarks };
  }

  _validate(stage, ctx) {
    let resolvedCtx = ctx && typeof ctx === 'object' ? ctx : null;
    let docId = resolvedCtx?.docId || resolvedCtx?.docid || '';

    if (!docId && typeof sessionStorage !== 'undefined') {
      docId = sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID) || '';
    }

    if (!docId) {
      return { ok: false, remarks: SESSION_GUARD_REMARKS.MISSING_DOC_ID };
    }

    if (!resolvedCtx) {
      const shared = readShareKeyFromLocalStorage(docId);
      if (!shared) {
        return { ok: false, remarks: SESSION_GUARD_REMARKS.MISSING_SHARE_KEY };
      }
      resolvedCtx = { docId, ...shared };
    }

    const ctxDocId = String(resolvedCtx.docId || resolvedCtx.docid || '');
    if (ctxDocId && ctxDocId !== String(docId)) {
      return { ok: false, remarks: SESSION_GUARD_REMARKS.DOCID_MISMATCH };
    }

    if (!resolvedCtx.client && !resolvedCtx.username && !readShareKeyFromLocalStorage(docId)) {
      return { ok: false, remarks: SESSION_GUARD_REMARKS.MISSING_SHARE_KEY };
    }

    return { ok: true, remarks: '' };
  }
}

export default SessionGuard;
