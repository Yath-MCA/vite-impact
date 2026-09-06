# Localhost Session Bypass, ShareKey Gate & LinkShare Payload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shareKey-first session context resolution, Approach A linkShare base+process payloads, SessionGuard/GlobalBridge stage validation with `devLog`, and localhost-only verify bypass when the linkShare DB row is missing.

**Architecture:** Resolve canonical `ctx` from `localStorage` `xmleditor:shared:{docId}` (else GET_DOCS). Build write payloads from `buildBaseLinkSharePayload(ctx)` plus process deltas. `SessionGuard.checkStage(stage, ctx)` always validates; on failure + localhost → bypass with remarks. `verifySession` applies the same bypass after real verify when shareKey/`ctx` is present. GlobalBridge stages log only via `devLog`.

**Tech Stack:** Existing React/Vite session services, Vitest + happy-dom, existing `devLog` / `isLocalHost`.

**Spec:** `docs/superpowers/specs/2026-09-07-localhost-session-bypass-sharekey-payload-design.md`

## Global Constraints

- ShareKey storage key is only `xmleditor:shared:{docId}` (`LOCAL_STORAGE_KEYS.SHARED_PREFIX`).
- No localhost bypass without a usable shareKey/`ctx` (localStorage or GET_DOCS).
- Localhost bypass applies everywhere `verifySession` runs (centralize in `verifySession` so landing/bootstrap/grant inherit it).
- Non-local environments remain fail-closed on verify failure.
- All new stage/operator logs use `devLog` (never raw `console.log` in GlobalBridge/SessionGuard for these paths).
- Do not restore banned globals into active React editor page flow.
- Keep `public/legacy-editor/**` out of scope.
- Tests: `tests/unit/**/*.test.js` (and existing `.test.jsx` include). Prefer Vitest mocks already used in session tests.
- `SessionGuard.checkStage` stays **synchronous**: if `ctx` is omitted, sync-read localStorage shared key only. Async GET_DOCS recovery stays in `resolveShareKeyContext`; callers that need network recovery must await it and pass `ctx`.

---

## File Structure

```
src/services/session/
  shareKeyContext.js          # NEW — resolveShareKeyContext + sync localStorage reader
  sessionPayloads.js          # MOD — buildBaseLinkSharePayload + process builders
  sessionConstants.js         # MOD — bypass/guard remark strings
  sessionGateway.js           # MOD — verifySession localhost bypass
  editorSessionBootstrap.js   # MOD — shareKey-first before verify
  index.js                    # MOD — exports

src/services/core/
  SessionGuard.js             # MOD — checkStage(stage, ctx) result object + bypass

src/services/bridge/
  GlobalBridge.js             # MOD — devLog + guard with ctx

tests/unit/session/
  shareKeyContext.test.js     # NEW
  sessionPayloads.test.js     # MOD
  sessionGatewayBypass.test.js # NEW
  editorSessionBootstrap.test.js  # MOD

tests/unit/core/
  sessionGuard.test.js        # NEW

tests/unit/bridge/
  globalBridge.test.js        # MOD
```

---

### Task 1: ShareKey context resolver

**Files:**
- Create: `src/services/session/shareKeyContext.js`
- Modify: `src/services/session/index.js`
- Test: `tests/unit/session/shareKeyContext.test.js`

**Interfaces:**
- Consumes: `LOCAL_STORAGE_KEYS`, `normalizeSessionSource`, `toSessionContext`, `recoverEditorSessionByDocId`, `saveLegacyLocalStorageData`
- Produces:
  - `readShareKeyFromLocalStorage(docId): object | null`
  - `resolveShareKeyContext(docId): Promise<{ ok: boolean, ctx?: object, source: 'localStorage'|'getdocs'|'none', message?: string }>`

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/session/shareKeyContext.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';

vi.mock('../../../src/services/session/sessionGateway.js', () => ({
  recoverEditorSessionByDocId: vi.fn()
}));

