# Session / Core Responsibility Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relocate entry-orchestration concerns (docId/storage/shareKey/user-info resolution) from `services/session/` into `services/core/`, narrow `services/session/` to DB-match verify + idle-timeout + send/receive, and add the two small new behaviors (idle timeout, ValidateUrlPage browser-compat check) called for by the design.

**Architecture:** Three storage/identity modules (`sessionStorage.js`, `shareKeyContext.js`, `userInfoBridge.js`) move file-for-file from `services/session/` to `services/core/` (renamed to `editorSessionStorage.js`, `shareKeyEntry.js`, `userInfoEntry.js`), with every call site's import path updated. The old `editorSessionBootstrap.js`/`editorSessionSteps.js`/`useEditorSessionBootstrap.js` orchestrator is rebuilt as `core/editorEntry.js` + `core/useEditorEntry.js`, split into an entry-resolution phase (docId -> storage -> shareKey -> user-info -> access) and a verify phase that calls into `services/session/sessionGateway.js`, exposed as two hook flags (`entryReady`, `ready`) so `EditorPage.jsx`'s existing content-loading hooks start as soon as entry resolves rather than waiting for verify too. `services/session/` keeps `sessionGateway.js`, its payload/config/constants/classify helpers, and `tabPresence.js` untouched, and gains a new `idleTimeout.js` watchdog.

**Tech Stack:** React 18, Vite, Vitest (`installBrowserStorageMocks` test helper), plain ES modules (no class-based services in the new code -- `services/core/`'s legacy jQuery-style classes are left untouched).

**Spec:** `docs/superpowers/specs/2026-09-08-session-core-split-design.md`

## Global Constraints

- Legacy `services/core/*.js` classes (`InitService`, `EditorInitService`, `SharedKeyService`, `StorageService`, `URLService`, `SessionGuard`) and `GlobalBridge.js` are not rewritten -- only their import paths are fixed where a relocated dependency (`shareKeyContext.js` -> `shareKeyEntry.js`) would otherwise dangle.
- `tabPresence.js` stays in `services/session/` unchanged.
- `sessionSource.js` stays in `services/session/` unchanged, imported by both `core/` and `session/`.
- No behavior change to PLOS reCAPTCHA/OTP/access-code auth (`landingAccess.js`, `authenticationFlow.js`, `useLandingUserValidation.js`'s PLOS branch).
- No warning modal before idle logout -- direct redirect to `/validateurl?...&alert=idle_session_log_out` on expiry.
- The app-wide `BrowserCompatibilityGate` in `AppRouter.jsx` is not removed.
- Preserve the existing hook contract fields (`loading`, `ready`, `error`, `session`) -- `entryReady` is additive, not a replacement.
- Preserve the existing failure shape `{ ok: false, reason, message, redirectTo }` for every entry/verify failure path.

---

## Task 1: Relocate user-info bridge to `services/core/userInfoEntry.js`

**Files:**
- Create: `src/services/core/userInfoEntry.js`
- Delete (end of task): `src/services/session/userInfoBridge.js`
- Modify: `src/features/landing/hooks/useLandingUserValidation.js:12`
- Test: move `tests/unit/session/userInfoBridge.test.js` -> `tests/unit/core/userInfoEntry.test.js`

**Interfaces:**
- Produces: `setUserInfo(info)`, `getUserInfo()`, `clearUserInfo()`, `toLegacyUserInfo(src)` -- identical signatures to the old `userInfoBridge.js`, importable from `../../services/core/userInfoEntry.js`.

- [ ] **Step 1: Create `src/services/core/userInfoEntry.js` with the relocated content**

```js
import { ADMIN_CONFIG, ROLE_IDS } from '../api/roleCatalog.js';
import { formatTrackRoleName } from '../session/sessionSource.js';

let currentUserInfo = null;

export function setUserInfo(info) {
  currentUserInfo = Object.freeze({ ...info });
  if (typeof window !== 'undefined') {
    window.USER_INFO = { ...currentUserInfo };
  }
}

export function getUserInfo() {
  return currentUserInfo;
}

export function clearUserInfo() {
  currentUserInfo = null;
  if (typeof window !== 'undefined') {
    window.USER_INFO = {};
  }
}

function resolveRoleMeta(roleId, roleName) {
  const meta = ROLE_IDS[roleId] || {};
  const resolvedName = roleName || meta.name || '';
  const shortname = meta.shortname || '';
  return { meta, resolvedName, shortname };
}

/** Legacy USER_INFO object from normalized session source (pure). */
export function toLegacyUserInfo(src) {
  const { meta, resolvedName, shortname } = resolveRoleMeta(src.roleId, src.roleName);
  const mailId = src.emailId || '';
  const mailIdPrefix = mailId ? mailId.split('@')[0].trim() : '';
  const isCoRole = shortname === 'CO' || resolvedName === 'Collator';
  const isAuthor = shortname === 'AU' || resolvedName === 'Author';
  const isAdmin =
    (mailIdPrefix && ADMIN_CONFIG.ADMIN_USER_IDs.includes(mailIdPrefix)) ||
    (typeof localStorage !== 'undefined' && localStorage.getItem('xmleditor:admin') === 'superadmin');

  const tourMeta = meta.tour;
  const tour = typeof tourMeta === 'object' ? tourMeta.OUP || tourMeta.LWW || '1' : tourMeta || '1';

  return {
    MAIL_ID: mailId,
    USER_ID: src.raw._id || src.raw.userid || src.raw.USER_ID || '',
    HAS_COLLAB_WORKFLOW: src.isCollab,
    MAIL_ID_PREFIX: mailIdPrefix,
    ROLE_ID: src.roleId,
    ROLE_NAME: resolvedName,
    SELECTOR_BKUP_FOLDER: meta.backup || '',
    SELECTOR_SHOW_HIDE: meta.SelectorAttribute || '',
    IS_CO_ROLE: isCoRole,
    TRACK_ROLE_NAME: formatTrackRoleName(resolvedName),
    IS_AUTHOR: isAuthor,
    IS_ADMIN: isAdmin,
    TOUR: tour
  };
}
```

Note the only change from the original `session/userInfoBridge.js` is the `sessionSource.js` import path (`'../session/sessionSource.js'` instead of `'./sessionSource.js'`), since `sessionSource.js` stays in `services/session/`.

- [ ] **Step 2: Move the test file**

Copy `tests/unit/session/userInfoBridge.test.js` to `tests/unit/core/userInfoEntry.test.js`, updating its two import lines:

```js
import {
  clearUserInfo,
  getUserInfo,
  setUserInfo,
  toLegacyUserInfo
} from '../../../src/services/core/userInfoEntry.js';
import { normalizeSessionSource } from '../../../src/services/session/sessionSource.js';
```

(the rest of the file -- the three `it()` blocks -- is unchanged from the original). Delete the old `tests/unit/session/userInfoBridge.test.js`.

- [ ] **Step 3: Run the moved test**

Run: `npx vitest run tests/unit/core/userInfoEntry.test.js`
Expected: PASS (3 tests)

- [ ] **Step 4: Update `useLandingUserValidation.js`'s import**

In `src/features/landing/hooks/useLandingUserValidation.js`, change:

```js
import { setUserInfo, toLegacyUserInfo } from '../../../services/session/userInfoBridge.js';
```

to:

```js
import { setUserInfo, toLegacyUserInfo } from '../../../services/core/userInfoEntry.js';
```

- [ ] **Step 5: Leave `session/userInfoBridge.js` in place for now**

Do not delete `src/services/session/userInfoBridge.js` yet -- `src/services/session/sessionStorage.js` still imports from it and that file moves in Task 2. Deleting it now would break `sessionStorage.js` before its own relocation.

- [ ] **Step 6: Run the full test suite to confirm nothing else broke**

Run: `npx vitest run`
Expected: PASS (same pass count as before this task, minus the moved file's old path, plus its new path)

- [ ] **Step 7: Commit**

```bash
git add src/services/core/userInfoEntry.js src/features/landing/hooks/useLandingUserValidation.js tests/unit/core/userInfoEntry.test.js
git rm tests/unit/session/userInfoBridge.test.js
git commit -m "refactor(session): relocate userInfoBridge to services/core/userInfoEntry"
```

---

## Task 2: Relocate storage helpers to `services/core/editorSessionStorage.js`

**Files:**
- Create: `src/services/core/editorSessionStorage.js`
- Modify: `src/services/session/sessionGateway.js:19`
- Modify: `src/services/session/shareKeyContext.js:4`
- Modify: `src/features/editor/hooks/useEditorLogout.js:5-8`
- Modify: `src/features/landing/hooks/useLandingSessionFlow.js:9`
- Modify: `src/features/landing/hooks/useLandingUserValidation.js:8-11`
- Modify: `src/features/landing/pages/ValidateUrlPage.jsx:8-12`
- Delete (end of task): `src/services/session/sessionStorage.js`, `src/services/session/userInfoBridge.js`
- Test: move `tests/unit/session/sessionStorage.test.js` -> `tests/unit/core/editorSessionStorage.test.js`

**Interfaces:**
- Consumes: `core/userInfoEntry.js` (`clearUserInfo`, `setUserInfo`, `toLegacyUserInfo`) from Task 1
- Produces: `getPendingValidateResponse()`, `setPendingValidateResponse(response)`, `clearPendingValidateResponse()`, `setValidateAccessKey(key)`, `getValidateAccessKey()`, `clearValidateAccessKey()`, `stripIdleSessionSignOffAlert(url)`, `clearEditorSessionHandshake(opts)`, `getEditorSessionContextFromStorage()`, `getValidateResponse()`, `setValidateResponse(response, opts)`, `saveLegacyLocalStorageData(resData)`, `setSessionStartTime(docId, value)`, `getSessionStartTime(docId)`, `getStoredEditorSession(docId)`, `commitSessionForEditor(args)`, `persistMaintenanceStart()`, `clearDocScopedLocalData(docId)`, `buildSessionContextFromDocData(docData, overrides)` -- all identical signatures to the old `sessionStorage.js`, importable from `../../services/core/editorSessionStorage.js`.

- [ ] **Step 1: Create `src/services/core/editorSessionStorage.js` with the relocated content**

```js
import { LOCAL_STORAGE_KEYS, SESSION_STORAGE_KEYS } from '../session/sessionConstants.js';
import { getMaintenanceState } from '../landing/maintenanceGuard.js';
import {
  applyLegacyLocalStorage,
  normalizeSessionSource,
  toLegacyLocalStorageWrites,
  toSessionContext
} from '../session/sessionSource.js';
import { clearUserInfo, setUserInfo, toLegacyUserInfo } from './userInfoEntry.js';

/** In-memory validate payload until grant+verify succeeds (legacy pendingCommitResData). */
let pendingValidateResponse = null;

export function getPendingValidateResponse() {
  return pendingValidateResponse;
}

export function setPendingValidateResponse(response) {
  pendingValidateResponse = response ?? null;
}

export function clearPendingValidateResponse() {
  pendingValidateResponse = null;
}

/** Persist validate URL access key so editor can renew tab lock with key match. */
export function setValidateAccessKey(accessKey) {
  if (typeof sessionStorage === 'undefined') return;
  if (accessKey) {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.VALIDATE_KEY, String(accessKey));
  }
}

export function getValidateAccessKey() {
  if (typeof sessionStorage === 'undefined') return '';
  return sessionStorage.getItem(SESSION_STORAGE_KEYS.VALIDATE_KEY) || '';
}

export function clearValidateAccessKey() {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.VALIDATE_KEY);
}

/** Remove idle-session alert from stored redirect URL (legacy LandingPage parity). */
export function stripIdleSessionSignOffAlert(url) {
  if (!url || url.indexOf('idle_session_log_out') === -1) return url;
  return url.replace('&alert=idle_session_log_out', '');
}

/** Clear handshake keys so a fresh validateurl can start after logout. */
export function clearEditorSessionHandshake({ clearValidateKey = false } = {}) {
  if (typeof sessionStorage === 'undefined') return;
  const docId = sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID);
  if (docId) {
    sessionStorage.removeItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}${docId}`);
  }
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.DOC_ID);
  sessionStorage.removeItem(SESSION_STORAGE_KEYS.REDIRECT);
  clearUserInfo();
  if (clearValidateKey) {
    clearValidateAccessKey();
  }
}

