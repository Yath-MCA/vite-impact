# Editor Session Init Ownership Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `bootstrapEditorSession` a thin Init-style `run` orchestrator with named steps in `editorSessionSteps.js`, demote `InitService`/`INIT_CONFIG.run` as the React editor gate, and keep Phase 2 shareKey + verify behavior unchanged.

**Architecture:** Extract ordered steps (docId → load/recover → shareKey → userInfo → access → verify) into `editorSessionSteps.js`. `bootstrapEditorSession` only sequences steps and returns the existing result shape. Do not port admin fabricate / admin flag / banned globals. Optional localhost `xmleditor:login_*` fill when username is empty.

**Tech Stack:** Existing session services (`sessionStorage`, `sessionGateway`, `shareKeyContext`, `sessionSource`, `runtimeFlags`), Vitest + happy-dom.

**Spec:** `docs/superpowers/specs/2026-09-07-editor-session-init-ownership-design.md`

## Global Constraints

- React `/editor` session authority is **only** `bootstrapEditorSession` (via `useEditorSessionBootstrap`).
- Do **not** call `InitService.run` / `INIT_CONFIG.run` as a prerequisite to open the editor.
- Do **not** port `handleAdminInit`, `checkAdminStatus`, eventBus `init:*`, or `window.DOC_ID` / `USER_INFO` / `SHARED_KEY` writes into the React gate.
- ShareKey remains mandatory via existing `resolveShareKeyContext` (`xmleditor:shared:{docId}` then GET_DOCS).
- Localhost verify bypass stays inside `verifySession` (Phase 2); bootstrap only surfaces `bypassed`.
- Login fill keys (React AuthProvider): `xmleditor:login_username`, `xmleditor:login_userid` — only when username still empty **and** `isLocalHost()`.
- Keep `public/legacy-editor/**` out of scope.
- Preserve success/failure return shape consumed by `useEditorSessionBootstrap` / `SessionContext`.
- Tests live under `tests/unit/session/`; run with `npm run test:unit -- <path>`.

---

## File Structure

```
src/services/session/
  sessionConstants.js         # MOD — LOGIN_USERNAME / LOGIN_USERID keys
  editorSessionSteps.js       # NEW — named steps
  editorSessionBootstrap.js   # MOD — thin orchestrator; re-export resolveEditorDocId
  index.js                    # MOD — export steps if useful

src/services/bridge/
  GlobalBridge.js             # MOD — demotion comment on INIT_CONFIG.run (shim only)

tests/unit/session/
  editorSessionSteps.test.js  # NEW
  editorSessionBootstrap.test.js  # MOD — keep behavior; import resolveEditorDocId from steps or bootstrap re-export
```

---

### Task 1: Login storage keys + `editorSessionSteps`

**Files:**
- Modify: `src/services/session/sessionConstants.js`
- Create: `src/services/session/editorSessionSteps.js`
- Create: `tests/unit/session/editorSessionSteps.test.js`

**Interfaces:**
- Consumes: `getStoredEditorSession`, `commitSessionForEditor`, `recoverEditorSessionByDocId`, `verifySession`, `normalizeSessionSource`, `toSessionContext`, `isLocalHost`, `LOCAL_STORAGE_KEYS`
- Produces:
  - `resolveEditorDocId({ docId?, locationSearch? }): string`
  - `loadOrRecoverEditorSession({ docId, allowRecovery? }): Promise<{ ok, reason?, message?, redirectTo?, stored, validateResponse, docData, sessionId, sessionStartTime, recovered, validateKey }>`
  - `resolveEditorUserInfo({ sessionSource, shareKeyCtx? }): { username, roleId, roleName, uniqueId }`
  - `assertEditorAccess({ sessionId, userInfo }): { ok: true } | { ok: false, reason, message, redirectTo }`
  - `verifyEditorSession(ctx): Promise` — wraps `verifySession`; maps failure to bootstrap fail shape

- [ ] **Step 1: Add login keys to constants**