import { LOCAL_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';
import { recoverEditorSessionByDocId } from '../../../src/services/session/sessionGateway.js';
import {
  readShareKeyFromLocalStorage,
  resolveShareKeyContext
} from '../../../src/services/session/shareKeyContext.js';

describe('shareKeyContext', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    vi.clearAllMocks();
  });

  it('reads matching shared payload from localStorage', () => {
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`,
      JSON.stringify({ docid: 'DOC1', client: 'LWW', username: 'a@b.com', roleid: '1', rolename: 'Author' })
    );

    const raw = readShareKeyFromLocalStorage('DOC1');
    expect(raw.docid).toBe('DOC1');
    expect(raw.client).toBe('LWW');
  });

  it('resolves ctx from localStorage without calling GET_DOCS', async () => {
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`,
      JSON.stringify({ docid: 'DOC1', client: 'LWW', username: 'a@b.com', roleid: '1', rolename: 'Author' })
    );

    const result = await resolveShareKeyContext('DOC1');

    expect(result.ok).toBe(true);
    expect(result.source).toBe('localStorage');
    expect(result.ctx.docId).toBe('DOC1');
    expect(result.ctx.client).toBe('LWW');
    expect(recoverEditorSessionByDocId).not.toHaveBeenCalled();
  });

  it('falls back to GET_DOCS when localStorage shared is missing', async () => {
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: true,
      docData: {
        docid: 'DOC1',
        client: 'LWW',
        username: 'b@b.com',
        roleid: '2',
        rolename: 'Reviewer',
        apikey: 'k1',
        emailto: 'b@b.com'
      }
    });

    const result = await resolveShareKeyContext('DOC1');

    expect(recoverEditorSessionByDocId).toHaveBeenCalledWith('DOC1');
    expect(result.ok).toBe(true);
    expect(result.source).toBe('getdocs');
    expect(result.ctx.docId).toBe('DOC1');
    expect(localStorage.getItem(`${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`)).toBeTruthy();
  });

  it('returns not ok when docId missing', async () => {
    await expect(resolveShareKeyContext('')).resolves.toEqual({
      ok: false,
      source: 'none',
      message: 'Missing document id.'
    });
  });

  it('returns not ok when localStorage and GET_DOCS both fail', async () => {
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.'
    });

    const result = await resolveShareKeyContext('DOC1');
    expect(result.ok).toBe(false);
    expect(result.source).toBe('none');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/session/shareKeyContext.test.js`

Expected: FAIL (module missing).

- [ ] **Step 3: Implement resolver**

Create `src/services/session/shareKeyContext.js`:

```js
import { LOCAL_STORAGE_KEYS } from './sessionConstants.js';
import { normalizeSessionSource, toSessionContext } from './sessionSource.js';
import { recoverEditorSessionByDocId } from './sessionGateway.js';
import { saveLegacyLocalStorageData } from './sessionStorage.js';

