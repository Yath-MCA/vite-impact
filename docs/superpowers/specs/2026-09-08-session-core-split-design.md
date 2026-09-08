# Session / Core Responsibility Split — Design Spec

**Date:** 2026-09-08
**Status:** Draft — pending user review
**Repo:** `impact_react_vite`
**Related prior work:**
- `2026-09-07-editor-session-init-ownership-design.md` (established `bootstrapEditorSession` as the sole editor session gate, with ordered steps in `editorSessionSteps.js`)
- `2026-09-07-localhost-session-bypass-sharekey-payload-design.md` (shareKey-mandatory / localhost bypass rules)
**Legacy reference:** `src/services/core/*.js` (`InitService`, `EditorInitService`, `SharedKeyService`, `StorageService`, `URLService`, `SessionGuard`) — jQuery-era classes wired only through `GlobalBridge` for legacy `window.INIT_CONFIG` / `window.EDITOR_INITIALIZE` globals.

## Relationship to the 2026-09-07 ownership spec

The 2026-09-07 spec's core principle — **one editor session gate, ordered steps, no revived `InitService` authority** — is unchanged and this spec does not contradict it. What changes is *where the non-verify steps live*: this spec relocates docId resolution, storage read/write, shareKey resolution, and user-info resolution out of `services/session/` and into new `services/core/` files, so that `services/session/` narrows to exactly session-verification concerns (DB match, idle timeout, send/receive). The single-gate step order from the prior spec is preserved; only the module boundary moves. `InitService.js` and the other legacy `core/` classes are **not** touched or revived as an authority — the new `core/` files are separate, plain ES modules alongside them.

## Problem

`services/session/` currently does two unrelated jobs at once:

1. **Entry orchestration** (who is this, what doc, what access): resolve `docId`, read/recover local & session storage, resolve the `shareKey` object, resolve user identity.
2. **Session verification proper**: check the local/session-storage-derived identity against the DB (`verifySession`), and the request send/receive flow (`checkSession`, `sendAccessRequest`, `pollAccessRequest`, `closeSessionFromEditor`).

`services/core/` today holds none of the real React entry logic — it's a legacy jQuery-class shim (`InitService`, `SharedKeyService`, etc.) used only by `GlobalBridge` for old `window.*` globals, explicitly **not** the React `/editor` gate (per `GlobalBridge.js` comment and the 2026-09-07 spec).

This mixes two different lifecycles in one folder, makes `services/session/` harder to reason about as "the session layer," and leaves `services/core/` without any real ownership in the current React app — despite its name suggesting it should be the entry point.

Separately: `ValidateUrlPage.jsx` reaches into `services/session/` directly for storage/shareKey/user-info writes (bypassing any orchestrator), so the same entry-vs-session mixing exists there too. No client-side idle-timeout exists anywhere yet. Browser-compatibility and maintenance validation are two more entry-time checks that belong with `ValidateUrlPage`'s own flow, with maintenance already there and browser-compat currently only enforced app-wide.

## Goals

- `services/session/` contains **only**: DB-match verification (`verifySession`), the request send/receive flow (`checkSession`/`sendAccessRequest`/`pollAccessRequest`/`closeSessionFromEditor`/`loginFromLanding`/`continueBlockedSession`/`pollAndResolve`), their supporting payload/config/constants/classification helpers, `tabPresence.js` (unchanged), and a new idle-timeout watchdog.
- `services/core/` becomes the real entry point for the React app: local/session storage read+write, shareKey object resolution, user-info resolution, and an orchestrator that resolves entry state **in parallel with** calling into `services/session` for the DB-verify step.
- `EditorPage.jsx` and `ValidateUrlPage.jsx` both route their storage/shareKey/user-info reads through the new `services/core/` files instead of importing `services/session/*` directly for those concerns.
- Add a client-side idle-timeout watchdog (new functionality) that closes the session and redirects to the existing `idle_session_log_out` alert flow.
- `ValidateUrlPage.jsx` explicitly runs `checkBrowserCompatibility()` alongside its existing maintenance check, in addition to (not replacing) the app-wide `BrowserCompatibilityGate`.
- Preserve existing behavior for PLOS reCAPTCHA/access-code auth (`landingAccess.js`, `authenticationFlow.js`, `useLandingUserValidation`) — untouched.
- Preserve the existing success/failure contract shape (`{ ok, reason, message, redirectTo }` / `{ loading, ready, error, session }`) so `EditorPage.jsx` and `ValidateUrlPage.jsx` don't need unrelated rewrites.

## Non-Goals

