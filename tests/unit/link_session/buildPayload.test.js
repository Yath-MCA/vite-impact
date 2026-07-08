import { describe, it, expect, beforeAll } from 'vitest';
import { loadLinkSessionCore } from './loadCore.mjs';

describe('LinkSessionCore buildPayload', () => {
  let core;

  beforeAll(() => {
    const LinkSessionCore = loadLinkSessionCore();
    core = new LinkSessionCore();
  });

  it('builds check payload for landing login', () => {
    const payload = core.buildCheckPayload({
      docId: 'DOC123',
      sessionId: '48291037',
      sessionStartTime: '1700000000000',
      remarks: 'login',
      source: 'editor'
    });

    expect(payload).toMatchObject({
      tbl: 'linksharing',
      docid: 'DOC123',
      session_id: '48291037',
      session_start_time: '1700000000000',
      process: 'check',
      remarks: 'login'
    });
  });

  it('builds update_reqstatus_time payload with pending status', () => {
    const payload = core.buildUpdateReqStatusTimePayload({
      docId: 'DOC123',
      requestId: '384729184',
      requestSendTime: '1700000000000'
    });

    expect(payload).toMatchObject({
      tbl: 'linksharing',
      docid: 'DOC123',
      process: 'update_reqstatus_time',
      requeststatus: '1',
      request_send_time: '1700000000000',
      requestid: '384729184'
    });
  });

  it('builds stale cleanup payload for update_docstatus_reqstatus_insert_time', () => {
    const payload = core.buildSendRequestPayload({
      docId: 'DOC123',
      sessionId: '48291037',
      sessionStartTime: '1700000000000'
    });

    expect(payload).toMatchObject({
      tbl: 'linksharing',
      docid: 'DOC123',
      process: 'update_docstatus_reqstatus_insert_time',
      session_id: '48291037',
      docstatus: '8',
      requeststatus: '7'
    });
  });

  it('builds getrequeststatus_process poll payload', () => {
    const payload = core.buildGetRequestStatusPayload({
      docId: 'DOC123',
      sessionId: '48291037',
      requestId: '384729184',
      sessionStartTime: '1700000001000'
    });

    expect(payload).toMatchObject({
      tbl: 'linksharing',
      docid: 'DOC123',
      process: 'getrequeststatus_process',
      session_id: '48291037',
      requestid: '384729184',
      session_start_time: '1700000001000'
    });
  });
});

describe('LinkSessionCore isActiveSessionRecord', () => {
  let core;

  beforeAll(() => {
    const LinkSessionCore = loadLinkSessionCore();
    core = new LinkSessionCore();
  });

  it('accepts matching active session row', () => {
    const ok = core.isActiveSessionRecord(
      {
        docid: 'DOC123',
        session_id: '48291037',
        session_start_time: '1700000000000',
        session_end_time: '0',
        docstatus: '1'
      },
      {
        docId: 'DOC123',
        sessionId: '48291037',
        sessionStartTime: '1700000000000'
      }
    );
    expect(ok).toBe(true);
  });

  it('rejects session_start_time mismatch', () => {
    const ok = core.isActiveSessionRecord(
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

  it('rejects closed session rows', () => {
    const ok = core.isActiveSessionRecord(
      {
        docid: 'DOC123',
        session_id: '48291037',
        session_end_time: '1700000005000',
        docstatus: '1'
      },
      { docId: 'DOC123', sessionId: '48291037' }
    );
    expect(ok).toBe(false);
  });
});

describe('LinkSessionCore landing context state', () => {
  let core;

  beforeAll(() => {
    const LinkSessionCore = loadLinkSessionCore();
    core = new LinkSessionCore();
  });

  it('merges captured landing ctx fields into later ctx objects', () => {
    core.captureLandingCtxState({
      sessionStartTime: '1700000000000',
      grantSessionStartTime: '1700000001000',
      docId: 'DOC123',
      sessionId: '48291037',
      requestId: '384729184'
    });

    const merged = core.mergeLandingCtxState({ docId: 'DOC123' });
    expect(merged).toMatchObject({
      sessionStartTime: '1700000000000',
      grantSessionStartTime: '1700000001000',
      sessionId: '48291037',
      requestId: '384729184'
    });
  });
});