In `src/services/session/sessionConstants.js`, inside `LOCAL_STORAGE_KEYS`, add:

```js
  LOGIN_USERNAME: 'xmleditor:login_username',
  LOGIN_USERID: 'xmleditor:login_userid',
```

- [ ] **Step 2: Write failing step tests**

Create `tests/unit/session/editorSessionSteps.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../src/services/session/sessionStorage.js', () => ({
  getStoredEditorSession: vi.fn(),
  commitSessionForEditor: vi.fn(() => ({ ok: true, docId: 'DOC1' }))
}));

vi.mock('../../../src/services/session/sessionGateway.js', () => ({
  verifySession: vi.fn(),
  recoverEditorSessionByDocId: vi.fn()
}));

vi.mock('../../../src/services/session/runtimeFlags.js', () => ({
  isLocalHost: vi.fn(() => false)
}));

import {
  resolveEditorDocId,
  loadOrRecoverEditorSession,
  resolveEditorUserInfo,
  assertEditorAccess,
  verifyEditorSession
} from '../../../src/services/session/editorSessionSteps.js';
import {
  getStoredEditorSession,
  commitSessionForEditor
} from '../../../src/services/session/sessionStorage.js';
import {
  verifySession,
  recoverEditorSessionByDocId
} from '../../../src/services/session/sessionGateway.js';
import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';
import { LOCAL_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';

describe('resolveEditorDocId', () => {
  it('prefers explicit docId over query', () => {
    expect(resolveEditorDocId({ docId: 'DOC1', locationSearch: '?docid=DOC2' })).toBe('DOC1');
  });

  it('reads docid from query when explicit missing', () => {
    expect(resolveEditorDocId({ locationSearch: '?docid=DOC2' })).toBe('DOC2');
  });
});

describe('loadOrRecoverEditorSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns stored session without recovery when sessionId present', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      validateKey: 'KEY1',
      validateResponse: { data: { docid: 'DOC1', session_id: 'SID1' } }
    });

    const result = await loadOrRecoverEditorSession({ docId: 'DOC1' });

    expect(result.ok).toBe(true);
    expect(result.sessionId).toBe('SID1');
    expect(result.recovered).toBe(false);
    expect(recoverEditorSessionByDocId).not.toHaveBeenCalled();
  });

  it('recovers and commits when sessionId missing', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: '',
      sessionStartTime: '',
      validateKey: '',
      validateResponse: null
    });
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: true,
      docData: {
        docid: 'DOC1',
        session_id: 'SID2',
        session_start_time: '200',
        username: 'b@b.com'
      }
    });

    const result = await loadOrRecoverEditorSession({ docId: 'DOC1' });

    expect(result.ok).toBe(true);
    expect(result.recovered).toBe(true);
    expect(result.sessionId).toBe('SID2');
    expect(commitSessionForEditor).toHaveBeenCalled();
  });

  it('fails when recovery fails', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: '',
      validateResponse: null
    });
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.'
    });

    await expect(loadOrRecoverEditorSession({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.',
      redirectTo: '/validateurl'
    });
  });
});

describe('resolveEditorUserInfo', () => {
  afterEach(() => {
    localStorage.clear();
    isLocalHost.mockReturnValue(false);
  });

  it('builds from sessionSource', () => {
    const userInfo = resolveEditorUserInfo({
      sessionSource: {
        emailId: 'a@b.com',
        roleId: '1',
        roleName: 'Author',
        raw: { uniqueid: 'UID1' }
      }
    });
    expect(userInfo).toEqual({
      username: 'a@b.com',
      roleId: '1',
      roleName: 'Author',
      uniqueId: 'UID1'
    });
  });

  it('fills username from login storage on localhost when empty', () => {
    isLocalHost.mockReturnValue(true);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGIN_USERNAME, 'local@test.com');
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGIN_USERID, 'u99');

    const userInfo = resolveEditorUserInfo({
      sessionSource: { emailId: '', roleId: '', roleName: '', raw: {} },
      shareKeyCtx: { username: '' }
    });

    expect(userInfo.username).toBe('local@test.com');
    expect(userInfo.uniqueId).toBe('u99');
  });

  it('does not fill login storage off localhost', () => {
    isLocalHost.mockReturnValue(false);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGIN_USERNAME, 'local@test.com');

    const userInfo = resolveEditorUserInfo({
      sessionSource: { emailId: '', roleId: '', roleName: '', raw: {} },
      shareKeyCtx: { username: '' }
    });

    expect(userInfo.username).toBe('');
  });

  it('prefers shareKeyCtx.username when session email empty', () => {
    const userInfo = resolveEditorUserInfo({
      sessionSource: { emailId: '', roleId: '1', roleName: 'Author', raw: {} },
      shareKeyCtx: { username: 'from-share@x.com' }
    });
    expect(userInfo.username).toBe('from-share@x.com');
  });
});

describe('assertEditorAccess', () => {
  it('fails without sessionId', () => {
    expect(assertEditorAccess({
      sessionId: '',
      userInfo: { username: 'a@b.com' }
    })).toEqual({
      ok: false,
      reason: 'missing_session_id',
      message: 'Missing editor session id.',
      redirectTo: '/validateurl'
    });
  });

  it('fails without username', () => {
    expect(assertEditorAccess({
      sessionId: 'SID1',
      userInfo: { username: '' }
    })).toEqual({
      ok: false,
      reason: 'access_denied',
      message: 'No user identity found for editor session.',
      redirectTo: '/validateurl'
    });
  });

  it('passes with sessionId and username', () => {
    expect(assertEditorAccess({
      sessionId: 'SID1',
      userInfo: { username: 'a@b.com' }
    })).toEqual({ ok: true });
  });
});

describe('verifyEditorSession', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps verify failure to redirect shape', async () => {
    verifySession.mockResolvedValueOnce({ ok: false, reason: 'record_mismatch' });

    await expect(verifyEditorSession({ docId: 'DOC1', sessionId: 'SID1' })).resolves.toEqual({
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    });
  });

  it('passes through ok and bypassed', async () => {
    verifySession.mockResolvedValueOnce({ ok: true, bypassed: true });

    await expect(verifyEditorSession({ docId: 'DOC1', sessionId: 'SID1' })).resolves.toEqual({
      ok: true,
      bypassed: true
    });
  });
});
```

