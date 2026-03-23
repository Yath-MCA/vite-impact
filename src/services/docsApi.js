import apiService from './api/apiService';

/**
 * Wrapper around existing apiService.getDocs to keep calling code consistent.
 * Reuses API_ENDPOINTS and apiService from src/services/api/apiService.js
 */
export async function fetchDocs(payload) {
  // apiService.getDocs expects an object and will serialise as jsondata=...
  return apiService.getDocs(payload);
}

export default { fetchDocs };
