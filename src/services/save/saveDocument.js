import { apiService, API_ENDPOINTS } from '../api/apiService.js';

/**
 * Posts document content to the existing FORM_TO_FILE_FIELD endpoint
 * (impactweb's SaveModule.performOnlineSave equivalent). Never throws —
 * always resolves to { ok, message } so callers don't need try/catch.
 */
export async function saveDocument({ docId, content }) {
  try {
    await apiService.makeRequest(
      API_ENDPOINTS.FORM_TO_FILE_FIELD,
      { docid: docId, content },
      { method: 'POST' }
    );
    return { ok: true, message: 'Saved' };
  } catch (err) {
    return { ok: false, message: (err && err.message) || 'Save failed' };
  }
}