- [ ] **Step 3: Run tests — expect FAIL**

Run: `npm run test:unit -- tests/unit/session/editorSessionSteps.test.js`

Expected: FAIL (module / exports missing)

- [ ] **Step 4: Implement `editorSessionSteps.js`**

Create `src/services/session/editorSessionSteps.js`:

```js
import {
  normalizeSessionSource,
  toSessionContext
} from './sessionSource.js';
import {
  commitSessionForEditor,
  getStoredEditorSession
} from './sessionStorage.js';
import {
  recoverEditorSessionByDocId,
  verifySession
} from './sessionGateway.js';
import { LOCAL_STORAGE_KEYS } from './sessionConstants.js';
import { isLocalHost } from './runtimeFlags.js';

function readQueryDocId(locationSearch = '') {
  try {
    return new URLSearchParams(locationSearch).get('docid') || '';
  } catch {
    return '';
  }
}

function resolveSessionId(stored, docData) {
  return stored.sessionId || docData?.session_id || docData?.sessionId || '';
}

function resolveSessionStartTime(stored, docData) {
  return (
    stored.sessionStartTime ||
    docData?.session_start_time ||
    docData?.sessionStartTime ||
    ''
  );
}

function readLoginUsername() {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.LOGIN_USERNAME) || '';
  } catch {
    return '';
  }
}

function readLoginUserId() {
  try {
    return localStorage.getItem(LOCAL_STORAGE_KEYS.LOGIN_USERID) || '';
  } catch {
    return '';
  }
}

export function resolveEditorDocId({ docId, locationSearch } = {}) {
  return docId || readQueryDocId(locationSearch) || '';
}

export async function loadOrRecoverEditorSession({
  docId,
  allowRecovery = true
} = {}) {
  const stored = getStoredEditorSession(docId);
  let validateResponse = stored.validateResponse;
  let docData = validateResponse?.data ?? validateResponse ?? {};
  let sessionId = resolveSessionId(stored, docData);
  let sessionStartTime = resolveSessionStartTime(stored, docData);
  let recovered = false;

  if ((!validateResponse || !sessionId) && allowRecovery) {
    const recovery = await recoverEditorSessionByDocId(docId);
    if (!recovery.ok) {
      return {
        ok: false,
        reason: recovery.reason,
        message: recovery.message,
        redirectTo: '/validateurl'
      };
    }

    recovered = true;
    docData = { ...recovery.docData, docid: docId };
    validateResponse = { data: docData };
    sessionId = resolveSessionId(stored, docData);
    sessionStartTime = resolveSessionStartTime(stored, docData);

    commitSessionForEditor({
      docId,
      sessionId,
      sessionStartTime,
      validateResponse,
      accessKey: stored.validateKey || ''
    });
  }

  if (!sessionId) {
    return {
      ok: false,
      reason: 'missing_session_id',
      message: 'Missing editor session id.',
      redirectTo: '/validateurl'
    };
  }

  return {
    ok: true,
    stored,
    validateResponse,
    docData,
    sessionId,
    sessionStartTime,
    recovered,
    validateKey: stored.validateKey || ''
  };
}

export function resolveEditorUserInfo({ sessionSource, shareKeyCtx } = {}) {
  let username =
    sessionSource?.emailId || shareKeyCtx?.username || '';
  let uniqueId =
    sessionSource?.raw?.uniqueid ||
    sessionSource?.raw?._id ||
    sessionSource?.raw?.userid ||
    '';

  if ((!username || /^(null|undefined)$/i.test(username)) && isLocalHost()) {
    const loginUser = readLoginUsername();
    if (loginUser) username = loginUser;
  }

  if ((!uniqueId || /^(null|undefined)$/i.test(String(uniqueId))) && isLocalHost()) {
    const loginId = readLoginUserId();
    if (loginId) uniqueId = loginId;
  }

  return {
    username: username || '',
    roleId: sessionSource?.roleId || shareKeyCtx?.roleid || '',
    roleName: sessionSource?.roleName || shareKeyCtx?.rolename || '',
    uniqueId: uniqueId || ''
  };
}

export function assertEditorAccess({ sessionId, userInfo } = {}) {
  if (!sessionId) {
    return {
      ok: false,
      reason: 'missing_session_id',
      message: 'Missing editor session id.',
      redirectTo: '/validateurl'
    };
  }

  if (!userInfo?.username) {
    return {
      ok: false,
      reason: 'access_denied',
      message: 'No user identity found for editor session.',
      redirectTo: '/validateurl'
    };
  }

  return { ok: true };
}

export async function verifyEditorSession(ctx) {
  const verify = await verifySession(ctx);
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
    bypassed: verify.bypassed === true
  };
}

// Re-export for callers that need context builders beside steps
export { normalizeSessionSource, toSessionContext };
```