- Rewriting or retiring the legacy `services/core/*.js` classes (`InitService`, `EditorInitService`, `SharedKeyService`, `StorageService`, `URLService`, `SessionGuard`) or `GlobalBridge` — they stay as-is for legacy `window.*` global support.
- Changing PLOS reCAPTCHA/OTP/access-code auth behavior.
- Changing Java/backend linkShare or urlvalidity semantics.
- Adding a warning modal before idle logout (plain redirect only, per decision below).
- Moving `tabPresence.js` out of `services/session/`.
- Removing the app-wide `BrowserCompatibilityGate` from `AppRouter.jsx`.

## Decisions

| Topic | Decision |
|---|---|
| Legacy `core/*` classes | Untouched; new entry-point logic lives in new files alongside them |
| Idle timeout trigger/action | Inactivity timer → `closeSessionFromEditor` → redirect to `/validateurl?alert=idle_session_log_out` (no warning modal) |
| Scope | Both `EditorPage.jsx` and `ValidateUrlPage.jsx` route storage/shareKey/user-info through `services/core/` |
| `sessionSource.js` pure normalizers | Stay as shared, dependency-free util; imported by both `core/` and `session/` |
| `tabPresence.js` | Stays in `services/session/` as-is |
| Browser compatibility | `ValidateUrlPage` explicitly calls `checkBrowserCompatibility()` in addition to the existing app-wide `BrowserCompatibilityGate` (neither replaces the other) |
| Maintenance validation | Already in `ValidateUrlPage` (`initMaintenance`/`fireMaintenanceAlert`); no change, just confirmed as staying there |
| PLOS reCAPTCHA/access-code | Out of scope; preserved as-is |

---

## Architecture

```
services/core/                    (entry point — resolves WHO/WHAT/WHERE)
  editorSessionStorage.js           local/sessionStorage read+write
                                    (relocated from session/sessionStorage.js)
  shareKeyEntry.js                  resolves sharedKey object: storage -> getdocs fallback
                                    (relocated from session/shareKeyContext.js)
  userInfoEntry.js                  resolves user details
                                    (relocated from session/userInfoBridge.js +
                                     the user-info-only helpers in editorSessionSteps.js)
  editorEntry.js                    orchestrator (see Data Flow below)
  useEditorEntry.js                 React hook wrapping editorEntry.js
                                    (replaces session/useEditorSessionBootstrap.js)
  browserCompatibility.js           UNCHANGED - already here; new call site added in ValidateUrlPage
  InitService.js, EditorInitService.js, SharedKeyService.js,
  StorageService.js, URLService.js, SessionGuard.js   UNCHANGED (legacy, GlobalBridge-only)

services/session/                 (session-only: DB match, idle timeout, send/receive)
  sessionGateway.js                 check/verify/send/poll/close - UNCHANGED
  sessionCheckClassify.js, sessionPayloads.js,
  sessionConfig.js, sessionConstants.js               UNCHANGED
  idleTimeout.js                    NEW - activity watchdog
  tabPresence.js                    UNCHANGED
  sessionSource.js                  UNCHANGED location; pure normalizers, imported by both sides

features/editor/pages/EditorPage.jsx        switches to core/useEditorEntry
features/landing/pages/ValidateUrlPage.jsx  switches storage/shareKey/user-info imports to
                                             core/*, keeps session/sessionGateway.js calls,
                                             adds checkBrowserCompatibility() call
features/landing/hooks/useLandingUserValidation.js  switches to core/userInfoEntry.js,
                                                     core/editorSessionStorage.js
```

### File-by-file disposition