export function getEditorSessionContextFromStorage() {
  if (typeof sessionStorage === 'undefined') {
    return { docId: '', sessionId: '', accessKey: '' };
  }
  const docId = sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID) || '';
  const sessionId = docId
    ? sessionStorage.getItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}${docId}`) || ''
    : '';
  const accessKey = getValidateAccessKey();
  return { docId, sessionId, accessKey };
}

export function getValidateResponse() {
  if (pendingValidateResponse) return pendingValidateResponse;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Persist validate response only after session grant (or explicit force). */
export function setValidateResponse(response, { persist = false } = {}) {
  pendingValidateResponse = response ?? null;
  if (!persist || !response) return;
  sessionStorage.setItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE, JSON.stringify(response));
}

/**
 * Legacy-compatible localStorage commit used by editor SharedKeyService / StorageService.
 */
export function saveLegacyLocalStorageData(resData) {
  if (!resData) return { ok: false, reason: 'missing_res_data' };

  const src = normalizeSessionSource(resData);
  const emailto = src.raw.emailto;

  if (!(src.apikey || (src.docId && emailto))) {
    return { ok: false, reason: 'missing_apikey_or_email' };
  }

  applyLegacyLocalStorage(toLegacyLocalStorageWrites(src));
  return { ok: true, docid: src.docId };
}

export function setSessionStartTime(docId, value) {
  if (typeof sessionStorage === 'undefined' || !docId || value == null) return;
  sessionStorage.setItem(`${SESSION_STORAGE_KEYS.SESSION_START_PREFIX}${docId}`, String(value));
}

export function getSessionStartTime(docId) {
  if (typeof sessionStorage === 'undefined' || !docId) return '';
  return sessionStorage.getItem(`${SESSION_STORAGE_KEYS.SESSION_START_PREFIX}${docId}`) || '';
}

export function getStoredEditorSession(docId) {
  if (typeof sessionStorage === 'undefined') {
    return {
      docId: '',
      sessionId: '',
      sessionStartTime: '',
      validateKey: '',
      validateResponse: null
    };
  }

  const resolvedDocId = docId || sessionStorage.getItem(SESSION_STORAGE_KEYS.DOC_ID) || '';
  const sessionId = resolvedDocId
    ? sessionStorage.getItem(`${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}${resolvedDocId}`) || ''
    : '';

  return {
    docId: resolvedDocId,
    sessionId,
    sessionStartTime: getSessionStartTime(resolvedDocId),
    validateKey: getValidateAccessKey(),
    validateResponse: getValidateResponse()
  };
}

export function commitSessionForEditor({
  docId,
  sessionId,
  sessionStartTime,
  redirectUrl,
  validateResponse,
  accessKey
} = {}) {
  const response = validateResponse || getValidateResponse();
  const resData = response?.data ?? response ?? null;

  if (response) {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.VALIDATE_RESPONSE, JSON.stringify(response));
    pendingValidateResponse = response;
  }

  if (resData) {
    const payload = { ...resData, docid: docId || resData.docid };
    const legacyResult = saveLegacyLocalStorageData(payload);
    if (legacyResult.ok) {
      const src = normalizeSessionSource(payload, response);
      setUserInfo(toLegacyUserInfo(src));
    }
  }

  const resolvedDocId = docId || resData?.docid || resData?.identifier;
  if (resolvedDocId && sessionId) {
    sessionStorage.setItem(
      `${SESSION_STORAGE_KEYS.SESSION_ID_PREFIX}${resolvedDocId}`,
      String(sessionId)
    );
    sessionStorage.setItem(SESSION_STORAGE_KEYS.DOC_ID, String(resolvedDocId));
  }

  if (resolvedDocId && sessionStartTime != null && sessionStartTime !== '') {
    setSessionStartTime(resolvedDocId, sessionStartTime);
  }

  if (accessKey) {
    setValidateAccessKey(accessKey);
  }

  if (redirectUrl) {
    sessionStorage.setItem(SESSION_STORAGE_KEYS.REDIRECT, redirectUrl);
  }

  return { ok: true, docId: resolvedDocId };
}

export function persistMaintenanceStart() {
  if (typeof sessionStorage === 'undefined') return false;
  const state = getMaintenanceState();
  if (!state.ON && !state.active) return false;
  const numeric = Number(state.START ?? state.start);
  if (!Number.isFinite(numeric) || numeric <= 0) return false;
  sessionStorage.setItem(SESSION_STORAGE_KEYS.MAINTENANCE_START, String(numeric));
  return true;
}

/**
 * Clear stale per-doc localStorage for a non-Collator re-visit (legacy clearDocScopedLocalData).
 */
export function clearDocScopedLocalData(docId) {
  if (!docId || typeof localStorage === 'undefined') return 0;
  const suffix = `:${docId}`;
  const exactKeys = [
    `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}${docId}`,
    `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}${docId}:compact`,
    `${LOCAL_STORAGE_KEYS.SHARED_PREFIX}${docId}:source`,
    `${LOCAL_STORAGE_KEYS.USERNAME_PREFIX}${docId}`,
    `${LOCAL_STORAGE_KEYS.USER_ID_PREFIX}${docId}`,
    `${LOCAL_STORAGE_KEYS.USER_ROLE_PREFIX}${docId}`,
    `${LOCAL_STORAGE_KEYS.USER_COLOR_PREFIX}${docId}`,
    `${LOCAL_STORAGE_KEYS.COLLAB_ENABLED_PREFIX}${docId}`
  ];
  const toRemove = new Set(exactKeys);
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('xmleditor:') && key.endsWith(suffix)) {
      toRemove.add(key);
    }
  }
  toRemove.forEach((key) => localStorage.removeItem(key));
  return toRemove.size;
}

export function buildSessionContextFromDocData(docData, overrides = {}) {
  const src = normalizeSessionSource(docData, getValidateResponse());
  return toSessionContext(src, overrides);
}
```