- [ ] **Step 5: Run step tests — expect PASS**

Run: `npm run test:unit -- tests/unit/session/editorSessionSteps.test.js`

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/services/session/sessionConstants.js src/services/session/editorSessionSteps.js tests/unit/session/editorSessionSteps.test.js
git commit -m "feat: add editorSessionSteps matching InitService run order"
```

---

### Task 2: Thin `bootstrapEditorSession` orchestrator

**Files:**
- Modify: `src/services/session/editorSessionBootstrap.js` (replace body with step orchestration)
- Modify: `src/services/session/index.js` (export `editorSessionSteps` if desired)
- Modify: `tests/unit/session/editorSessionBootstrap.test.js` (keep existing cases; add access_denied if needed; keep `resolveEditorDocId` import from bootstrap re-export)

**Interfaces:**
- Consumes: steps from Task 1 + `resolveShareKeyContext`
- Produces: same `bootstrapEditorSession` result shape as today, plus possible new `access_denied` reason

Canonical order (spec):

```text
1. resolveEditorDocId
2. loadOrRecoverEditorSession
3. resolveShareKeyContext
4. resolveEditorUserInfo
5. assertEditorAccess
6. verifyEditorSession
7. return ok payload
```

- [ ] **Step 1: Rewrite orchestrator**

Replace `src/services/session/editorSessionBootstrap.js` with:

```js
import { normalizeSessionSource, toSessionContext } from './sessionSource.js';
import { resolveShareKeyContext } from './shareKeyContext.js';
import {
  resolveEditorDocId,
  loadOrRecoverEditorSession,
  resolveEditorUserInfo,
  assertEditorAccess,
  verifyEditorSession
} from './editorSessionSteps.js';

