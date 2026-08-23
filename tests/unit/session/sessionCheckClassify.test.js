import { describe, it, expect } from 'vitest';
import {
  isCheckErrorResponse,
  isConflictShapedCheckResponse,
  shouldRetryLandingVerify
} from '../../../src/services/session/sessionCheckClassify.js';

describe('sessionCheckClassify', () => {
  it('treats DB exception r==0 as a check error, not a conflict', () => {
    expect(
      isCheckErrorResponse({
        r: 0,
        message: 'Error while accessing DB for "check" request'
      })
    ).toBe(true);
    expect(
      isConflictShapedCheckResponse({
        r: 0,
        message: 'Error while accessing DB for "check" request'
      })
    ).toBe(false);
  });

  it('treats bare r==0 without conflict fields as an error', () => {
    expect(isCheckErrorResponse({ r: 0 })).toBe(true);
    expect(isConflictShapedCheckResponse({ r: 0 })).toBe(false);
  });

  it('treats r==0 with requeststatus as a conflict', () => {
    const response = { r: 0, requeststatus: 0, requestid: 0, request_send_time: 0 };
    expect(isCheckErrorResponse(response)).toBe(false);
    expect(isConflictShapedCheckResponse(response)).toBe(true);
  });

  it('retries only missing/mismatch verify reasons', () => {
    expect(shouldRetryLandingVerify('no_active_row')).toBe(true);
    expect(shouldRetryLandingVerify('record_mismatch')).toBe(true);
    expect(shouldRetryLandingVerify('multiple_active')).toBe(false);
  });
});