Note the two changed imports vs the original `session/sessionStorage.js`: `sessionConstants.js` and `sessionSource.js` now come from `'../session/...'`, and `userInfoBridge.js` is now `'./userInfoEntry.js'` (Task 1's new home, same directory).

- [ ] **Step 2: Move the test file**

Copy `tests/unit/session/sessionStorage.test.js` to `tests/unit/core/editorSessionStorage.test.js`, updating the import block to:

```js
import { describe, it, expect, beforeEach } from 'vitest';
import { installBrowserStorageMocks } from '../helpers/mockBrowserStorage.js';
import {
  LOCAL_STORAGE_KEYS,
  SESSION_STORAGE_KEYS
} from '../../../src/services/session/sessionConstants.js';
import {
  setPendingValidateResponse,
  getValidateResponse,
  commitSessionForEditor,
  saveLegacyLocalStorageData,
  clearPendingValidateResponse,
  clearDocScopedLocalData,
  getSessionStartTime,
  setSessionStartTime,
  getStoredEditorSession,
  setValidateAccessKey,
  setValidateResponse
} from '../../../src/services/core/editorSessionStorage.js';
import { clearUserInfo, getUserInfo } from '../../../src/services/core/userInfoEntry.js';
```

The rest of the file (both `describe` blocks and every `it()`) is unchanged. Delete the old `tests/unit/session/sessionStorage.test.js`.

- [ ] **Step 3: Run the moved test**

Run: `npx vitest run tests/unit/core/editorSessionStorage.test.js`
Expected: PASS (7 tests)

- [ ] **Step 4: Update `sessionGateway.js`'s import**

In `src/services/session/sessionGateway.js`, change line 19 from:

```js
import { commitSessionForEditor, persistMaintenanceStart, stripIdleSessionSignOffAlert } from './sessionStorage.js';
```

to:

```js
import { commitSessionForEditor, persistMaintenanceStart, stripIdleSessionSignOffAlert } from '../core/editorSessionStorage.js';
```

- [ ] **Step 5: Update `shareKeyContext.js`'s import**

In `src/services/session/shareKeyContext.js`, change line 4 from:

```js
import { saveLegacyLocalStorageData } from './sessionStorage.js';
```

to:

```js
import { saveLegacyLocalStorageData } from '../core/editorSessionStorage.js';
```

(`shareKeyContext.js` itself relocates to `core/shareKeyEntry.js` in Task 3 -- this import-path fix keeps it working in its current location in the meantime, and Task 3 will simplify it to a same-directory `./editorSessionStorage.js` import.)

- [ ] **Step 6: Update `useEditorLogout.js`'s import**

In `src/features/editor/hooks/useEditorLogout.js`, change:

```js
import {
  clearEditorSessionHandshake,
  getEditorSessionContextFromStorage
} from '../../../services/session/sessionStorage.js';
```

to:

```js
import {
  clearEditorSessionHandshake,
  getEditorSessionContextFromStorage
} from '../../../services/core/editorSessionStorage.js';
```

- [ ] **Step 7: Update `useLandingSessionFlow.js`'s import**

In `src/features/landing/hooks/useLandingSessionFlow.js`, change line 9 from:

```js
import { buildSessionContextFromDocData } from '../../../services/session/sessionStorage.js';
```

to:

```js
import { buildSessionContextFromDocData } from '../../../services/core/editorSessionStorage.js';
```

- [ ] **Step 8: Update `useLandingUserValidation.js`'s import**

In `src/features/landing/hooks/useLandingUserValidation.js`, change:

```js
import {
  getPendingValidateResponse,
  saveLegacyLocalStorageData,
  setPendingValidateResponse
} from '../../../services/session/sessionStorage.js';
```

to:

```js
import {
  getPendingValidateResponse,
  saveLegacyLocalStorageData,
  setPendingValidateResponse
} from '../../../services/core/editorSessionStorage.js';
```

- [ ] **Step 9: Update `ValidateUrlPage.jsx`'s import**

In `src/features/landing/pages/ValidateUrlPage.jsx`, change:

```js
import {
  clearDocScopedLocalData,
  setPendingValidateResponse,
  setValidateAccessKey
} from '../../../services/session/sessionStorage.js';
```

to:

```js
import {
  clearDocScopedLocalData,
  setPendingValidateResponse,
  setValidateAccessKey
} from '../../../services/core/editorSessionStorage.js';
```

- [ ] **Step 10: Delete the old files now that nothing imports them**

Run a sweep to confirm no remaining references:

Run: `grep -rn "services/session/sessionStorage.js\|services/session/userInfoBridge.js" src tests`
Expected: no output (only `services/session/index.js` may still reference them -- fixed in Task 4)

Delete `src/services/session/sessionStorage.js` and `src/services/session/userInfoBridge.js` (userInfoBridge's last remaining importer, `sessionStorage.js`, is gone now that `sessionStorage.js` itself is deleted; `session/index.js`'s stale re-export is fixed in Task 4, so leave `index.js` broken between this step and Task 4 within the same commit -- do not commit mid-way).

- [ ] **Step 11: Run the full test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "refactor(session): relocate sessionStorage to services/core/editorSessionStorage"
```

---

## Task 3: Relocate shareKey context to `services/core/shareKeyEntry.js`

**Files:**
- Create: `src/services/core/shareKeyEntry.js`
- Modify: `src/services/core/SessionGuard.js:3`
- Modify: `src/services/bridge/GlobalBridge.js:3`
- Delete (end of task): `src/services/session/shareKeyContext.js`
- Test: move `tests/unit/session/shareKeyContext.test.js` -> `tests/unit/core/shareKeyEntry.test.js`

**Interfaces:**
- Consumes: `core/editorSessionStorage.js` (`saveLegacyLocalStorageData`) from Task 2; `session/sessionGateway.js` (`recoverEditorSessionByDocId`, unchanged); `session/sessionSource.js` (`normalizeSessionSource`, `toSessionContext`, unchanged); `session/sessionConstants.js` (`LOCAL_STORAGE_KEYS`, unchanged)
- Produces: `readShareKeyFromLocalStorage(docId)`, `resolveShareKeyContext(docId)` -- identical signatures, importable from `../../services/core/shareKeyEntry.js`.

- [ ] **Step 1: Create `src/services/core/shareKeyEntry.js` with the relocated content**

```js
import { LOCAL_STORAGE_KEYS } from '../session/sessionConstants.js';
import { normalizeSessionSource, toSessionContext } from '../session/sessionSource.js';
import { recoverEditorSessionByDocId } from '../session/sessionGateway.js';
import { saveLegacyLocalStorageData } from './editorSessionStorage.js';

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

- [ ] **Step 2: Move the test file**

Copy `tests/unit/session/shareKeyContext.test.js` to `tests/unit/core/shareKeyEntry.test.js`, updating the mock and import paths:

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
} from '../../../src/services/core/shareKeyEntry.js';
```

The rest of the file (all five `it()` blocks) is unchanged. Delete the old `tests/unit/session/shareKeyContext.test.js`.

- [ ] **Step 3: Run the moved test**

Run: `npx vitest run tests/unit/core/shareKeyEntry.test.js`
Expected: PASS (5 tests)

- [ ] **Step 4: Update `SessionGuard.js`'s import**

In `src/services/core/SessionGuard.js`, change line 3 from:

```js
import { readShareKeyFromLocalStorage } from '../session/shareKeyContext.js';
```

to:

```js
import { readShareKeyFromLocalStorage } from './shareKeyEntry.js';
```

This is a same-directory import now (`shareKeyContext.js` and `SessionGuard.js` are both in `services/core/`). No other change to `SessionGuard.js`.

- [ ] **Step 5: Update `GlobalBridge.js`'s import**

In `src/services/bridge/GlobalBridge.js`, change line 3 from:

```js
import { readShareKeyFromLocalStorage } from '../session/shareKeyContext.js';
```

to:

```js
import { readShareKeyFromLocalStorage } from '../core/shareKeyEntry.js';
```

No other change to `GlobalBridge.js`.

- [ ] **Step 6: Delete the old file**

Run: `grep -rn "services/session/shareKeyContext.js" src tests`
Expected: no output except `services/session/index.js` and `services/session/editorSessionBootstrap.js` (both handled in Tasks 4-5)

Delete `src/services/session/shareKeyContext.js`.

- [ ] **Step 7: Run `SessionGuard`'s existing test and the full suite**

Run: `npx vitest run tests/unit/core/sessionGuard.test.js`
Expected: PASS (4 tests, unchanged -- this test never imported `shareKeyContext.js` by path, only exercised `SessionGuard`'s behavior through real `localStorage`)

Run: `npx vitest run`
Expected: PASS except for `editorSessionBootstrap.test.js` / `editorSessionSteps.test.js`, which still import the now-deleted `session/shareKeyContext.js` mock target -- these two files are replaced wholesale in Task 5, so a failure there at this point is expected and will be resolved by Task 5, not this task. If any other file fails, stop and fix it before committing.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(session): relocate shareKeyContext to services/core/shareKeyEntry"
```