export { resolveEditorDocId } from './editorSessionSteps.js';

export async function bootstrapEditorSession({
  docId,
  locationSearch = typeof window !== 'undefined' ? window.location.search : '',
  allowRecovery = true
} = {}) {
  const resolvedDocId = resolveEditorDocId({ docId, locationSearch });

  if (!resolvedDocId) {
    return {
      ok: false,
      reason: 'no_doc_id',
      message: 'Missing document id.',
      redirectTo: '/validateurl'
    };
  }

  const loaded = await loadOrRecoverEditorSession({
    docId: resolvedDocId,
    allowRecovery
  });
  if (!loaded.ok) {
    return {
      ok: false,
      reason: loaded.reason,
      message: loaded.message,
      redirectTo: loaded.redirectTo || '/validateurl'
    };
  }

  const shareKey = await resolveShareKeyContext(resolvedDocId);
  if (!shareKey.ok) {
    return {
      ok: false,
      reason: 'missing_share_key',
      message: shareKey.message || 'ShareKey details are required.',
      redirectTo: '/validateurl'
    };
  }

  const sessionSource = normalizeSessionSource(
    loaded.docData,
    loaded.validateResponse
  );
  const userInfo = resolveEditorUserInfo({
    sessionSource,
    shareKeyCtx: shareKey.ctx
  });

  const access = assertEditorAccess({
    sessionId: loaded.sessionId,
    userInfo
  });
  if (!access.ok) {
    return access;
  }

  const verify = await verifyEditorSession({
    ...toSessionContext(sessionSource),
    ...shareKey.ctx,
    docId: resolvedDocId,
    sessionId: loaded.sessionId,
    sessionStartTime: loaded.sessionStartTime,
    username: userInfo.username || shareKey.ctx.username
  });
  if (!verify.ok) {
    return verify;
  }

  return {
    ok: true,
    docId: resolvedDocId,
    sessionId: loaded.sessionId,
    sessionStartTime: loaded.sessionStartTime,
    validateKey: loaded.validateKey || '',
    sessionSource,
    userInfo,
    recovered: loaded.recovered,
    bypassed: verify.bypassed === true
  };
}
```

- [ ] **Step 2: Update `index.js` exports**

Add to `src/services/session/index.js`:

```js
export * from './editorSessionSteps.js';
```

(Keep existing `export * from './editorSessionBootstrap.js'`.)

- [ ] **Step 3: Extend bootstrap tests for access deny**

In `tests/unit/session/editorSessionBootstrap.test.js`, add:

```js
  it('blocks when user identity is missing after shareKey resolve', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      validateKey: 'KEY1',
      validateResponse: { data: { docid: 'DOC1' } }
    });
    resolveShareKeyContext.mockResolvedValueOnce({
      ok: true,
      source: 'localStorage',
      ctx: { docId: 'DOC1', client: 'LWW', username: '' }
    });

    await expect(bootstrapEditorSession({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'access_denied',
      message: 'No user identity found for editor session.',
      redirectTo: '/validateurl'
    });
    expect(verifySession).not.toHaveBeenCalled();
  });
