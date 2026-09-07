# Editor Session Init Ownership — Design Spec

**Date:** 2026-09-07  
**Status:** Approved / Implemented  
**Repo:** `impact_react_vite`  
**Related prior work:**
- Editor session bootstrap (`editorSessionBootstrap`, `useEditorSessionBootstrap`, `SessionContext`)
- Localhost bypass / shareKey / payloads (`2026-09-07-localhost-session-bypass-sharekey-payload-design.md`)
**Legacy reference:** `src/services/core/InitService.js` (`InitService.prototype.run`)

## Problem

Two parallel “open editor” paths exist:

1. **Core / GlobalBridge:** `InitService.run()` → docId, userInfo, access/admin, SharedKeyService, optional `handleAdminInit`
2. **React editor:** `EditorPage` → `bootstrapEditorSession` → storage/recovery → shareKey → `verifySession`

`/editor` (and editor read-only) is the real entry after landing/validateUrl redirect. Landing only grants/handshakes then redirects. Keeping `InitService.run` as a second gate causes duplicate ownership, unclear failure reasons, and drift from the React session model (recovery + verify + shareKey-first).

Today `bootstrapEditorSession` is a single function; it does **not** 1:1 cover every `InitService` method. The orchestrator should read like `InitService.run` (ordered steps), with an explicit port/drop map.

## Goals

- Make **`bootstrapEditorSession` the sole editor session gate** on React `/editor` (and read-only editor), equivalent in role to `InitService.prototype.run`.
- Restructure so the **flow order is obvious**: named steps in call order, matching Init’s mental model where still valid.
- Publish a **parity map**: which Init methods port into bootstrap steps, which drop, which stay out of the session gate.
- Demote `InitService` / `INIT_CONFIG.run` so React editor open does **not** depend on them as the real gate.
- Preserve Phase 2 contracts: shareKey via `xmleditor:shared:{docId}` then GET_DOCS; localhost verify bypass centralized in `verifySession`; no bypass without usable shareKey/`ctx`.

## Non-Goals

- Restoring banned globals (`window.INIT_CONFIG`, `window.SHARED_KEY`, etc.) as the active React editor init path.
- Reworking `LoadingService` / `EditorInitService` config/content load (separate bootstrap foundation / module work).
- Changing Java/backend linkShare process semantics.
- Full deletion of `InitService.js` / `public/legacy-editor/**` in this change (demote wiring first; delete later if unused).
- Renaming the public entry to `bootstrapHelper` (too vague).

## Decisions (proposed)

| Topic | Decision |
|-------|----------|
| Editor entry owner | `bootstrapEditorSession` only on React `/editor` |
| Public name | Keep `bootstrapEditorSession` (role = Init `run`) |
| Step module name | `editorSessionSteps.js` (not `bootstrapHelper`) |
| Init `run` on React path | Do not require / do not call as editor gate |
| Admin fabricate (`handleAdminInit`) | **Drop** from React gate — shareKey already via `resolveShareKeyContext`; fabricating conflicts with mandatory shareKey |
| `checkAdminStatus` | **Drop** from session gate (admin UI flag is separate, later if needed) |
| Localhost user fill (`login_*`) | **Port lightly** only when username still empty after session/shareKey |
| Recovery + verify | **Keep** (bootstrap-only; Init never had these) |
| GlobalBridge | May still mount for other globals; must not be the session gate |

---

## Architecture

### InitService.run (reference order)

```text
1. initDocumentID     → docid from URL; fail if missing
2. initUserInfo       → storage user (+ localhost login_* fill); fail if no MAIL_ID
3. checkAccess        → require MAIL_ID; checkAdminStatus
4. sharedKey resolve  → if invalid:
                          admin|localhost → handleAdminInit (GET_DOCS / fabricate)
                          else waiting/fail
                        if valid → complete
```

### Target React gate (bootstrap = run)

```text
1. resolveEditorDocId           ← initDocumentID (query/docId only; no window.DOC_ID)
2. loadOrRecoverEditorSession   ← (bootstrap-only) storage + recoverEditorSessionByDocId
3. resolveEditorUserInfo        ← initUserInfo (from session/validate/shareKey; optional login_* fill)
4. assertEditorAccess           ← checkAccess (session id + usable identity; no admin flag)
5. resolveShareKeyContext       ← sharedKey resolve (localStorage → GET_DOCS; no fabricate)
6. verifyEditorSession          ← (bootstrap-only) verifySession + localhost bypass rules
7. return ok payload            ← init:complete equivalent for React SessionContext
```

Fail at any step → `{ ok: false, reason, message, redirectTo }` (usually `/validateurl`).

```text
Landing / validateUrl
  → grant + persist session/shareKey
  → redirect /editor?docid=…

EditorPage
  → useEditorSessionBootstrap
  → bootstrapEditorSession (orchestrator only)
       → editorSessionSteps.* in order above
  → SessionContext hydrated
  → editor UI (config/content load remains separate)
```

---

## Components

### 1. `bootstrapEditorSession` (keep path)

File: `src/services/session/editorSessionBootstrap.js`

**Role:** Thin orchestrator only — same job as `InitService.prototype.run`.

**Must:**
- Call steps in the fixed order above
- Pass accumulating context (`docId`, stored session, `userInfo`, `shareKey.ctx`, …)
- Return the existing success/failure shape used by `useEditorSessionBootstrap` / `SessionContext` (stable contract unless a plan task explicitly versions it)