| Current file | New home | Notes |
|---|---|---|
| `session/sessionStorage.js` | `core/editorSessionStorage.js` | All local/sessionStorage read+write functions move as-is (`getStoredEditorSession`, `commitSessionForEditor`, `setPendingValidateResponse`, `getPendingValidateResponse`, `setValidateAccessKey`, `getValidateAccessKey`, `clearValidateAccessKey`, `clearEditorSessionHandshake`, `clearDocScopedLocalData`, `saveLegacyLocalStorageData`, `getEditorSessionContextFromStorage`, `buildSessionContextFromDocData`, `persistMaintenanceStart`, `stripIdleSessionSignOffAlert`) |
| `session/shareKeyContext.js` | `core/shareKeyEntry.js` | `resolveShareKeyContext`, `readShareKeyFromLocalStorage` move as-is |
| `session/userInfoBridge.js` | `core/userInfoEntry.js` | `setUserInfo`, `getUserInfo`, `clearUserInfo`, `toLegacyUserInfo` move as-is |
| `session/editorSessionSteps.js`: `resolveEditorDocId`, `resolveEditorUserInfo`, `assertEditorAccess` | `core/editorEntry.js` | Entry-side steps; `loadOrRecoverEditorSession`'s storage-read half also moves here |
| `session/editorSessionSteps.js`: `verifyEditorSession` (thin wrapper over `verifySession`) | stays conceptually in `session/`, called by `core/editorEntry.js` | The DB-match check itself is session's job; `core/editorEntry.js` calls it, doesn't own it |
| `session/editorSessionBootstrap.js` | `core/editorEntry.js` | Orchestrator relocates; same step order as the 2026-09-07 spec, split across the `core`/`session` boundary (see Data Flow) |
| `session/useEditorSessionBootstrap.js` | `core/useEditorEntry.js` | Same hook contract (`{ loading, ready, error, session }`) |
| `session/sessionSource.js` | unchanged location | Pure normalizer, imported by both `core/` and `session/` |
| `session/sessionGateway.js`, `sessionCheckClassify.js`, `sessionPayloads.js`, `sessionConfig.js`, `sessionConstants.js`, `tabPresence.js` | unchanged | These are exactly "DB match + send/receive" and stay put |
| `session/index.js` | updated | Re-export the moved pieces from their new home so any remaining `from '.../services/session'` barrel imports don't silently break; audit call sites and prefer direct imports from the new `core/` files going forward |
| stray `debugger;` (`editorSessionSteps.js:63`) | removed | Dropped when `loadOrRecoverEditorSession` is split/relocated |

---

## Data Flow

### EditorPage entry (replaces today's `bootstrapEditorSession`)

```
core/useEditorEntry(docId, locationSearch)
  -> core/editorEntry.js:
      1. resolveEditorDocId(docId, locationSearch)          - fail: no_doc_id
      2. core/editorSessionStorage.getStoredEditorSession    - read local/session storage
         (if missing sessionId -> recoverEditorSessionByDocId via session/sessionGateway,
          then core/editorSessionStorage.commitSessionForEditor)
                                                               - fail: missing_session_id / recovery reasons
      3. core/shareKeyEntry.resolveShareKeyContext(docId)     - fail: missing_share_key
      4. core/userInfoEntry (resolveEditorUserInfo equivalent, using sessionSource + shareKey ctx)
      5. assertEditorAccess(sessionId, userInfo)              - fail: access_denied / missing_session_id
      6. PARALLEL:
           a. kick off editor instance content init (existing useEditorContent/useClientConfig
              in EditorPage.jsx, unblocked as soon as docId + sessionSource are known)
           b. session/sessionGateway.verifySession(ctx)        - fail: verify_failed
         combine via Promise.all-style join; both must succeed
      7. return { ok: true, docId, sessionId, sessionStartTime, validateKey, sessionSource,
                  userInfo, recovered, bypassed }
```

Step order 1-5 matches the 2026-09-07 spec's canonical order (docId -> session -> shareKey -> user/access), with step 6 (verify) now explicitly run in parallel with kicking off content load rather than strictly before it -- this is the "parallel get session result" behavior requested. Any failure at steps 1-5 or 6b short-circuits with the existing `{ ok:false, reason, message, redirectTo }` shape; step 6a (content init) is not gating -- `EditorPage.jsx` already renders a loading state independently via `editorContent.loading`.

### ValidateUrlPage entry

```
ValidateUrlPage.validateByKey(key)
  1. core/browserCompatibility.checkBrowserCompatibility()    - surfaces UNSUPPORTED_BROWSER message
                                                                 (non-blocking today; same as existing gate behavior)
  2. initMaintenance / fireMaintenanceAlert                    - UNCHANGED, already here
  3. session/sessionGateway (via getOrCreateValidateRequest -> apiService URL_VALIDITY)  - UNCHANGED
  4. core/editorSessionStorage.setPendingValidateResponse / clearDocScopedLocalData     - moved import
  5. session/tabPresence.claimValidateTab                                              - UNCHANGED
  6. core/editorSessionStorage.setValidateAccessKey                                    - moved import
  7. on Accept -> session/sessionGateway.loginFromLanding (the DB conflict/grant check) -> navigate to /editor
```

`useLandingUserValidation.js` and `useLandingSessionFlow.js` update their imports of `sessionSource.js` normalizers (unchanged path), `userInfoBridge.js` -> `core/userInfoEntry.js`, and `sessionStorage.js` -> `core/editorSessionStorage.js`; their calls into `sessionGateway.js` (`loginFromLanding`, `continueBlockedSession`, `pollAndResolve`) are unchanged.

### Idle timeout (new)