```

Ensure existing cases still pass (username from session or shareKey).

- [ ] **Step 4: Run bootstrap + step tests**

Run:

```bash
npm run test:unit -- tests/unit/session/editorSessionSteps.test.js tests/unit/session/editorSessionBootstrap.test.js tests/unit/session/useEditorSessionBootstrap.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/services/session/editorSessionBootstrap.js src/services/session/index.js tests/unit/session/editorSessionBootstrap.test.js
git commit -m "refactor: make bootstrapEditorSession a thin Init-style run orchestrator"
```

---

### Task 3: Demote `INIT_CONFIG.run` on React path

**Files:**
- Modify: `src/services/bridge/GlobalBridge.js` (`setupInitConfig` only — comment + `devLog` remark; keep shim)
- Test: `tests/unit/bridge/globalBridge.test.js` (if present; otherwise add a focused assertion)

**Interfaces:**
- Consumes: existing GlobalBridge shims
- Produces: documented non-authority `INIT_CONFIG.run` (still callable for legacy probes, not editor gate)

- [ ] **Step 1: Annotate demotion in `setupInitConfig`**

Near `window.INIT_CONFIG.run`, add a clear comment and one `devLog` when `run` is invoked:

```js
    // React /editor gate is bootstrapEditorSession — not InitService.run.
    // This shim remains for legacy probes only; do not treat it as editor open authority.
    window.INIT_CONFIG.run = function() {
        devLog.warn(
            '[GlobalBridge] INIT_CONFIG.run invoked; React editor session gate is bootstrapEditorSession'
        );
        return initService.run();
    };
```

Do **not** remove the shim in this task (spec: demote wiring first).

- [ ] **Step 2: Confirm EditorPage does not call run**

Search:

```bash
rg "INIT_CONFIG\\.run|initService\\.run|bootstrapEditorSession" src/features/editor src/services/session
```

Expected: Editor path uses `bootstrapEditorSession` / `useEditorSessionBootstrap` only; no `INIT_CONFIG.run` in editor feature code.

- [ ] **Step 3: Run bridge unit tests if they exist**

Run: `npm run test:unit -- tests/unit/bridge`

Expected: PASS (or skip if no tests; do not invent large GlobalBridge suite)

- [ ] **Step 4: Commit**

```bash
git add src/services/bridge/GlobalBridge.js
git commit -m "docs: demote INIT_CONFIG.run as non-authority for React editor gate"
```

---

### Task 4: Regression sweep + spec status

**Files:**
- Modify: `docs/superpowers/specs/2026-09-07-editor-session-init-ownership-design.md` — set `Status: Approved / Implemented` (or `Approved`)

- [ ] **Step 1: Run session unit suite**

Run:

```bash
npm run test:unit -- tests/unit/session
```

Expected: PASS

- [ ] **Step 2: Update spec status line**

Change header `Status:` to `Approved` (implementation complete note optional in same line).

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-09-07-editor-session-init-ownership-design.md
git commit -m "docs: mark editor session init ownership spec approved"
```

---

## Spec coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Keep `bootstrapEditorSession` as `run` equivalent | Task 2 |
| `editorSessionSteps.js` named steps | Task 1 |
| Order: docId → load/recover → shareKey → user → access → verify | Task 2 |
| Drop admin / handleAdminInit / banned globals | Task 1–2 (not implemented) |
| Port light localhost `login_*` fill | Task 1 (`LOGIN_USERNAME` / `LOGIN_USERID`) |
| Demote InitService / INIT_CONFIG.run | Task 3 |
| Preserve Phase 2 shareKey + verify bypass | Task 2 calls existing modules unchanged |
| Hook/UI still uses bootstrap only | Task 2–3 verification |
| Tests for steps + bootstrap | Task 1–2, 4 |

No placeholders. Types/names consistent across tasks (`access_denied`, `verifyEditorSession`, `loadOrRecoverEditorSession`).
