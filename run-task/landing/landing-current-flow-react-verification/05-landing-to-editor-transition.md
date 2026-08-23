# 05 - Landing To Editor Transition

The landing page should redirect to the editor only after all validation and access guards have passed.

## Redirect URL Construction

Current logic uses `buildEditorRedirectUrl(source)`.

Behavior:

- Base path comes from `PAGE_ReDIRECT[0]`.
- Document id is appended.
- Domain root is prepended for non-local cases.
- The result is stored in `redirect_url`.

React migration requirement:

- Build the editor URL as a pure function from environment + document id.
- Keep local environment exceptions compatible.
- Do not build a final redirect URL before a validated `docid` exists.

## Redirect Action

`redirect()` is the current landing action behind `AGREE & CONTINUE`.

It performs:

1. Load current response state from pending commit data, `RES_DATA`, or `SHARED_KEY`.
2. Check whether landing auth is still required.
3. If required, run deferred auth and stop until auth succeeds.
4. Send landing dwell/time tracking.
5. Mark landing auth complete.
6. Build editor redirect URL if missing.
7. Run link-session access from landing.
8. Commit storage and redirect only after grant and confirmation.

React migration requirement:

- Implement `continueToEditor()` as an async guarded operation.
- Disable repeated clicks while the operation is pending.
- Keep auth, access, storage commit, session confirmation, and navigation as separate steps with explicit failure states.

## Storage Commit

`setItemsandReDirect(DOC_ID, NEW_SESSION_ID, url, re_direct, options)` is the legacy storage and navigation gate.

Before redirect it:

- Clears document-specific editor storage.
- Stores document id.
- Stores session id.
- Stores redirect/landing URL state.
- Mirrors state where required by legacy storage helpers.
- Stores `MAINTENANCE_START` when maintenance is active.

React migration requirement:

- Keep storage writes after access grant, not before.
- Scope stored state by document id when possible.
- Remove stale values before writing the new session.
- Preserve any keys consumed by the current editor until the editor is migrated.

## Server Confirmation Before Navigation

After storage commit, legacy code verifies the active session row before navigation unless explicitly told to skip.

Guard behavior:

1. Find the confirmation service.
2. Verify expected `docId` and `sessionId`.
3. If valid, navigate to the editor.
4. If recoverable, run landing retry and verify again.
5. If still invalid, clean up backup state, clear editor tab id, show `Land_Page_TRY_AGAIN`, and do not navigate.

React migration requirement:

- Keep this as the last gate before `navigate()` or `window.location.href`.
- Do not convert it into a background check after navigation.
- For React Router migration, call navigation only after confirmation returns success.

## Editor Boot Contract

The editor side expects session state to be available before boot.

Current editor boot phases documented in `src/modules/shared/link_session/CORE.md` include:

1. Config batch.
2. Session validation.
3. `openhtml`.
4. CKEditor replace.
5. CKEditor `instanceReady`.
6. Module bootstrap.
7. Tier 1 modules.
8. Query load.
9. Fully loaded event.
10. Tier 2 checks such as request/logout.

React landing migration requirement:

- Do not change the shape/timing of editor session storage unless the editor boot path is migrated at the same time.
- Preserve `docid`, `sessionid`, and landing URL state consumed by editor scripts.
- Verify that editor session validation still passes after React landing redirects.

## Landing To Editor Failure States

The React app should expose these states clearly:

| State | User outcome | Navigation allowed |
| --- | --- | --- |
| Missing URL key | Invalid link | No |
| Browser unsupported | Unsupported browser alert | No |
| Maintenance block | Maintenance message | No |
| URL invalid | Invalid/expired link | No |
| Same browser open | Already open alert | No |
| Auth pending | Email/OTP/captcha UI | No |
| Auth failed | Error or retry UI | No |
| Access conflict | Request access/poll UI | No |
| Access denied | Denied message | No |
| Access granted, confirmation failed | Try again | No |
| Access granted, confirmation passed | Redirect editor | Yes |

