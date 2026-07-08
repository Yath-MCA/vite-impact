import { apiService, API_ENDPOINTS } from '../api/apiService.js';
import { sessionConfig } from './sessionConfig.js';
import { REQUEST_STATUS } from './sessionConstants.js';
import {
  buildCheckPayload,
  buildVerifyQuery,
  buildUpdateReqStatusTimePayload,
  buildStaleCleanupPayload,
  buildPollPayload,
  isActiveSessionRecord,
  minutesSince,
  generateSessionId,
  generateRequestId,
  getSessionStartTime
} from './sessionPayloads.js';
import { commitSessionForEditor } from './sessionStorage.js';

function enrichLinkSharePayload(payload, ctx) {
  const next = { ...payload };
  if (ctx.username && !next.username) next.username = ctx.username;
  if (ctx.role && !next.role) next.role = ctx.role;
  if (ctx.rolename && !next.rolename) next.rolename = ctx.rolename;
  if (ctx.collaborative === '1' || ctx.collaborative === true) {
    next.collaborative = '1';
  }
  delete next._w;
  delete next._r;
  return next;
}

async function postLinkShare(payload, ctx) {
  return apiService.makeRequest(API_ENDPOINTS.LINK_SHARE, enrichLinkSharePayload(payload, ctx));
}

async function postGetDocs(query) {
  return apiService.makeRequest(API_ENDPOINTS.GET_DOCS, query);
}

export async function verifySession(ctx) {
  if (!ctx?.docId || !ctx?.sessionId) {
    return { ok: false, reason: 'missing_expected_fields' };
  }

  const response = await postGetDocs(buildVerifyQuery(ctx));
  const rows = Array.isArray(response?.data) ? response.data : [];

  if (rows.length === 0) return { ok: false, reason: 'no_active_row', rows };
  if (rows.length > 1) return { ok: false, reason: 'multiple_active', rows };

  const row = rows[0];
  if (!isActiveSessionRecord(row, ctx)) {
    return { ok: false, reason: 'record_mismatch', row, rows };
  }

  return { ok: true, row, rows };
}

export async function checkSession(ctx) {
  const sessionId = ctx.sessionId || generateSessionId();
  const sessionStartTime = ctx.sessionStartTime || getSessionStartTime();
  const payload = buildCheckPayload({
    ...ctx,
    sessionId,
    sessionStartTime,
    remarks: 'login'
  });

  const response = await postLinkShare(payload, ctx);
  return {
    response,
    sessionId,
    sessionStartTime
  };
}

export async function sendAccessRequest(ctx, checkResponse) {
  const now = Date.now();
  const requestId = ctx.requestId || generateRequestId();
  const requeststatus = checkResponse?.requeststatus;
  const requestSendTime = checkResponse?.request_send_time;
  const requestid = checkResponse?.requestid;
  const throttle = sessionConfig.requestThrottleMinutes;

  if (String(requeststatus) === REQUEST_STATUS.PENDING) {
    if (minutesSince(requestSendTime) > throttle) {
      const sessionStartTime = String(now);
      const response = await postLinkShare(
        buildStaleCleanupPayload({ ...ctx, sessionId: ctx.sessionId, sessionStartTime }),
        ctx
      );
      return { type: 'stale_cleanup', response, requestId, sessionStartTime };
    }
    return { type: 'try_again', reason: 'pending_within_throttle' };
  }

  if (
    String(requeststatus) === REQUEST_STATUS.REJECTED &&
    requestid != null && requestid !== 0 && requestid !== '0' &&
    requestSendTime != null && requestSendTime !== 0 && requestSendTime !== '0'
  ) {
    if (minutesSince(requestSendTime) > throttle) {
      const response = await postLinkShare(
        buildUpdateReqStatusTimePayload({
          ...ctx,
          requestId,
          requestSendTime: String(now),
          oldrequestid: String(requestid),
          oldrequest_send_time: String(requestSendTime)
        }),
        ctx
      );
      return { type: 'resend', response, requestId };
    }
    return { type: 'try_again', reason: 'rejected_within_throttle' };
  }

  const response = await postLinkShare(
    buildUpdateReqStatusTimePayload({
      ...ctx,
      requestId,
      requestSendTime: String(now)
    }),
    ctx
  );
  return { type: 'new_request', response, requestId };
}

