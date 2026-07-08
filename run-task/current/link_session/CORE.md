# LinkSessionCore — Developer Reference

UI-free linksharing session engine. Extended by `LinkSessionModule` (landing) and `LinkSessionService` (editor).

**Full architecture:** [MODULES.md](./MODULES.md)

---

## Class overview

```javascript
class LinkSessionCore {
    static get PROCESS() { /* check, scheduler, update_reqstatus_time, ... */ }
    static get DOC_STATUS() { /* ACTIVE: '1', INACTIVE: '0' */ }
    static get REQUEST_STATUS() { /* PENDING, ACCEPTED, REJECTED */ }
}
```

Instance state:

| Field | Purpose |
|-------|---------|
| `_schedulerInterval` | 15s editor poll timer |
| `_schedulerOwner` | `CHECK_REQUEST` facade reference |
| `_editorOwner` | Same as facade during editor session |
| `_landingCtxState` | Persisted `sessionStartTime` / `grantSessionStartTime` for bootstrap ajax |

---

## Payload builders

All builders merge `ctx` fields with `ADD_DEFAULT_KEYS` via `enrichLinkSharePayload`.

| Method | `process` |
|--------|-----------|
| `buildCheckPayload` | `check` |
| `buildSchedulerPayload` | `scheduler` |
| `buildUpdateRequestStatusPayload` | `updaterequeststatus` |
| `buildUpdateStatusReqStatusPayload` | `updatestatus_reqstatus` |
| `buildUpdateReqStatusPayload` | `updatereqstatus` |
| `buildUpdateReqStatusTimePayload` | `update_reqstatus_time` |
| `buildSendRequestPayload` | `update_docstatus_reqstatus_insert_time` |
| `buildGetRequestStatusPayload` | `getrequeststatus_process` |
| `buildClosePayload` | `close` |
| `buildSavePayload` | `save` |
| `buildUpdateSessionEndTimePayload` | `update_session_end_time` |

Prefer `buildPayload(process, ctx)` or `getJsonOrBuild(process, extra, ctx)` — uses `GET_JSON('linksharing', …)` when available.

---

## Landing handlers

### `loginFromLanding(ctx)`

1. `onResetHidden()`
2. `sessionStartTime = Date.now()` → stored on `ctx` and `captureLandingCtxState`
3. `POST check` → `handleCheckResponse`

### `handleCheckResponse(response, ctx)`

| `r` | Action |
|-----|--------|
| `1` | `completeAccessGrant` |
| `0` | `delegateSendPrompt` → send UI |
| `2` | `onAccessDeniedWithRemarks` |

Also: `maybeCollatorForceClose`, `isCollabBypass` (collab may skip verify).

### `sendAccessRequest(response, ctx)`

See [send module README](../link_session_send/README.md) for branch table.

### `completeAccessGrant(ctx, checkResponse, options)`

1. Unless `skipVerify` or `canforceClose`: `confirmSessionOnServer` (getdocs)
2. On verify fail: `onVerifyFailed` or re-prompt send
3. `commitStorageAndRedirect`

Poll success uses `skipVerify: true` in `handleGetReqStatus`.

### Landing state persistence

```javascript
captureLandingCtxState(ctx);  // after sessionStartTime / grantSessionStartTime set
mergeLandingCtxState(ctx);    // bootstrap ajax callbacks via resolveLandingSessionContext()
```

---

## Editor handlers

### `createEditorFacade()`

Returns `CHECK_REQUEST` object with:

| Key | Role |
|-----|------|
| `Init` | `initEditorSession` |
| `check_request` | `startScheduler` |
| `new_request_post` | `handleNewRequestPost` |
| `open_new_request` | `handleOpenNewRequestDefault` |
| `runIdleCheck` | `handleIdleCheck` |
| `StopAll` | `stopEditorSession` |

### `initEditorSession(owner)`

1. `update_session_end_time` or `refresh` (timeout)
2. `scheduler` (interval 15s)

### `handleOpenNewRequestDefault(response, owner)`

- Idle &gt; 15 min on active row → `idle_session_close`
- Else → force save + `openRequestDialog`

---

## Double-verify

`confirmSessionOnServer(expected)`:

1. `POST getdocs` with `buildSessionFindQuery`
2. `isActiveSessionRecord` — matches `docid`, `docstatus: 1`, `session_end_time: 0`, `session_id`

`session_start_time` mismatch check is currently relaxed (commented in core).

---

## HTTP

```javascript
postLinkShare(jsondata)  // POST API_LINK_SHARE, field jsondata
postGetDocs(query)       // POST API_GET_DOCS
```

Errors logged via `ErrorLogTrace`.

---

## Extension points

| Need | Approach |
|------|----------|
| New landing UI step | Add sub-module; register on `LinkSessionPorts`; wire `ctx.ui` in `LandingPage` |
| New editor dialog | Extend or replace `LinkSessionRequestModule` |
| New backend process | Add to `PROCESS`, builder method, handler, bootstrap callback if ajax-routed |
| Editor-only behavior | Override in `LinkSessionService` or facade method |

---

## Do not

- Put Swal / `AlertNewDialog` calls in core (use send/request modules)
- Call `delegateSendPrompt` from `ctx.ui.sendPrompt` (recursion risk)
- Rely on `LinkSessionCore.getInstance()` — use landing `LinkSessionModule` or editor `LinkSessionService`

---

## Tests

[`tests/unit/link_session/`](../../../tests/unit/link_session/)

- `buildPayload.test.js` — payload shapes
- `sendRequest.test.js` — send branches, delegation
- `landingCtxState.test.js` — state persistence
- `ports.test.js` — `openRequestDialog` retry
- `editorInit.test.js` — init order contract
