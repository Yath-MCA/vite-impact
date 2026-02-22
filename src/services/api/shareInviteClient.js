import apiService from './apiService';

/**
 * Find share/invite records by identifier using existing REST endpoint
 * @param {string} identifier
 * @returns {Promise<Array>} array of matching records
 */
export async function findShareInviteByIdentifier(identifier) {
  try {
    const payload = { identifier };
    const res = await apiService.shareAndInvite(payload);

    if (!res) return [];
    if (Array.isArray(res)) return res;
    if (Array.isArray(res.items)) return res.items;
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(res.rows)) return res.rows;

    return [res];
  } catch (err) {
    console.error('findShareInviteByIdentifier error', err);
    throw err;
  }
}

export default findShareInviteByIdentifier;

/*
Usage example:
import findShareInviteByIdentifier from '../services/api/shareInviteClient';
const results = await findShareInviteByIdentifier('10.1093/stcltm/szad014');
*/