export async function pollAccessRequest(ctx) {
  const sessionStartTime = ctx.grantSessionStartTime || ctx.sessionStartTime || getSessionStartTime();
  const payload = buildPollPayload({
    ...ctx,
    sessionStartTime
  });
  const response = await postLinkShare(payload, ctx);
  return { response, sessionStartTime };
}

export async function completeGrant(ctx, options = {}) {
  const skipVerify = options.skipVerify === true;

  if (!skipVerify) {
    const verify = await verifySession({
      docId: ctx.docId,
      sessionId: ctx.sessionId,
      sessionStartTime: ctx.grantSessionStartTime || ctx.sessionStartTime,
      rolename: ctx.rolename,
      username: ctx.username
    });
    if (!verify.ok) {
      return { ok: false, verify };
    }
  }

  commitSessionForEditor({
    docId: ctx.docId,
    sessionId: ctx.sessionId,
    redirectUrl: typeof window !== 'undefined' ? window.location.href : ''
  });

  return { ok: true };
}

export async function loginFromLanding(docData, options = {}) {
  const baseCtx = options.buildContext(docData);
  const { response, sessionId, sessionStartTime } = await checkSession(baseCtx);
  const ctx = { ...baseCtx, sessionId, sessionStartTime };
  const r = response?.r;

  if (r == 1) {
    const grant = await completeGrant(ctx, { skipVerify: false });
    if (grant.ok) return { status: 'granted', ctx };
    return { status: 'verify_failed', ctx, verify: grant.verify, checkResponse: response };
  }

  if (r == 0) {
    return { status: 'blocked', ctx, checkResponse: response };
  }

  if (r == 2) {
    return { status: 'denied', ctx, message: response?.remarks || 'NIL' };
  }

  return { status: 'unknown', ctx, checkResponse: response };
}

export async function continueBlockedSession(ctx, checkResponse) {
  const sendResult = await sendAccessRequest(ctx, checkResponse);

  if (sendResult.type === 'try_again') {
    return { status: 'try_again', reason: sendResult.reason };
  }

  if (sendResult.type === 'stale_cleanup') {
    if (sendResult.response?.r == 1) {
      const nextCtx = {
        ...ctx,
        sessionStartTime: sendResult.sessionStartTime,
        grantSessionStartTime: sendResult.sessionStartTime
      };
      const grant = await completeGrant(nextCtx, { skipVerify: false });
      if (grant.ok) return { status: 'granted', ctx: nextCtx };
      return { status: 'verify_failed', ctx: nextCtx, verify: grant.verify };
    }
    return { status: 'error', message: 'Unable to recover stale session request.' };
  }

  if (sendResult.response?.r != 1) {
    return { status: 'error', message: 'Unable to send access request.' };
  }

  return {
    status: 'waiting',
    ctx: { ...ctx, requestId: sendResult.requestId },
    waitMs: sessionConfig.pollTimeoutMs
  };
}

export async function pollAndResolve(ctx) {
  const { response } = await pollAccessRequest(ctx);
  const r = response?.r;

  if (r == 1) {
    const grant = await completeGrant(
      { ...ctx, grantSessionStartTime: ctx.sessionStartTime },
      { skipVerify: sessionConfig.skipVerifyOnPollGrant }
    );
    if (grant.ok) return { status: 'granted', ctx };
    return { status: 'verify_failed', ctx, verify: grant.verify };
  }

  if (r == 2) {
    return { status: 'denied', message: response?.remarks || 'NIL' };
  }

  return { status: 'try_again' };
}