---

## Task 4: Update `services/session/index.js` and `services/core/index.js` barrels

**Files:**
- Modify: `src/services/session/index.js`
- Modify: `src/services/core/index.js`

**Interfaces:**
- Consumes: nothing new -- this task only fixes re-export statements to point at the files Tasks 1-3 relocated.
- Produces: `services/session/index.js` and `services/core/index.js` remain valid barrel modules (no dangling `export * from` targets).

- [ ] **Step 1: Check for any remaining barrel-import consumers**

Run: `grep -rln "from ['\"].*services/session['\"];\?$\|from ['\"].*services/session/index" src`

If this returns files other than `src/services/session/index.js` itself, note them -- they'll need the same import-path updates as the direct-import call sites already fixed in Tasks 1-3, but for whichever specific named export they use. As of this plan's writing, no such barrel consumers exist outside `services/session/index.js`; if the sweep finds one, add an explicit sub-step here before continuing.

- [ ] **Step 2: Update `src/services/session/index.js`**

Change:

```js
export {
  SESSION_PROCESS,
  SESSION_REMARKS,
  DOC_STATUS,
  REQUEST_STATUS,
  SESSION_STORAGE_KEYS,
  LOCAL_STORAGE_KEYS,
  TAB_PRESENCE,
  DEFAULT_EDITOR_ROLE
} from './sessionConstants.js';
export { sessionConfig } from './sessionConfig.js';
export * from './sessionPayloads.js';
export * from './sessionStorage.js';
export * from './sessionGateway.js';
export * from './sessionCheckClassify.js';
export * from './tabPresence.js';
export { isLocalHost } from './runtimeFlags.js';
export * from './sessionSource.js';
export * from './shareKeyContext.js';
export * from './editorSessionBootstrap.js';
export * from './editorSessionSteps.js';
export * from './useEditorSessionBootstrap.js';
export {
  clearUserInfo,
  getUserInfo,
  setUserInfo,
  toLegacyUserInfo
} from './userInfoBridge.js';
```

to:

```js
export {
  SESSION_PROCESS,
  SESSION_REMARKS,
  DOC_STATUS,
  REQUEST_STATUS,
  SESSION_STORAGE_KEYS,
  LOCAL_STORAGE_KEYS,
  TAB_PRESENCE,
  DEFAULT_EDITOR_ROLE
} from './sessionConstants.js';
export { sessionConfig } from './sessionConfig.js';
export * from './sessionPayloads.js';
export * from './sessionGateway.js';
export * from './sessionCheckClassify.js';
export * from './tabPresence.js';
export { isLocalHost } from './runtimeFlags.js';
export * from './sessionSource.js';
```

(`idleTimeout.js` doesn't exist yet -- its export line is added in Task 9, once the file exists, to avoid a dangling `export * from` target in between.)

- [ ] **Step 3: Update `src/services/core/index.js`**

Change:

```js
export { default as URLService } from './URLService';
export { default as StorageService } from './StorageService';
export { default as SharedKeyService } from './SharedKeyService';
export { default as InitService } from './InitService';
export { default as LoadingService } from './LoadingService';
export { default as EditorInitService } from './EditorInitService';
export { default as SessionGuard } from './SessionGuard';
```

to:

```js
export { default as URLService } from './URLService';
export { default as StorageService } from './StorageService';
export { default as SharedKeyService } from './SharedKeyService';
export { default as InitService } from './InitService';
export { default as LoadingService } from './LoadingService';
export { default as EditorInitService } from './EditorInitService';
export { default as SessionGuard } from './SessionGuard';
export * from './editorSessionStorage.js';
export * from './shareKeyEntry.js';
export * from './userInfoEntry.js';
export { checkBrowserCompatibility, isBrowserSupported, detectOS } from './browserCompatibility.js';
```

- [ ] **Step 4: Run the full test suite**

Run: `npx vitest run`
Expected: same pass/fail state as the end of Task 3 (this task only touches barrel files; `editorSessionBootstrap.test.js`/`editorSessionSteps.test.js` are still expected to fail until Task 5)

- [ ] **Step 5: Commit**

```bash
git add src/services/session/index.js src/services/core/index.js
git commit -m "refactor(session): update session/core barrel exports after file relocation"
```

---

## Task 5: Build `services/core/editorEntry.js` (entry resolution + verify split)

**Files:**
- Create: `src/services/core/editorEntry.js`
- Delete (end of task): `src/services/session/editorSessionBootstrap.js`, `src/services/session/editorSessionSteps.js`, `src/services/session/useEditorSessionBootstrap.js`
- Test: Create `tests/unit/core/editorEntry.test.js`; delete `tests/unit/session/editorSessionBootstrap.test.js`, `tests/unit/session/editorSessionSteps.test.js`

**Interfaces:**
- Consumes: `core/editorSessionStorage.js` (`getStoredEditorSession`, `commitSessionForEditor`) from Task 2; `core/shareKeyEntry.js` (`resolveShareKeyContext`) from Task 3; `session/sessionGateway.js` (`recoverEditorSessionByDocId`, `verifySession`, unchanged); `session/sessionSource.js` (`normalizeSessionSource`, `toSessionContext`, unchanged); `session/runtimeFlags.js` (`isLocalHost`, unchanged); `session/sessionConstants.js` (`LOCAL_STORAGE_KEYS`, unchanged)
- Produces: `resolveEditorDocId({ docId, locationSearch })`, `resolveEditorEntryState({ docId, locationSearch, allowRecovery })` (async -- steps 1-5, no verify), `verifyEditorEntry(entryState)` (async -- step 6b, DB verify only) -- consumed by Task 6's `useEditorEntry.js`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/core/editorEntry.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../../src/services/core/editorSessionStorage.js', () => ({
  getStoredEditorSession: vi.fn(),
  commitSessionForEditor: vi.fn(() => ({ ok: true, docId: 'DOC1' }))
}));

vi.mock('../../../src/services/session/sessionGateway.js', () => ({
  verifySession: vi.fn(),
  recoverEditorSessionByDocId: vi.fn()
}));

vi.mock('../../../src/services/core/shareKeyEntry.js', () => ({
  resolveShareKeyContext: vi.fn()
}));

vi.mock('../../../src/services/session/runtimeFlags.js', () => ({
  isLocalHost: vi.fn(() => false)
}));

import {
  resolveEditorDocId,
  resolveEditorEntryState,
  verifyEditorEntry
} from '../../../src/services/core/editorEntry.js';
import {
  getStoredEditorSession,
  commitSessionForEditor
} from '../../../src/services/core/editorSessionStorage.js';
import {
  verifySession,
  recoverEditorSessionByDocId
} from '../../../src/services/session/sessionGateway.js';
import { resolveShareKeyContext } from '../../../src/services/core/shareKeyEntry.js';
import { isLocalHost } from '../../../src/services/session/runtimeFlags.js';
import { LOCAL_STORAGE_KEYS } from '../../../src/services/session/sessionConstants.js';

describe('resolveEditorDocId', () => {
  it('uses explicit docId before URL query', () => {
    expect(resolveEditorDocId({ docId: 'DOC1', locationSearch: '?docid=DOC2' })).toBe('DOC1');
  });

  it('uses URL docid when explicit docId is missing', () => {
    expect(resolveEditorDocId({ locationSearch: '?docid=DOC2' })).toBe('DOC2');
  });
});

const shareKeyCtx = {
  docId: 'DOC1',
  client: 'LWW',
  username: 'a@b.com',
  roleid: '1',
  rolename: 'Author'
};

