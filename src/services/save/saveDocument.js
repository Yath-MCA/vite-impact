import { apiService, API_ENDPOINTS } from '../api/apiService.js';

/**
 * Posts document content to the existing FORM_TO_FILE_FIELD endpoint
 * (impactweb's SaveModule.performOnlineSave equivalent). Never throws —
 * always resolves to { ok, message } so callers don't need try/catch.
 *
 * NOTE: this is a deliberately partial legacy envelope covering only the
 * fields needed for the core save flow (see prepareSaveData in
 * impactweb/src/js/editor_page_events_fn.js:4411-4462). Fields sourced from
 * session/global context (count_info, order, shared_id, corole, roleorg,
 * roleid, shorttitle, GET_JSON("default")/USER_INFO/SHARED_KEY) are out of
 * scope here and deferred pending a spec amendment before any future
 * Save-button UI wiring task.
 */
export async function saveDocument({ docId, content, autoSave = false }) {
  try {
    const response = await apiService.makeRequest(
      API_ENDPOINTS.FORM_TO_FILE_FIELD,
      {
        tbl: 'Fileslist',
        subfolder: docId,
        status: 'active',
        sopt: 'openstorage',
        recent: 1,
        timestamp: Date.now(),
        filename: `${docId}_updated`,
        backup: '_updated',
        recordtype: autoSave ? 'autosave' : 'save',
        keyname: 'a',
        a: encodeURIComponent(content)
      },
      { method: 'POST' }
    );

    // Legacy handleSaveResponse (editor_page_events_fn.js:4572-4578) signals
    // failure via response.r === 0 (FILE_NOT_SAVED) or 2 (ALREADY_FINALIZED)
    // inside an HTTP 200 body. Only treat r as a failure signal when it is
    // explicitly 0 or 2 — the endpoint's full response contract beyond these
    // two documented failure codes is not fully known.
    if (response && response.r === 0) {
      return { ok: false, message: 'Save failed: file not saved', reason: 'file_not_saved' };
    }
    if (response && response.r === 2) {
      return { ok: false, message: 'Document already finalized', reason: 'already_finalized' };
    }

    return { ok: true, message: 'Saved' };
  } catch (err) {
    return { ok: false, message: (err && err.message) || 'Save failed' };
  }
}