```
EditorPage.jsx mounts session/idleTimeout.js watchdog:
  - listens for activity (mousemove/keydown/click/focus), debounced reset of a timer
  - on timer expiry:
      1. session/sessionGateway.closeSessionFromEditor(ctx)
      2. navigate('/validateurl?docid=<docId>&alert=idle_session_log_out')
         (reuses the existing alert param ValidateUrlPage.jsx already handles via
          showLandingMessage(LandingMessageKey.SESSION_OUT))
  - cleared/removed on unmount
```

No warning modal -- direct redirect on expiry, per decision above. Timeout duration comes from `sessionConfig.js` (new `idleTimeoutMs` entry, alongside existing `requestThrottleMinutes`/`pollTimeoutMs`), defaulted to a sensible value (e.g. 30 minutes) -- exact number is an implementation-plan detail, not a design constraint.

---

## Error Handling

Unchanged high-level contract from the 2026-09-07 spec:

| reason | redirect |
|---|---|
| `no_doc_id` | `/validateurl` |
| recovery failures | `/validateurl` |
| `missing_session_id` | `/validateurl` |
| `missing_share_key` | `/validateurl` |
| `access_denied` | `/validateurl` |
| `verify_failed` | `/validateurl` |
| idle timeout | `/validateurl?alert=idle_session_log_out` (new) |

Localhost verify bypass remains entirely inside `session/sessionGateway.verifySession` -- `core/editorEntry.js` only surfaces `bypassed: true` on success, exactly as `bootstrapEditorSession` does today.

---

## Testing

- Existing `tests/unit/session/` coverage for `sessionGateway`/`sessionPayloads`/`sessionCheckClassify` stays in place unchanged (these files don't move).
- New `tests/unit/core/` covering: `editorSessionStorage.js`, `shareKeyEntry.js`, `userInfoEntry.js`, and `editorEntry.js` (step order, parallel verify+content-init join, each failure reason/redirect).
- New tests for `session/idleTimeout.js`: fake timers, activity-event reset, expiry -> `closeSessionFromEditor` called -> redirect signal fired; cleanup on unmount.
- Update existing `EditorPage`/`ValidateUrlPage`/`useLandingUserValidation`/`useLandingSessionFlow` tests (if present) for the new import paths -- behavior should be unchanged, so these should be import-path-only diffs plus the new browser-compat call site.
- No InitService/legacy `core/*` class tests required (untouched, out of scope).

## Migration / Rollout

1. Create new `core/` files (`editorSessionStorage.js`, `shareKeyEntry.js`, `userInfoEntry.js`) by moving code from their `session/` counterparts; update `session/index.js` re-exports.
2. Build `core/editorEntry.js` + `core/useEditorEntry.js`; wire `EditorPage.jsx` to it; delete `session/editorSessionBootstrap.js`, `session/editorSessionSteps.js`, `session/useEditorSessionBootstrap.js` once nothing imports them.
3. Update `ValidateUrlPage.jsx` and its hooks to import from `core/*`; add the `checkBrowserCompatibility()` call site.
4. Build `session/idleTimeout.js`; wire into `EditorPage.jsx`.
5. Run full test suite; fix import-path fallout.
6. Remove the stray `debugger;` (naturally resolved when `editorSessionSteps.js` is deleted).

## Success Criteria

- `services/session/` contains only DB-match verify, send/receive request flow, and idle timeout (plus their direct support files and `tabPresence.js`).
- `services/core/` owns storage/shareKey/user-info resolution and the single entry orchestrator for both `EditorPage` and `ValidateUrlPage`.
- No behavior change for PLOS auth, maintenance validation, or the existing redirect/error contract.
- `ValidateUrlPage` explicitly validates browser compatibility as part of its own flow, in addition to the app-wide gate.
- No stray `debugger;` statements remain.

---

## Spec Self-Review

- No TBD placeholders -- idle-timeout default is called out as an implementation-plan detail, not left ambiguous about behavior (redirect target, action sequence, no modal are all fixed).
- No contradiction with the 2026-09-07 ownership spec -- relationship section explains the module-boundary relocation explicitly; step order and single-gate principle preserved.
- No contradiction with the 2026-09-07 shareKey/localhost-bypass spec -- bypass logic stays inside `verifySession`, untouched.
- Scope check: focused on one boundary relocation (session <-> core) plus one new feature (idle timeout) plus one added call site (browser compat in ValidateUrlPage) -- single implementation plan can cover this.
- Ambiguity check: "both pages," "shared normalizer," "tabPresence stays," "no warning modal," and "app-wide gate stays" were all explicit user decisions, recorded verbatim in the Decisions table.