describe('resolveEditorEntryState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isLocalHost.mockReturnValue(false);
    localStorage.clear();
    resolveShareKeyContext.mockResolvedValue({
      ok: true,
      source: 'localStorage',
      ctx: shareKeyCtx
    });
  });

  afterEach(() => {
    localStorage.clear();
    isLocalHost.mockReturnValue(false);
  });

  it('resolves entry state from stored session without recovery', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      validateKey: 'KEY1',
      validateResponse: {
        data: {
          docid: 'DOC1',
          client: 'LWW',
          dtd: 'JATS',
          type: 'journals',
          username: 'a@b.com',
          roleid: '1',
          rolename: 'Author',
          uniqueid: 'UID1'
        }
      }
    });

    const result = await resolveEditorEntryState({ docId: 'DOC1' });

    expect(result.ok).toBe(true);
    expect(result.docId).toBe('DOC1');
    expect(result.sessionId).toBe('SID1');
    expect(result.sessionSource.client).toBe('LWW');
    expect(result.userInfo).toEqual({
      username: 'a@b.com',
      roleId: '1',
      roleName: 'Author',
      uniqueId: 'UID1'
    });
    expect(result.recovered).toBe(false);
    expect(resolveShareKeyContext).toHaveBeenCalledWith('DOC1');
    expect(recoverEditorSessionByDocId).not.toHaveBeenCalled();
  });

  it('recovers missing storage from backend and persists it', async () => {
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
        client: 'LWW',
        username: 'b@b.com',
        roleid: '2',
        rolename: 'Reviewer',
        uniqueid: 'UID2'
      }
    });

    const result = await resolveEditorEntryState({ docId: 'DOC1' });

    expect(commitSessionForEditor).toHaveBeenCalledWith({
      docId: 'DOC1',
      sessionId: 'SID2',
      sessionStartTime: '200',
      validateResponse: {
        data: expect.objectContaining({ docid: 'DOC1', session_id: 'SID2' })
      },
      accessKey: ''
    });
    expect(result.ok).toBe(true);
    expect(result.recovered).toBe(true);
  });

  it('fails no_doc_id when docId cannot be resolved', async () => {
    await expect(resolveEditorEntryState({})).resolves.toEqual({
      ok: false,
      reason: 'no_doc_id',
      message: 'Missing document id.',
      redirectTo: '/validateurl'
    });
  });

  it('blocks when recovery cannot find document data', async () => {
    getStoredEditorSession.mockReturnValueOnce({
      docId: 'DOC1',
      sessionId: '',
      sessionStartTime: '',
      validateKey: '',
      validateResponse: null
    });
    recoverEditorSessionByDocId.mockResolvedValueOnce({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.'
    });

    await expect(resolveEditorEntryState({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'no_document',
      message: 'Document session data was not found.',
      redirectTo: '/validateurl'
    });
  });

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

    await expect(resolveEditorEntryState({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'missing_share_key',
      message: 'Unable to resolve shareKey context.',
      redirectTo: '/validateurl'
    });
  });

  it('uses localhost login username after shareKey resolves', async () => {
    isLocalHost.mockReturnValue(true);
    localStorage.setItem(LOCAL_STORAGE_KEYS.LOGIN_USERNAME, 'local@test.com');
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

    const result = await resolveEditorEntryState({ docId: 'DOC1' });

    expect(result.ok).toBe(true);
    expect(result.userInfo.username).toBe('local@test.com');
  });

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

    await expect(resolveEditorEntryState({ docId: 'DOC1' })).resolves.toEqual({
      ok: false,
      reason: 'access_denied',
      message: 'No user identity found for editor session.',
      redirectTo: '/validateurl'
    });
  });
});