**Must not:**
- Contain large inline business logic that belongs in a named step
- Call `InitService.run` / `INIT_CONFIG.run`
- Invoke `LoadingService` / `EditorInitService`

### 2. `editorSessionSteps.js` (new)

File: `src/services/session/editorSessionSteps.js`

Named exports, one concern each:

| Step | Responsibility |
|------|----------------|
| `resolveEditorDocId` | `docId` arg or `?docid=`; empty → fail `no_doc_id` (move existing helper here or re-export) |
| `loadOrRecoverEditorSession` | `getStoredEditorSession`; if missing session → `recoverEditorSessionByDocId` + `commitSessionForEditor` when `allowRecovery` |
| `resolveEditorUserInfo` | Build user from normalizeSessionSource / validate data; if username empty **and** localhost, optionally fill from `login_username` / `login_userid` storage keys (thin port of Init localhost fill) |
| `assertEditorAccess` | Require `sessionId` and a usable username/email (from userInfo or shareKey ctx later in pipeline — see order note); **no** `ADMIN_USER_IDs` |
| `resolveShareKeyForEditor` | Thin wrapper around existing `resolveShareKeyContext` (or call it directly from orchestrator — prefer direct call to avoid empty wrappers) |
| `verifyEditorSession` | Call `verifySession` with session + shareKey ctx; surface `bypassed` |

**Order note:** ShareKey may supply username when validate payload is thin. Preferred order remains:

1. docId  
2. load/recover session (need `sessionId`)  
3. resolve shareKey (mandatory `ctx`)  
4. resolve userInfo (session + ctx)  
5. assert access (sessionId + identity)  
6. verify  

That is a **small reorder vs classic Init** (Init did user before shareKey). Document it: React requires shareKey for identity/payloads, so shareKey comes before final access assert and verify. DocId → session → shareKey → user/access → verify is the approved React order.

Updated canonical order for implementation:

```text
1. resolveEditorDocId
2. loadOrRecoverEditorSession
3. resolveShareKeyContext          (existing module)
4. resolveEditorUserInfo           (session + shareKey.ctx)
5. assertEditorAccess              (sessionId + identity)
6. verifyEditorSession
7. return ok payload
```

### 3. InitService demotion

File: `src/services/core/InitService.js` — leave in repo for now.

**React editor:**
- Do not call `InitService.run` / `INIT_CONFIG.run` as a prerequisite to open the editor
- `GlobalBridge` may keep legacy `INIT_CONFIG.*` shims if other code still probes them; they must not be the authority for “editor may open”

**Legacy / public paths:** out of scope unless a follow-up explicitly retires them.

### 4. Dropped Init responsibilities (explicit)

| Init method | Disposition | Rationale |
|-------------|-------------|-----------|
| `checkAdminStatus` | Drop from gate | Not required to open editor; admin UI can be separate |
| `handleAdminInit` | Drop from gate | Fabricated shareKey violates Phase 2 “shareKey mandatory / no invent”; GET_DOCS already in `resolveShareKeyContext` |
| `emit` / eventBus `init:*` | Drop from React gate | React uses return values + SessionContext |
| `window.DOC_ID` / `window.USER_INFO` / `window.SHARED_KEY` writes | Drop from React gate | Banned-globals policy |
| `LOADING_CONFIG.Init` / `EDITOR_INITIALIZE.START` | Out of scope | Config/content bootstrap, not session gate |

### 5. Hook / UI wiring

- `useEditorSessionBootstrap` continues to call `bootstrapEditorSession` only
- `EditorPage` remains gated on bootstrap result
- No second gate via GlobalBridge SessionGuard as a hard block for open (SessionGuard may still log/check stages with `ctx`; open/fail authority stays with bootstrap)

---

## Error / redirect contract

Unchanged high-level behavior:

| reason (examples) | redirect |
|-------------------|----------|
| `no_doc_id` | `/validateurl` |
| recovery failures | `/validateurl` |
| `missing_session_id` | `/validateurl` |
| `missing_share_key` | `/validateurl` |
| `verify_failed` | `/validateurl` |

Localhost verify bypass remains inside `verifySession` (Phase 2); bootstrap only surfaces `bypassed: true` on success.

---

## Testing

- Unit-test `bootstrapEditorSession` against the **step order** (mock steps or gateways): missing docId; recovery path; missing shareKey blocks; verify fail blocks; localhost bypass success still requires shareKey.
- Step-level tests for `resolveEditorUserInfo` localhost fill when username empty.
- Do **not** require InitService tests for React gate parity.
- Keep existing bootstrap / shareKey / verify tests green; update imports if helpers move.

## Migration / rollout

1. Extract steps → wire orchestrator → tests green  
2. Confirm EditorPage path never awaits `INIT_CONFIG.run`  
3. Optional follow-up: remove dead Init calls from GlobalBridge editor path; later delete InitService if unused  

## Success criteria

- A reader can open `editorSessionBootstrap.js` and see the same “run sequence” clarity as `InitService.prototype.run`
- React `/editor` has one session authority: bootstrap  
- Parity map above is implemented (port/drop honored)  
- Phase 2 shareKey + localhost verify rules unchanged  

---

## Spec self-review

- No TBD placeholders for ownership or order  
- No contradiction with Phase 2 shareKey/bypass rules (`handleAdminInit` explicitly dropped)  
- Scope limited to session-gate ownership + step structure; Loading/EditorInit excluded  
- Naming: `bootstrapEditorSession` + `editorSessionSteps.js` (not `bootstrapHelper`)
