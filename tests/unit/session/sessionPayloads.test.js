import { describe, it, expect } from 'vitest';
import {
  buildCheckPayload,
  buildClosePayload,
  isActiveSessionRecord,
  minutesSince,
  buildUpdateReqStatusTimePayload
} from '../../../src/services/session/sessionPayloads.js';
import {
  REQUEST_STATUS,
  SESSION_REMARKS,
  SESSION_PROCESS
} from '../../../src/services/session/sessionConstants.js';

describe('sessionPayloads', () => {
  it('builds landing check payload with doc and session fields', () => {
    const payload = buildCheckPayload({
      docId: 'DOC123',
      sessionId: '48291037',
      sessionStartTime: '1700000000000',
      client: 'oup',
      username: 'author@example.com',
      role: 'role-1',
      rolename: 'Author'
    });

    expect(payload).toMatchObject({
      tbl: 'linksharing',
      process: 'check',
      docid: 'DOC123',
      session_id: '48291037',
      remarks: SESSION_REMARKS.USER_ACCEPT_OPEN_DOC,
      username: 'author@example.com'
    });
  });

  it('builds close payload for manual editor logout', () => {
    const payload = buildClosePayload({
      docId: 'DOC123',
      sessionId: '48291037',
      sessionEndTime: '1700000005000'
    });

    expect(payload).toMatchObject({
      tbl: 'linksharing',
      process: SESSION_PROCESS.CLOSE,
      docid: 'DOC123',
      session_id: '48291037',
      session_end_time: '1700000005000',
      remarks: SESSION_REMARKS.USER_MANUAL_LOGOUT
    });
  });

  it('rejects session_start_time mismatch during verify', () => {
    const ok = isActiveSessionRecord(
      {
        docid: 'DOC123',
        session_id: '48291037',
        session_start_time: '1700000000999',
        session_end_time: '0',
        docstatus: '1'
      },
      {
        docId: 'DOC123',
        sessionId: '48291037',
        sessionStartTime: '1700000000000'
      }
    );
    expect(ok).toBe(false);
  });

  it('builds resend request payload with old request ids', () => {
    const payload = buildUpdateReqStatusTimePayload({
      docId: 'DOC123',
      requestId: '999888777',
      requestSendTime: '1700000001000',
      oldrequestid: '111222333',
      oldrequest_send_time: '1700000000000'
    });

    expect(payload.requeststatus).toBe(REQUEST_STATUS.PENDING);
    expect(payload.oldrequestid).toBe('111222333');
  });

  it('calculates minutes since timestamp', () => {
    const thirtyOneMinutesAgo = Date.now() - (31 * 60 * 1000);
    expect(minutesSince(String(thirtyOneMinutesAgo))).toBeGreaterThan(30);
  });

  it('treats missing timestamps as older than throttle window', () => {
    expect(minutesSince(null)).toBe(Number.POSITIVE_INFINITY);
    expect(minutesSince('bad')).toBe(Number.POSITIVE_INFINITY);
    expect(minutesSince(0)).toBe(Number.POSITIVE_INFINITY);
  });
});