describe('verifyEditorEntry', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps verify failure to redirect shape', async () => {
    verifySession.mockResolvedValueOnce({ ok: false, reason: 'record_mismatch' });

    const entry = {
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      sessionSource: { emailId: 'a@b.com', roleId: '1', roleName: 'Author', raw: {} },
      shareKeyCtx: { username: 'a@b.com' },
      userInfo: { username: 'a@b.com' }
    };

    await expect(verifyEditorEntry(entry)).resolves.toEqual({
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    });
  });

  it('passes through ok and bypassed', async () => {
    verifySession.mockResolvedValueOnce({ ok: true, bypassed: true });

    const entry = {
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionStartTime: '100',
      sessionSource: { emailId: 'a@b.com', roleId: '1', roleName: 'Author', raw: {} },
      shareKeyCtx: { username: 'a@b.com' },
      userInfo: { username: 'a@b.com' }
    };

    await expect(verifyEditorEntry(entry)).resolves.toEqual({ ok: true, bypassed: true });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/unit/core/editorEntry.test.js`
Expected: FAIL -- `Failed to resolve import "../../../src/services/core/editorEntry.js"`

- [ ] **Step 3: Create `src/services/core/editorEntry.js`**

```js
import { normalizeSessionSource, toSessionContext } from '../session/sessionSource.js';
import { verifySession, recoverEditorSessionByDocId } from '../session/sessionGateway.js';
import { resolveShareKeyContext } from './shareKeyEntry.js';
import { getStoredEditorSession, commitSessionForEditor } from './editorSessionStorage.js';
import { LOCAL_STORAGE_KEYS } from '../session/sessionConstants.js';
import { isLocalHost } from '../session/runtimeFlags.js';
import { devLog } from '../../shared/utils/devLogger.js';

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

function normalizeIdentity(value) {
  const normalized = String(value ?? '').trim();
  return /^(null|undefined)$/i.test(normalized) ? '' : normalized;
}

export function resolveEditorDocId({ docId, locationSearch } = {}) {
  return docId || readQueryDocId(locationSearch) || '';
}

function resolveEditorUserInfo({ sessionSource, shareKeyCtx } = {}) {
  let username =
    normalizeIdentity(sessionSource?.emailId) ||
    normalizeIdentity(shareKeyCtx?.username);
  let uniqueId =
    sessionSource?.raw?.uniqueid ||
    sessionSource?.raw?._id ||
    sessionSource?.raw?.userid ||
    '';

  // Local login values are gate-only fallbacks for access/verification. They do
  // not populate window.USER_INFO or the identity used by error-mail reporting.
  if (!username && isLocalHost()) {
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

function assertEditorAccess({ sessionId, userInfo } = {}) {
  if (!sessionId) {
    return {
      ok: false,
      reason: 'missing_session_id',
      message: 'Missing editor session id.',
      redirectTo: '/validateurl'
    };
  }

  if (!userInfo?.username) {
    devLog.warn('[assertEditorAccess] access denied: username was empty');
    return {
      ok: false,
      reason: 'access_denied',
      message: 'No user identity found for editor session.',
      redirectTo: '/validateurl'
    };
  }

  return { ok: true };
}

/**
 * Steps 1-5 of the editor entry gate: docId -> stored/recovered session ->
 * shareKey -> user info -> access assertion. Does not call verifySession --
 * see verifyEditorEntry, called separately so useEditorEntry can expose
 * entry-ready state before the DB verify round trip completes.
 */
export async function resolveEditorEntryState({
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

  const stored = getStoredEditorSession(resolvedDocId);
  let validateResponse = stored.validateResponse;
  let docData = validateResponse?.data ?? validateResponse ?? {};
  let sessionId = resolveSessionId(stored, docData);
  let sessionStartTime = resolveSessionStartTime(stored, docData);
  let recovered = false;

  if ((!validateResponse || !sessionId) && allowRecovery) {
    const recovery = await recoverEditorSessionByDocId(resolvedDocId);
    if (!recovery.ok) {
      return {
        ok: false,
        reason: recovery.reason,
        message: recovery.message,
        redirectTo: '/validateurl'
      };
    }

    recovered = true;
    docData = { ...recovery.docData, docid: resolvedDocId };
    validateResponse = { data: docData };
    sessionId = resolveSessionId(stored, docData);
    sessionStartTime = resolveSessionStartTime(stored, docData);

    commitSessionForEditor({
      docId: resolvedDocId,
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
  const userInfo = resolveEditorUserInfo({ sessionSource, shareKeyCtx: shareKey.ctx });

  const access = assertEditorAccess({ sessionId, userInfo });
  if (!access.ok) {
    return access;
  }

  return {
    ok: true,
    docId: resolvedDocId,
    sessionId,
    sessionStartTime,
    validateKey: stored.validateKey || '',
    sessionSource,
    shareKeyCtx: shareKey.ctx,
    userInfo,
    recovered
  };
}

/**
 * Step 6b: the DB-match verify call, owned by services/session. Takes the
 * resolved entry state from resolveEditorEntryState and calls into
 * session/sessionGateway.verifySession.
 */
export async function verifyEditorEntry(entry) {
  const verify = await verifySession({
    ...toSessionContext(entry.sessionSource),
    ...entry.shareKeyCtx,
    docId: entry.docId,
    sessionId: entry.sessionId,
    sessionStartTime: entry.sessionStartTime,
    username: entry.userInfo.username || entry.shareKeyCtx.username
  });
  if (!verify.ok) {
    return {
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    };
  }
  return { ok: true, bypassed: verify.bypassed === true };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/unit/core/editorEntry.test.js`
Expected: PASS (10 tests)

- [ ] **Step 5: Delete the old bootstrap/steps files and their tests**

Run: `grep -rn "editorSessionBootstrap.js\|editorSessionSteps.js" src tests`
Expected: only the files being deleted here

Delete `src/services/session/editorSessionBootstrap.js`, `src/services/session/editorSessionSteps.js`, `tests/unit/session/editorSessionBootstrap.test.js`, `tests/unit/session/editorSessionSteps.test.js`.

`src/services/session/useEditorSessionBootstrap.js` imports `bootstrapEditorSession` from the now-deleted `./editorSessionBootstrap.js`, so it cannot function on its own either. Delete `src/services/session/useEditorSessionBootstrap.js` too in this same step (no standalone test file exists for it -- it was covered indirectly through `editorSessionBootstrap.test.js`, already removed above). `EditorPage.jsx` still imports it and will fail to resolve until Task 7 rewires it to `core/useEditorEntry.js` -- that is expected and addressed there, not here.

- [ ] **Step 6: Run the full test suite excluding the temporarily-broken EditorPage**

Run: `npx vitest run --exclude "**/EditorPage*"`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(session): build core/editorEntry.js, remove old bootstrap/steps modules"
```

---

## Task 6: Build `services/core/useEditorEntry.js` hook

**Files:**
- Create: `src/services/core/useEditorEntry.js`
- Test: Create `tests/unit/core/useEditorEntry.test.js`

**Interfaces:**
- Consumes: `core/editorEntry.js` (`resolveEditorEntryState`, `verifyEditorEntry`) from Task 5
- Produces: `useEditorEntry(options)` React hook returning `{ loading, entryReady, ready, error, session }` -- consumed by Task 7's `EditorPage.jsx`. `loading`/`ready`/`error`/`session` match the old `useEditorSessionBootstrap`'s `{ loading, ready, error, session }` contract exactly; `entryReady` is new and becomes `true` as soon as steps 1-5 resolve, before the verify call completes.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/core/useEditorEntry.test.js`. Check `package.json` first for `@testing-library/react`; if it is not already a devDependency, run `npm install --save-dev @testing-library/react` before writing this file (it provides `renderHook`/`waitFor`/`act`, used below).

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('../../../src/services/core/editorEntry.js', () => ({
  resolveEditorEntryState: vi.fn(),
  verifyEditorEntry: vi.fn()
}));

import { useEditorEntry } from '../../../src/services/core/useEditorEntry.js';
import { resolveEditorEntryState, verifyEditorEntry } from '../../../src/services/core/editorEntry.js';

describe('useEditorEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exposes entryReady before verify resolves, then ready after', async () => {
    let resolveVerify;
    resolveEditorEntryState.mockResolvedValueOnce({
      ok: true,
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionSource: { client: 'LWW' },
      userInfo: { username: 'a@b.com' }
    });
    verifyEditorEntry.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveVerify = resolve;
      })
    );

    const { result } = renderHook(() => useEditorEntry({ docId: 'DOC1' }));

    await waitFor(() => expect(result.current.entryReady).toBe(true));
    expect(result.current.ready).toBe(false);
    expect(result.current.session.docId).toBe('DOC1');

    await act(async () => {
      resolveVerify({ ok: true, bypassed: false });
    });

    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.session.bypassed).toBe(false);
  });

  it('surfaces entry failure without ever calling verify', async () => {
    resolveEditorEntryState.mockResolvedValueOnce({
      ok: false,
      reason: 'no_doc_id',
      message: 'Missing document id.',
      redirectTo: '/validateurl'
    });

    const { result } = renderHook(() => useEditorEntry({ docId: '' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entryReady).toBe(false);
    expect(result.current.ready).toBe(false);
    expect(result.current.error.reason).toBe('no_doc_id');
    expect(verifyEditorEntry).not.toHaveBeenCalled();
  });

  it('surfaces verify failure after entryReady was already true', async () => {
    resolveEditorEntryState.mockResolvedValueOnce({
      ok: true,
      docId: 'DOC1',
      sessionId: 'SID1',
      sessionSource: { client: 'LWW' },
      userInfo: { username: 'a@b.com' }
    });
    verifyEditorEntry.mockResolvedValueOnce({
      ok: false,
      reason: 'verify_failed',
      message: 'Your editor session is no longer active.',
      redirectTo: '/validateurl'
    });

    const { result } = renderHook(() => useEditorEntry({ docId: 'DOC1' }));

    await waitFor(() => expect(result.current.error?.reason).toBe('verify_failed'));
    expect(result.current.entryReady).toBe(true);
    expect(result.current.ready).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/core/useEditorEntry.test.js`
Expected: FAIL -- `Failed to resolve import "../../../src/services/core/useEditorEntry.js"`

- [ ] **Step 3: Create `src/services/core/useEditorEntry.js`**

```js
import { useEffect, useMemo, useState } from 'react';
import { resolveEditorEntryState, verifyEditorEntry } from './editorEntry.js';

const INITIAL_STATE = {
  loading: true,
  entryReady: false,
  ready: false,
  error: null,
  session: null
};

export function useEditorEntry(options = {}) {
  const stableOptions = useMemo(() => ({
    docId: options.docId || '',
    locationSearch: options.locationSearch,
    allowRecovery: options.allowRecovery !== false
  }), [options.docId, options.locationSearch, options.allowRecovery]);

  const [state, setState] = useState(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;
    setState(INITIAL_STATE);

    (async () => {
      const entry = await resolveEditorEntryState(stableOptions);
      if (cancelled) return;

      if (!entry.ok) {
        setState({ loading: false, entryReady: false, ready: false, error: entry, session: null });
        return;
      }

      // Steps 1-5 resolved: expose entryReady so callers (EditorPage's content/config
      // loading hooks) can start work while verify runs in the background.
      setState({ loading: false, entryReady: true, ready: false, error: null, session: entry });

      const verify = await verifyEditorEntry(entry);
      if (cancelled) return;

      if (!verify.ok) {
        setState({ loading: false, entryReady: true, ready: false, error: verify, session: entry });
        return;
      }

      setState({
        loading: false,
        entryReady: true,
        ready: true,
        error: null,
        session: { ...entry, bypassed: verify.bypassed === true }
      });
    })().catch((error) => {
      if (cancelled) return;
      setState({
        loading: false,
        entryReady: false,
        ready: false,
        error: {
          reason: 'bootstrap_error',
          message: error?.message || 'Unable to initialize editor session.',
          redirectTo: '/validateurl'
        },
        session: null
      });
    });

    return () => {
      cancelled = true;
    };
  }, [stableOptions]);

  return state;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/core/useEditorEntry.test.js`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/services/core/useEditorEntry.js tests/unit/core/useEditorEntry.test.js package.json package-lock.json
git commit -m "feat(session): add core/useEditorEntry hook with entryReady/ready split"
```

---

## Task 7: Wire `EditorPage.jsx` to `core/useEditorEntry`

**Files:**
- Modify: `src/features/editor/pages/EditorPage.jsx:22`, `:121-143`, `:380-399`

**Interfaces:**
- Consumes: `core/useEditorEntry.js` (`useEditorEntry`) from Task 6

- [ ] **Step 1: Update the import**

Change line 22 from:

```js
import { useEditorSessionBootstrap } from '../../../services/session/useEditorSessionBootstrap.js';
```

to:

```js
import { useEditorEntry } from '../../../services/core/useEditorEntry.js';
```

- [ ] **Step 2: Rename the hook call and all `bootstrap.*` references to `entry.*`**

Change:

```js
  const bootstrap = useEditorSessionBootstrap({
    docId: urlDocId || '',
    locationSearch: typeof window !== 'undefined' ? window.location.search : ''
  });

  useEffect(() => {
    if (!bootstrap.loading && bootstrap.error?.redirectTo) {
      navigate(bootstrap.error.redirectTo, { replace: true });
    }
  }, [bootstrap.error, bootstrap.loading, navigate]);

  const sessionDocId = bootstrap.session?.docId || '';
  const sessionSrc = bootstrap.session?.sessionSource || {
    client: '',
    dtd: '',
    type: '',
    shorttitle: '',
    roleId: '',
    roleName: '',
    projecttitle: '',
    raw: {}
  };
  const validateKey = bootstrap.session?.validateKey || '';
```

to:

```js
  const entry = useEditorEntry({
    docId: urlDocId || '',
    locationSearch: typeof window !== 'undefined' ? window.location.search : ''
  });

  useEffect(() => {
    if (!entry.loading && entry.error?.redirectTo) {
      navigate(entry.error.redirectTo, { replace: true });
    }
  }, [entry.error, entry.loading, navigate]);

  const sessionDocId = entry.session?.docId || '';
  const sessionSrc = entry.session?.sessionSource || {
    client: '',
    dtd: '',
    type: '',
    shorttitle: '',
    roleId: '',
    roleName: '',
    projecttitle: '',
    raw: {}
  };
  const validateKey = entry.session?.validateKey || '';
```

Note: `sessionDocId`/`sessionSrc`/`validateKey` now become non-empty as soon as `entry.entryReady` is true (i.e. once `resolveEditorEntryState` resolves), which is before `entry.ready` (verify) resolves. Since `useEditorContent(sessionDocId)`, `useClientConfig({...})`, and the `editorCssUrls`/`loadEditorCss` effects below already run on every render regardless of the later loading/error early-returns, this is what makes content/config loading start "in parallel" with the DB verify call -- no other change to those hooks is needed.

- [ ] **Step 3: Update the loading/error gate at the bottom of the component**

Change:

```js
  if (bootstrap.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f1ea] text-sm text-gray-600 [color-scheme:light]">
        Initializing editor session...
      </div>
    );
  }

  if (bootstrap.error || !bootstrap.ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f1ea] px-6 text-gray-800 [color-scheme:light]">
        <div className="max-w-md rounded-sm border border-red-200 bg-white p-6 shadow-sm">
          <p className="font-medium text-red-700">Unable to open editor session.</p>
          <p className="mt-2 text-sm text-gray-600">
            {bootstrap.error?.message || 'The editor session could not be initialized.'}
          </p>
        </div>
      </div>
    );
  }
```

to:

```js
  if (entry.loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f1ea] text-sm text-gray-600 [color-scheme:light]">
        Initializing editor session...
      </div>
    );
  }

  if (entry.error || !entry.ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f5f1ea] px-6 text-gray-800 [color-scheme:light]">
        <div className="max-w-md rounded-sm border border-red-200 bg-white p-6 shadow-sm">
          <p className="font-medium text-red-700">Unable to open editor session.</p>
          <p className="mt-2 text-sm text-gray-600">
            {entry.error?.message || 'The editor session could not be initialized.'}
          </p>
        </div>
      </div>
    );
  }
```

This keeps the visible "Initializing editor session..." screen up until full verify success (`entry.ready`), exactly matching today's UX -- the only behavior change is that `useEditorContent`/`useClientConfig`'s network requests are already in flight underneath that screen once entry resolves, rather than only starting after verify too.

- [ ] **Step 4: Confirm no `bootstrap.` references remain**

Run: `grep -n "bootstrap\." src/features/editor/pages/EditorPage.jsx`
Expected: no output (all `bootstrap.*` references replaced by `entry.*` in Steps 2-3)

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev` (or the project's existing dev-server command), open `/editor?docid=<a-valid-test-doc-id>` in a browser with a valid stored session (or via the localhost bypass path already covered by existing tests), and confirm:
- The "Initializing editor session..." screen shows briefly then the editor loads, matching current behavior.
- The browser network tab shows the document-content request starting before/alongside the verify request, not strictly after it (open devtools Network tab, filter by the `verifysession`/`getdocs`/document-content endpoint names used by `apiService`, and compare timestamps).

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/features/editor/pages/EditorPage.jsx
git commit -m "refactor(editor): wire EditorPage to core/useEditorEntry"
```

---

## Task 8: Add `checkBrowserCompatibility()` call to `ValidateUrlPage.jsx`

**Files:**
- Modify: `src/features/landing/pages/ValidateUrlPage.jsx`

**Interfaces:**
- Consumes: `core/browserCompatibility.js` (`checkBrowserCompatibility`, unchanged, already exists)
- Consumes: `features/landing/messages/index.js` (`showLandingMessage`, `LandingMessageKey`, already imported in this file)

- [ ] **Step 1: Confirm the message key exists**

Run: `grep -rn "UNSUPPORTED_BROWSER" src/features/landing/messages`
Expected: at least one match (the key already used by `BrowserCompatibilityGate.jsx`)

- [ ] **Step 2: Add the import**

In `src/features/landing/pages/ValidateUrlPage.jsx`, add to the existing import block (near the `isLocalHost` import):

```js
import { checkBrowserCompatibility } from '../../../services/core/browserCompatibility.js';
```

- [ ] **Step 3: Call it inside `validateByKey`, alongside the existing maintenance check**

Change:

```js
    async function validateByKey(key) {
      try {
        await initMaintenance({ init: true });
        fireMaintenanceAlert();
        initDownloadService();
        initErrorOps();

        if (alertParam === 'idle_session_log_out') {
          await showLandingMessage(LandingMessageKey.SESSION_OUT);
        }
```

to:

```js
    async function validateByKey(key) {
      try {
        const browserInfo = checkBrowserCompatibility();
        if (!browserInfo.isAllowed || !browserInfo.isCompatible) {
          await showLandingMessage(LandingMessageKey.UNSUPPORTED_BROWSER);
        }

        await initMaintenance({ init: true });
        fireMaintenanceAlert();
        initDownloadService();
        initErrorOps();

        if (alertParam === 'idle_session_log_out') {
          await showLandingMessage(LandingMessageKey.SESSION_OUT);
        }
```

This is non-blocking (matches `BrowserCompatibilityGate`'s existing behavior of showing a message but not preventing use), and reuses the `UNSUPPORTED_BROWSER` message key confirmed in Step 1.

- [ ] **Step 4: Manual smoke test**

Run the dev server, open `/validateurl?key=<a-valid-test-key>` in a modern supported browser, and confirm no unsupported-browser toast appears and validation proceeds normally.

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/features/landing/pages/ValidateUrlPage.jsx
git commit -m "feat(landing): validate browser compatibility explicitly in ValidateUrlPage"
```

---

## Task 9: Build `services/session/idleTimeout.js` and wire into `EditorPage.jsx`

**Files:**
- Modify: `src/services/session/sessionConfig.js`
- Create: `src/services/session/idleTimeout.js`
- Create: `src/features/editor/hooks/useIdleTimeout.js`
- Modify: `src/features/editor/pages/EditorPage.jsx`
- Modify: `src/services/session/index.js`
- Test: Create `tests/unit/session/idleTimeout.test.js`

**Interfaces:**
- Consumes: `session/sessionGateway.js` (`closeSessionFromEditor`, unchanged); `core/editorSessionStorage.js` (`getEditorSessionContextFromStorage`, `clearEditorSessionHandshake`) from Task 2; `session/tabPresence.js` (`releaseValidateTab`, `stopTabPresence`, unchanged)
- Produces: `startIdleTimeoutWatcher({ timeoutMs, onIdle })` returning a `stop()` function, importable from `session/idleTimeout.js`; `useIdleTimeout({ enabled })` React hook, importable from `features/editor/hooks/useIdleTimeout.js`.

- [ ] **Step 1: Add `idleTimeoutMs` to `sessionConfig.js`**

In `src/services/session/sessionConfig.js`, add one line to the `sessionConfig` object (after `landingRetryMax`):

```js
  landingRetryMax: toNumber(env('SESSION_LANDING_RETRY_MAX', 'VITE_SESSION_LANDING_RETRY_MAX', 3), 3),
  idleTimeoutMs: toNumber(env('SESSION_IDLE_TIMEOUT_MS', 'VITE_SESSION_IDLE_TIMEOUT_MS', 30 * 60 * 1000), 30 * 60 * 1000),
  editorPath: env('SESSION_EDITOR_PATH', 'VITE_SESSION_EDITOR_PATH', '/editor'),
```

(30 minutes default, overridable via `VITE_SESSION_IDLE_TIMEOUT_MS`.)

- [ ] **Step 2: Write the failing test for the watchdog**

Create `tests/unit/session/idleTimeout.test.js`:

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startIdleTimeoutWatcher } from '../../../src/services/session/idleTimeout.js';

describe('startIdleTimeoutWatcher', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onIdle after timeoutMs with no activity', () => {
    const onIdle = vi.fn();
    startIdleTimeoutWatcher({ timeoutMs: 1000, onIdle });

    vi.advanceTimersByTime(999);
    expect(onIdle).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('resets the timer on activity', () => {
    const onIdle = vi.fn();
    startIdleTimeoutWatcher({ timeoutMs: 1000, onIdle });

    vi.advanceTimersByTime(800);
    window.dispatchEvent(new Event('mousemove'));
    vi.advanceTimersByTime(800);
    expect(onIdle).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('stops firing after stop() is called', () => {
    const onIdle = vi.fn();
    const stop = startIdleTimeoutWatcher({ timeoutMs: 1000, onIdle });

    stop();
    vi.advanceTimersByTime(2000);
    expect(onIdle).not.toHaveBeenCalled();
  });

  it('does nothing and returns a no-op when onIdle is not a function', () => {
    const stop = startIdleTimeoutWatcher({ timeoutMs: 1000 });
    expect(() => stop()).not.toThrow();
    vi.advanceTimersByTime(2000);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/unit/session/idleTimeout.test.js`
Expected: FAIL -- `Failed to resolve import "../../../src/services/session/idleTimeout.js"`

- [ ] **Step 4: Create `src/services/session/idleTimeout.js`**

```js
import { sessionConfig } from './sessionConfig.js';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'focus', 'scroll', 'touchstart'];

/**
 * Client-side inactivity watchdog. Calls onIdle once after timeoutMs of no
 * tracked activity; any tracked activity resets the timer. Returns a stop()
 * function that clears the timer and removes all listeners.
 */
export function startIdleTimeoutWatcher({ timeoutMs = sessionConfig.idleTimeoutMs, onIdle } = {}) {
  if (typeof window === 'undefined' || typeof onIdle !== 'function') {
    return () => {};
  }

  let timer = null;

  function reset() {
    if (timer) clearTimeout(timer);
    timer = setTimeout(onIdle, timeoutMs);
  }

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, reset, { passive: true });
  });

  reset();

  return function stopIdleTimeoutWatcher() {
    if (timer) clearTimeout(timer);
    timer = null;
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, reset);
    });
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/unit/session/idleTimeout.test.js`
Expected: PASS (4 tests)

- [ ] **Step 6: Export `idleTimeout.js` from the session barrel**

In `src/services/session/index.js`, add:

```js
export * from './idleTimeout.js';
```

(This is the export deferred from Task 4, now safe since the file exists.)

- [ ] **Step 7: Create `src/features/editor/hooks/useIdleTimeout.js`**

```js
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { closeSessionFromEditor } from '../../../services/session/sessionGateway.js';
import { startIdleTimeoutWatcher } from '../../../services/session/idleTimeout.js';
import {
  clearEditorSessionHandshake,
  getEditorSessionContextFromStorage
} from '../../../services/core/editorSessionStorage.js';
import { releaseValidateTab, stopTabPresence } from '../../../services/session/tabPresence.js';

/**
 * Mounts an inactivity watchdog while enabled. On expiry: closes the linksharing
 * session, releases the same-browser tab lock, clears the handshake, and
 * redirects to /validateurl with the idle_session_log_out alert.
 */
export default function useIdleTimeout({ enabled = true } = {}) {
  const navigate = useNavigate();
  const firingRef = useRef(false);

  useEffect(() => {
    if (!enabled) return undefined;

    firingRef.current = false;

    const stop = startIdleTimeoutWatcher({
      onIdle: async () => {
        if (firingRef.current) return;
        firingRef.current = true;

        const { docId, sessionId, accessKey } = getEditorSessionContextFromStorage();

        try {
          await closeSessionFromEditor({ docId, sessionId });
        } finally {
          if (docId) {
            releaseValidateTab({ docId });
          }
          stopTabPresence();
          clearEditorSessionHandshake({ clearValidateKey: false });

          const query = new URLSearchParams();
          if (docId) query.set('docid', docId);
          if (accessKey) query.set('key', accessKey);
          query.set('alert', 'idle_session_log_out');
          navigate(`/validateurl?${query.toString()}`);
        }
      }
    });

    return stop;
  }, [enabled, navigate]);
}
```

- [ ] **Step 8: Wire `useIdleTimeout` into `EditorPage.jsx`**

Add the import near the other hook imports in `src/features/editor/pages/EditorPage.jsx`:

```js
import useIdleTimeout from '../hooks/useIdleTimeout.js';
```

Add the hook call right after the `entry` hook and its redirect effect (i.e. immediately after the `useEffect` block that navigates on `entry.error?.redirectTo`):

```js
  useIdleTimeout({ enabled: entry.ready });
```

- [ ] **Step 9: Manual smoke test**

Run the dev server, open the editor with a valid session, temporarily set `VITE_SESSION_IDLE_TIMEOUT_MS=5000` in the local `.env` (or equivalent env override the project already uses), leave the tab idle for 5+ seconds, and confirm it redirects to `/validateurl?docid=...&alert=idle_session_log_out` and shows the existing "session timed out" landing message. Revert the env override afterward.

- [ ] **Step 10: Run the full test suite**

Run: `npx vitest run`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add src/services/session/sessionConfig.js src/services/session/idleTimeout.js src/services/session/index.js src/features/editor/hooks/useIdleTimeout.js src/features/editor/pages/EditorPage.jsx tests/unit/session/idleTimeout.test.js
git commit -m "feat(session): add idle-timeout watchdog wired into EditorPage"
```

---

## Task 10: Final verification sweep

**Files:** none created/modified -- verification only.

- [ ] **Step 1: Grep for any remaining stale import paths**

Run:

```bash
grep -rn "services/session/sessionStorage\.js\|services/session/shareKeyContext\.js\|services/session/userInfoBridge\.js\|services/session/editorSessionBootstrap\.js\|services/session/editorSessionSteps\.js\|services/session/useEditorSessionBootstrap\.js" src tests
```

Expected: no output. If anything appears, fix that import path to point at the corresponding `services/core/*` file (per the mapping table in the spec's "File-by-file disposition" section) before continuing.

- [ ] **Step 2: Grep for the stray `debugger;` the spec called out**

Run: `grep -rn "debugger;" src/services/session src/services/core`
Expected: no output (it lived in `editorSessionSteps.js`, deleted in Task 5)

- [ ] **Step 3: Run the full test suite one more time**

Run: `npx vitest run`
Expected: PASS, all suites green

- [ ] **Step 4: Run the project's lint/build check, if one exists**

Run: `npm run lint` (if defined in `package.json`) and `npm run build`
Expected: both succeed with no new errors

- [ ] **Step 5: Confirm the design spec's success criteria**

Re-read `docs/superpowers/specs/2026-09-08-session-core-split-design.md`'s "Success Criteria" section and check each line against the current tree:
- `services/session/` contains only `sessionGateway.js`, `sessionCheckClassify.js`, `sessionPayloads.js`, `sessionConfig.js`, `sessionConstants.js`, `sessionSource.js`, `tabPresence.js`, `idleTimeout.js`, `runtimeFlags.js`, `sessionServiceClient.js`, `sessionSocketClient.js`, `skills.md`, `README.md`, `index.js` -- run `ls src/services/session` and compare.
- `services/core/` contains the new `editorSessionStorage.js`, `shareKeyEntry.js`, `userInfoEntry.js`, `editorEntry.js`, `useEditorEntry.js` alongside the untouched legacy files -- run `ls src/services/core` and compare.
- No behavior change to PLOS auth -- confirm `src/features/landing/landingAccess.js` and `src/features/landing/plos/*` are untouched (`git diff main -- src/features/landing/landingAccess.js src/features/landing/plos` should be empty, or use whatever the base branch is called).

- [ ] **Step 6: No commit for this task** -- it's verification-only. If any check fails, go back to the relevant task, fix it there, and re-run this task's checks before considering the plan complete.

---

## Plan Self-Review

- **Spec coverage:** Every Decisions-table row and Data-Flow section in the design spec maps to a task: storage/shareKey/userInfo relocation -> Tasks 1-4; entry+verify split with the "parallel" behavior -> Tasks 5-7; browser-compat call site -> Task 8; idle timeout -> Task 9; stray `debugger;` and general cleanup -> Tasks 5 and 10. `tabPresence.js`/`sessionSource.js` staying put and legacy `core/*` classes staying untouched are explicitly called out as constraints and verified in Task 10.
- **Placeholder scan:** No task contains "TBD"/"handle appropriately"/"similar to Task N" -- every code block is complete, copy-pasteable content taken from (or a direct, fully-written variant of) the actual current file contents.
- **Type/signature consistency:** `resolveEditorEntryState`/`verifyEditorEntry` (Task 5) are consumed with the exact same names and shapes by `useEditorEntry` (Task 6); `useEditorEntry`'s returned `{ loading, entryReady, ready, error, session }` matches exactly what `EditorPage.jsx` reads in Task 7; `getEditorSessionContextFromStorage`/`clearEditorSessionHandshake` (Task 2) are consumed with identical names by both `useEditorLogout.js` (already existing) and the new `useIdleTimeout.js` (Task 9).