export function readShareKeyFromLocalStorage(docId) {
  if (!docId || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEYS.SHARED_PREFIX}${docId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const sharedDocId = String(parsed.docid || parsed.docId || '');
    if (sharedDocId && sharedDocId !== String(docId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function toCtxFromDocData(docData, validateResponse = null) {
  const sessionSource = normalizeSessionSource(docData, validateResponse);
  return toSessionContext(sessionSource);
}

export async function resolveShareKeyContext(docId) {
  if (!docId) {
    return { ok: false, source: 'none', message: 'Missing document id.' };
  }

  const local = readShareKeyFromLocalStorage(docId);
  if (local) {
    return {
      ok: true,
      source: 'localStorage',
      ctx: toCtxFromDocData({ ...local, docid: docId })
    };
  }

  const recovery = await recoverEditorSessionByDocId(docId);
  if (!recovery.ok) {
    return {
      ok: false,
      source: 'none',
      message: recovery.message || 'Unable to resolve shareKey context.'
    };
  }

  const docData = { ...recovery.docData, docid: docId };
  saveLegacyLocalStorageData(docData);

  return {
    ok: true,
    source: 'getdocs',
    ctx: toCtxFromDocData(docData)
  };
}
```

In `src/services/session/index.js`, add:

```js
export * from './shareKeyContext.js';
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- tests/unit/session/shareKeyContext.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/session/shareKeyContext.js src/services/session/index.js tests/unit/session/shareKeyContext.test.js
git commit -m "feat: resolve shareKey session context from storage or GET_DOCS"
```

---

### Task 2: Base linkShare payload + process builders

**Files:**
- Modify: `src/services/session/sessionPayloads.js`
- Modify: `tests/unit/session/sessionPayloads.test.js`

**Interfaces:**
- Consumes: session `ctx` fields (`docId`, `client`, `username`, `role`, `rolename`, `roleid`, …)
- Produces: `buildBaseLinkSharePayload(ctx)`; process builders spread base then add deltas

- [ ] **Step 1: Write/extend failing tests**

Add to `tests/unit/session/sessionPayloads.test.js`:

```js
import { buildBaseLinkSharePayload } from '../../../src/services/session/sessionPayloads.js';

it('buildBaseLinkSharePayload includes ADD_DEFAULT_KEYS-aligned shareKey fields', () => {
  const base = buildBaseLinkSharePayload({
    docId: 'DOC123',
    client: 'LWW',
    username: 'author@journal.com',
    role: 'role-1',
    rolename: 'Author',
    roleid: 'role-1',
    identifier: '10.1161/x',
    dtd: 'JATS',
    linkinfo: 'pubkit',
    type: 'article',
    projecttitle: 'Sample',
    vendor: 'lww',
    shorttitle: 'AHAJ',
    collaborative: '1'
  });

  expect(base).toEqual({
    tbl: 'linksharing',
    docid: 'DOC123',
    client: 'LWW',
    username: 'author@journal.com',
    role: 'role-1',
    rolename: 'Author',
    roleid: 'role-1',
    identifier: '10.1161/x',
    dtd: 'JATS',
    linkinfo: 'pubkit',
    type: 'article',
    projecttitle: 'Sample',
    vendor: 'lww',
    shorttitle: 'AHAJ',
    collaborative: '1'
  });
});

it('buildCheckPayload includes base shareKey fields plus check deltas', () => {
  const payload = buildCheckPayload({
    docId: 'DOC123',
    sessionId: '48291037',
    sessionStartTime: '1700000000000',
    client: 'LWW',
    username: 'author@example.com',
    role: 'role-1',
    rolename: 'Author',
    roleid: 'role-1',
    identifier: 'id-1',
    dtd: 'JATS',
    linkinfo: 'pubkit',
    type: 'article',
    projecttitle: 'Title',
    vendor: 'lww',
    shorttitle: 'J'
  });

  expect(payload).toMatchObject({
    tbl: 'linksharing',
    process: 'check',
    docid: 'DOC123',
    session_id: '48291037',
    session_start_time: '1700000000000',
    client: 'LWW',
    roleid: 'role-1',
    identifier: 'id-1',
    dtd: 'JATS',
    projecttitle: 'Title',
    vendor: 'lww',
    shorttitle: 'J'
  });
});
```

Update existing check-payload expectations if needed so they still pass with the richer base.

- [ ] **Step 2: Run tests to verify new assertions fail**

Run: `npm run test:unit -- tests/unit/session/sessionPayloads.test.js`

Expected: FAIL on missing `buildBaseLinkSharePayload` / missing fields.

- [ ] **Step 3: Implement base + refactor builders**

In `sessionPayloads.js`, replace write-builder `basePayload` usage with:

```js
export function buildBaseLinkSharePayload(ctx = {}) {
  const payload = {
    tbl: 'linksharing',
    docid: ctx.docId || ctx.docid || '',
    client: ctx.client || '',
    username: ctx.username || '',
    role: ctx.role || ctx.roleid || '',
    rolename: ctx.rolename || '',
    roleid: ctx.roleid || ctx.role || '',
    identifier: ctx.identifier || '',
    dtd: ctx.dtd || '',
    linkinfo: ctx.linkinfo || '',
    type: ctx.type || '',
    projecttitle: ctx.projecttitle || '',
    vendor: ctx.vendor || '',
    shorttitle: ctx.shorttitle || ''
  };

  if (ctx.collaborative !== undefined && ctx.collaborative !== null && ctx.collaborative !== '') {
    payload.collaborative = ctx.collaborative;
  }

  return payload;
}

export function buildCheckPayload(ctx) {
  const payload = {
    ...buildBaseLinkSharePayload(ctx),
    process: SESSION_PROCESS.CHECK,
    session_id: String(ctx.sessionId),
    session_start_time: String(ctx.sessionStartTime || getSessionStartTime()),
    remarks: ctx.remarks || SESSION_REMARKS.USER_ACCEPT_OPEN_DOC
  };
  if (ctx.tabid) payload.tabid = String(ctx.tabid);
  return payload;
}

export function buildUpdateReqStatusTimePayload(ctx) {
  const payload = {
    ...buildBaseLinkSharePayload(ctx),
    process: SESSION_PROCESS.UPDATE_REQSTATUS_TIME,
    requeststatus: REQUEST_STATUS.PENDING,
    request_send_time: String(ctx.requestSendTime || Date.now()),
    requestid: String(ctx.requestId),
    username: ctx.username,
    role: ctx.role,
    rolename: ctx.rolename
  };
  if (ctx.oldrequestid) payload.oldrequestid = String(ctx.oldrequestid);
  if (ctx.oldrequest_send_time) payload.oldrequest_send_time = String(ctx.oldrequest_send_time);
  return payload;
}

export function buildStaleCleanupPayload(ctx) {
  return {
    ...buildBaseLinkSharePayload(ctx),
    process: SESSION_PROCESS.UPDATE_DOCSTATUS_REQSTATUS_INSERT_TIME,
    session_id: String(ctx.sessionId),
    session_start_time: String(ctx.sessionStartTime || getSessionStartTime()),
    docstatus: DOC_STATUS.STALE,
    requeststatus: REQUEST_STATUS.STALE
  };
}

export function buildPollPayload(ctx) {
  return {
    ...buildBaseLinkSharePayload(ctx),
    process: SESSION_PROCESS.GET_REQUESTSTATUS_PROCESS,
    session_id: String(ctx.sessionId),
    requestid: String(ctx.requestId),
    session_start_time: String(ctx.sessionStartTime || getSessionStartTime())
  };
}

export function buildClosePayload(ctx = {}) {
  const payload = {
    ...buildBaseLinkSharePayload(ctx),
    process: SESSION_PROCESS.CLOSE,
    session_end_time: String(ctx.sessionEndTime || Date.now()),
    remarks: ctx.remarks || SESSION_REMARKS.USER_MANUAL_LOGOUT
  };
  if (ctx.sessionId) payload.session_id = String(ctx.sessionId);
  return payload;
}
```

Keep `buildVerifyQuery` read-shaped (no write base merge). Remove unused `basePayload` if nothing else needs it.

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- tests/unit/session/sessionPayloads.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/session/sessionPayloads.js tests/unit/session/sessionPayloads.test.js
git commit -m "feat: build linkShare payloads from shared shareKey base"
```

---

### Task 3: SessionGuard stage validation with localhost bypass

**Files:**
- Modify: `src/services/core/SessionGuard.js`
- Modify: `src/services/session/sessionConstants.js`
- Test: `tests/unit/core/sessionGuard.test.js`

**Interfaces:**
- Consumes: `isLocalHost`, `devLog`, `readShareKeyFromLocalStorage`, `SESSION_STORAGE_KEYS.DOC_ID`, remark constants
- Produces: `checkStage(stage, ctx?) => { ok, bypassed, stage, remarks }`

- [ ] **Step 1: Add remark constants**

In `sessionConstants.js`:

```js
export const SESSION_GUARD_REMARKS = {
  MISSING_DOC_ID: 'guard_fail:missing_doc_id',
  MISSING_SHARE_KEY: 'guard_fail:missing_share_key',
  DOCID_MISMATCH: 'guard_fail:share_key_docid_mismatch',
  LOCALHOST_BYPASS_PREFIX: 'localhost_bypass:'
};
```

- [ ] **Step 2: Write failing SessionGuard tests**

Create `tests/unit/core/sessionGuard.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';

vi.mock('../../../src/services/session/runtimeFlags.js', () => ({
  isLocalHost: vi.fn(() => false)
}));

vi.mock('../../../src/shared/utils/devLogger.js', () => ({
  devLog: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';
import { devLog } from '../../../src/shared/utils/devLogger.js';
import { LOCAL_STORAGE_KEYS, SESSION_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';
import SessionGuard from '../../../src/services/core/SessionGuard.js';

describe('SessionGuard.checkStage', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    vi.clearAllMocks();
    isLocalHost.mockReturnValue(false);
  });

  it('passes when ctx has matching docId', () => {
    const guard = new SessionGuard();
    const result = guard.checkStage('init', { docId: 'DOC1', client: 'LWW' });
    expect(result).toEqual({ ok: true, bypassed: false, stage: 'init', remarks: '' });
  });

  it('fails closed when shareKey/ctx missing and not localhost', () => {
    const guard = new SessionGuard();
    const result = guard.checkStage('loading', null);
    expect(result.ok).toBe(false);
    expect(result.bypassed).toBe(false);
    expect(result.remarks).toBe('guard_fail:missing_doc_id');
  });

  it('bypasses on localhost when validation fails', () => {
    isLocalHost.mockReturnValue(true);
    const guard = new SessionGuard();
    const result = guard.checkStage('editorInit', null);
    expect(result.ok).toBe(true);
    expect(result.bypassed).toBe(true);
    expect(result.remarks).toContain('localhost_bypass:');
    expect(devLog.warn).toHaveBeenCalled();
  });

  it('reads localStorage shared key when ctx omitted but docid is in sessionStorage', () => {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.DOC_ID, 'DOC1');
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`,
      JSON.stringify({ docid: 'DOC1', client: 'LWW' })
    );
    const guard = new SessionGuard();
    const result = guard.checkStage('init');
    expect(result.ok).toBe(true);
    expect(result.bypassed).toBe(false);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/core/sessionGuard.test.js`

Expected: FAIL (old boolean API / wrong storage).

- [ ] **Step 4: Implement SessionGuard**

Replace `src/services/core/SessionGuard.js` with:

```js
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
```

- [ ] **Step 5: Run tests**

Run: `npm run test:unit -- tests/unit/core/sessionGuard.test.js`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/core/SessionGuard.js src/services/session/sessionConstants.js tests/unit/core/sessionGuard.test.js
git commit -m "feat: validate SessionGuard stages with localhost bypass remarks"
```

---

### Task 4: Localhost bypass inside `verifySession`

**Files:**
- Modify: `src/services/session/sessionGateway.js`
- Test: `tests/unit/session/sessionGatewayBypass.test.js`

**Interfaces:**
- Consumes: existing verify logic, `isLocalHost`, `readShareKeyFromLocalStorage`, `devLog`
- Produces: `verifySession` may return `{ ok: true, bypassed: true, remarks, reason }` on localhost after failed real verify when shareKey/`ctx` is usable

- [ ] **Step 1: Write failing bypass tests**

Create `tests/unit/session/sessionGatewayBypass.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';

vi.mock('../../../src/services/api/apiService.js', () => ({
  API_ENDPOINTS: { GET_DOCS: '/getdocs', LINK_SHARE: '/linksharing' },
  apiService: { makeRequest: vi.fn() }
}));

vi.mock('../../../src/services/session/runtimeFlags.js', () => ({
  isLocalHost: vi.fn(() => false)
}));

vi.mock('../../../src/shared/utils/devLogger.js', () => ({
  devLog: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { apiService } from '../../../src/services/api/apiService.js';
import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';
import { LOCAL_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';
import { verifySession } from '../../../src/services/session/sessionGateway.js';

describe('verifySession localhost bypass', () => {
  beforeEach(() => {
    installBrowserStorageMocks();
    vi.clearAllMocks();
    isLocalHost.mockReturnValue(false);
  });

  it('fails when no active row and not localhost', async () => {
    apiService.makeRequest.mockResolvedValueOnce({ data: [] });
    const result = await verifySession({
      docId: 'DOC1',
      sessionId: 'SID1',
      username: 'a@b.com',
      rolename: 'Author'
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_active_row');
  });

  it('bypasses on localhost when no active row and shareKey exists', async () => {
    isLocalHost.mockReturnValue(true);
    localStorage.setItem(
      `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}DOC1`,
      JSON.stringify({ docid: 'DOC1', client: 'LWW', username: 'a@b.com' })
    );
    apiService.makeRequest.mockResolvedValueOnce({ data: [] });

    const result = await verifySession({
      docId: 'DOC1',
      sessionId: 'SID1',
      username: 'a@b.com',
      rolename: 'Author',
      client: 'LWW'
    });

    expect(result.ok).toBe(true);
    expect(result.bypassed).toBe(true);
    expect(result.remarks).toBe('localhost_bypass:no_linkshare_row');
  });

  it('does not bypass on localhost without shareKey', async () => {
    isLocalHost.mockReturnValue(true);
    apiService.makeRequest.mockResolvedValueOnce({ data: [] });

    const result = await verifySession({
      docId: 'DOC1',
      sessionId: 'SID1'
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe('no_active_row');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/session/sessionGatewayBypass.test.js`

Expected: FAIL (no bypass behavior yet).

- [ ] **Step 3: Implement bypass helper inside gateway**

In `sessionGateway.js`, import `isLocalHost`, `devLog`, `readShareKeyFromLocalStorage`. Add:

```js
function hasUsableShareKey(ctx) {
  if (!ctx?.docId) return false;
  if (ctx.client || ctx.username || ctx.rolename) return true;
  return Boolean(readShareKeyFromLocalStorage(ctx.docId));
}

function withLocalhostVerifyBypass(failed, ctx) {
  if (!failed || failed.ok) return failed;
  if (!isLocalHost()) return failed;
  if (!hasUsableShareKey(ctx)) return failed;

  const remarks =
    failed.reason === 'no_active_row'
      ? 'localhost_bypass:no_linkshare_row'
      : `localhost_bypass:verify_failed:${failed.reason || 'unknown'}`;

  devLog.warn('[verifySession]', remarks, failed.reason);
  return {
    ...failed,
    ok: true,
    bypassed: true,
    remarks
  };
}
```

Update `verifySession` so every failure return goes through `withLocalhostVerifyBypass(...)`, wrap the GET_DOCS call in try/catch for `network_error`, and successful returns include `bypassed: false`.

- [ ] **Step 4: Run bypass + existing gateway tests**

```bash
npm run test:unit -- tests/unit/session/sessionGatewayBypass.test.js tests/unit/session/sessionGateway.test.js tests/unit/session/sessionGatewayRecovery.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/session/sessionGateway.js tests/unit/session/sessionGatewayBypass.test.js
git commit -m "feat: bypass linkShare verify on localhost when shareKey exists"
```

---

### Task 5: Bootstrap shareKey-first gate

**Files:**
- Modify: `src/services/session/editorSessionBootstrap.js`
- Modify: `tests/unit/session/editorSessionBootstrap.test.js`

**Interfaces:**
- Consumes: `resolveShareKeyContext`, existing storage/recovery/verify
- Produces: bootstrap fails if shareKey/`ctx` cannot be resolved; verify may succeed via Task 4 bypass

- [ ] **Step 1: Extend bootstrap tests**

In `editorSessionBootstrap.test.js`, add mock:

```js
vi.mock('../../../src/services/session/shareKeyContext.js', () => ({
  resolveShareKeyContext: vi.fn()
}));

import { resolveShareKeyContext } from '../../../src/services/session/shareKeyContext.js';
```

In `beforeEach` / success paths, set:

```js
resolveShareKeyContext.mockResolvedValue({
  ok: true,
  source: 'localStorage',
  ctx: { docId: 'DOC1', client: 'LWW', username: 'a@b.com', roleid: '1', rolename: 'Author' }
});
```

Add:

```js
it('blocks when shareKey context cannot be resolved', async () => {
  getStoredEditorSession.mockReturnValueOnce({
    docId: 'DOC1',
    sessionId: 'SID1',
    sessionStartTime: '100',
    validateKey: 'KEY1',
    validateResponse: { data: { docid: 'DOC1' } }
  });
  resolveShareKeyContext.mockResolvedValueOnce({
    ok: false,
    source: 'none',
    message: 'Unable to resolve shareKey context.'
  });

  await expect(bootstrapEditorSession({ docId: 'DOC1' })).resolves.toEqual({
    ok: false,
    reason: 'missing_share_key',
    message: 'Unable to resolve shareKey context.',
    redirectTo: '/validateurl'
  });
  expect(verifySession).not.toHaveBeenCalled();
});
```

Preferred order:

1. resolve docId
2. read stored session / recover session id as today
3. `resolveShareKeyContext(resolvedDocId)` — required
4. merge shareKey `ctx` into verify context
5. `verifySession` (inherits localhost bypass)

On success, include `bypassed: verify.bypassed === true` on the bootstrap result.

- [ ] **Step 2: Run tests expecting failure**

Run: `npm run test:unit -- tests/unit/session/editorSessionBootstrap.test.js`

Expected: FAIL until bootstrap calls resolver.

- [ ] **Step 3: Implement bootstrap shareKey gate**

Import `resolveShareKeyContext`. After `sessionId` is known and before verify:

```js
  const shareKey = await resolveShareKeyContext(resolvedDocId);
  if (!shareKey.ok) {
    return {
      ok: false,
      reason: 'missing_share_key',
      message: shareKey.message || 'ShareKey details are required.',
      redirectTo: '/validateurl'
    };
  }

  const sessionSource = normalizeSessionSource(docData, validateResponse);
  const userInfo = buildUserInfo(sessionSource);
  const verify = await verifySession({
    ...toSessionContext(sessionSource),
    ...shareKey.ctx,
    docId: resolvedDocId,
    sessionId,
    sessionStartTime,
    username: userInfo.username || shareKey.ctx.username
  });

  if (!verify.ok) {
    return {
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    };
  }

  return {
    ok: true,
    docId: resolvedDocId,
    sessionId,
    sessionStartTime,
    validateKey: stored.validateKey || '',
    sessionSource,
    userInfo,
    recovered,
    bypassed: verify.bypassed === true
  };
```

- [ ] **Step 4: Run tests**

Run: `npm run test:unit -- tests/unit/session/editorSessionBootstrap.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/session/editorSessionBootstrap.js tests/unit/session/editorSessionBootstrap.test.js
git commit -m "feat: require shareKey context before editor session verify"
```

---

### Task 6: GlobalBridge `devLog` + stage guard with ctx

**Files:**
- Modify: `src/services/bridge/GlobalBridge.js`
- Modify: `tests/unit/bridge/globalBridge.test.js`

**Interfaces:**
- Consumes: `devLog`, `SessionGuard.checkStage`, `readShareKeyFromLocalStorage`, initService docId
- Produces: stage logs only via `devLog`; guard called with best-effort ctx

- [ ] **Step 1: Write/adjust bridge test**

In `globalBridge.test.js`:

```js
vi.mock('../../../src/shared/utils/devLogger.js', () => ({
  devLog: { log: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { devLog } from '../../../src/shared/utils/devLogger.js';

it('logs GlobalBridge stages through devLog', () => {
  const services = createServices();
  new GlobalBridge(services).init();
  expect(devLog.log).toHaveBeenCalled();
  const messages = devLog.log.mock.calls.map((call) => String(call[0]));
  expect(messages.some((m) => m.includes('[GlobalBridge]'))).toBe(true);
});
```

- [ ] **Step 2: Run test expecting failure**

Run: `npm run test:unit -- tests/unit/bridge/globalBridge.test.js`

Expected: FAIL until `devLog` is used.

- [ ] **Step 3: Wire GlobalBridge**

Imports:

```js
import SessionGuard from '../core/SessionGuard';
import { devLog } from '../../shared/utils/devLogger.js';
import { readShareKeyFromLocalStorage } from '../session/shareKeyContext.js';
```

Add helpers:

```js
GlobalBridge.prototype.getSessionGuardCtx = function() {
  var docId = null;
  try {
    docId = this.services.initService && this.services.initService.getDocId
      ? this.services.initService.getDocId()
      : null;
  } catch (e) {}
  if (!docId && typeof sessionStorage !== 'undefined') {
    docId = sessionStorage.getItem('docid') || sessionStorage.getItem('DOC_ID');
  }
  if (!docId) return null;
  var shared = readShareKeyFromLocalStorage(docId);
  if (shared) {
    return {
      docId: docId,
      docid: docId,
      client: shared.client,
      username: shared.username || shared.emailto
    };
  }
  return { docId: docId, docid: docId };
};

GlobalBridge.prototype.runStageGuard = function(stage) {
  var ctx = this.getSessionGuardCtx();
  var result = this.sessionGuard.checkStage(stage, ctx);
  if (result.bypassed || !result.ok) {
    devLog.warn('[GlobalBridge]', stage, result.remarks);
  } else {
    devLog.log('[GlobalBridge]', stage, 'guard ok');
  }
  return result;
};
```

Replace each `import.meta.env.DEV` + `console.log` + `checkStage` block with:

```js
devLog.log('[GlobalBridge] init start');
self.runStageGuard('init');
// ...
devLog.log('[GlobalBridge] init complete');
```

Same for `loading` and `editorInit`. Replace `InitialLoadDialog.init` raw `console.log` with `devLog.log`.

- [ ] **Step 4: Run bridge tests**

Run: `npm run test:unit -- tests/unit/bridge/globalBridge.test.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/services/bridge/GlobalBridge.js tests/unit/bridge/globalBridge.test.js
git commit -m "feat: gate GlobalBridge stages with devLog and SessionGuard ctx"
```

---

### Task 7: Integration verification

**Files:**
- Modify only if tests reveal gaps.

- [ ] **Step 1: Run session + bridge + core unit suites**

```bash
npm run test:unit -- tests/unit/session tests/unit/bridge tests/unit/core tests/unit/save tests/unit/landing
```

Expected: PASS.

- [ ] **Step 2: Run build**

```bash
npm run build:local
```

Expected: PASS. If `public/env.js` regenerates: `git restore -- public/env.js`

- [ ] **Step 3: Grep for leftover raw stage logs in active bridge/guard**

```bash
rg -n "console\\.(log|warn).*\\[(GlobalBridge|SessionGuard)\\]|import\\.meta\\.env\\.DEV" src/services/bridge/GlobalBridge.js src/services/core/SessionGuard.js
```

Expected: no stage logging via raw console / DEV gates in those files (`devLog` only).

- [ ] **Step 4: Commit only if fixes were required**

```bash
git add src tests
git commit -m "test: verify localhost shareKey session bypass flow"
```

If no changes, do not create an empty commit.

---

## Self-Review

**Spec coverage:**
- ShareKey resolve localStorage → GET_DOCS → Tasks 1, 5
- Approach A base + process payloads → Task 2
- SessionGuard every stage + localhost bypass remarks → Task 3
- Verify everywhere via centralized `verifySession` bypass → Task 4
- Bootstrap shareKey mandatory → Task 5
- GlobalBridge `devLog` + guard ctx → Task 6
- Integration → Task 7

**Placeholder scan:** No TBD/TODO/vague steps; tests and implementation snippets included.

**Type consistency:** `resolveShareKeyContext` → `{ ok, ctx, source, message? }`; `checkStage` → `{ ok, bypassed, stage, remarks }`; verify bypass → `{ ok: true, bypassed: true, remarks }`; shared key prefix `xmleditor:shared:{docId}` consistent.
