# 04 - Link Session And Access Validation

After URL validation and required landing authentication, the current landing page validates whether the user can open the document editor. This is handled by `LinkSessionModule` and `LinkSessionCore`.

## Access Entry Point

In `LandingPage.js`, `redirect()` builds a landing session context and calls:

```js
service.accessFromLanding(buildLandingSessionContext())
```

If `LinkSessionModule` is unavailable, the legacy fallback directly posts a `linksharing` `check` request through `commonfn.callajax`.

React migration requirement:

- Prefer the shared link-session service behavior.
- Keep the legacy fallback only if the old scripts must coexist during phased rollout.
- Do not duplicate the check/grant/deny logic in individual React components.

## Landing Session Context

`buildLandingSessionContext()` collects:

- `docId`
- `sessionId`
- `requestId`
- URL validation response data
- user name
- role name
- landing URL
- editor redirect URL
- callbacks for storage commit, redirect, retry, access denied, and request errors
- UI hooks for access prompt and polling state

React migration requirement:

- Represent this as a typed context object.
- Build it only after URL validation/auth is complete.
- Do not write editor session storage during context construction.

## Check Access Request

`accessFromLanding(ctx)`:

1. Resets hidden-page tracking.
2. Builds a `linksharing` payload with process `check`.
3. Includes session start time, landing source, landing remarks, and tab id.
4. Persists pending state needed for the response.
5. Posts to the link-sharing API.
6. Sends response to `handleCheckResponse`.

Important payload values:

| Field | Purpose |
| --- | --- |
| `tbl: linksharing` | Selects backend table/process family |
| `process: check` | Validates whether access can be granted |
| `docid` | Document being opened |
| `session_id` | New landing/editor session id |
| `username` | User identity for multi/collab flows |
| `role` / `rolename` | Role identity and collator/co-role rules |
| `collaborative` | Enables collaborative access behavior |
| `remarks: landing-page` | Auditing/debugging source |
| `source: landing` | Source of access check |

React migration requirement:

- Preserve payload enrichment for role, role name, username, co-role prefix, and collaborative mode.
- Keep request result handling centralized.

## Check Response Outcomes

`handleCheckResponse(response, ctx)` currently treats responses as:

| Response | Meaning | Action |
| --- | --- | --- |
| `r == 1` | Access granted | Complete access grant |
| `r == 0` conflict-shaped | Access conflict or existing active session | Show/send access request flow |
| `r == 0` DB/error-shaped | Backend/request failure | Show try-again/error; do not grant |
| `r == 2` | Access denied | Show denied remarks |
| Empty/malformed | Request error | Stop |

React migration requirement:

- Never treat any DB or malformed `r == 0` response as a grant.
- Preserve separate UX for conflict, denied, and backend error.

## Single User Access

In a normal single-user document:

1. URL validity succeeds.
2. Required landing auth succeeds or is not required.
3. Link-session `check` returns `r == 1`.
4. Access grant persists session start state.
5. Landing commits editor session storage.
6. Server active-session confirmation runs.
7. Redirect to editor.

If another user/session already owns access:

1. `check` returns conflict-shaped `r == 0`.
2. Landing shows access request UI.
3. Request status is polled.
4. Accepted request completes grant.
5. Rejected/timeout/error shows try-again or denied state.

## Multi-User And Collaborative Access

Collaborative access changes session verification:

- Role name and username become part of the active-session identity.
- Co-role can prefix role name with `Co-`.
- Multiple active rows may be valid only when they represent distinct collaborative users.
- Duplicate or missing active rows for the same user are invalid.

React migration requirement:

- Preserve collaborative identity fields in both access check and confirmation.
- Test at least:
  - single active row for current user
  - multiple active rows for different users
  - duplicate active rows for same user
  - missing active row for current user

## Access Request Polling

When access cannot be granted immediately, `sendAccessRequest` and `pollRequestStatus` manage the request flow.

Rules to preserve:

- Pending request older than 30 minutes can be refreshed/reinserted.
- Rejected request older than 30 minutes can be sent again.
- Fresh pending or rejected requests do not silently retry as grants.
- Polling success still completes the grant through the same commit path.

## Session Confirmation Guard

Before redirect, `setItemsandReDirect` asks `confirmSessionOnServer` or equivalent service confirmation to verify the session row.

Confirmation checks:

- Expected `docId` exists.
- Expected `sessionId` exists.
- Active row has `docstatus == 1`.
- Active row has `session_end_time == 0`.
- Active row session id matches expected.
- Collaborative rows match username and role identity rules.

Failure reasons include:

- `missing_expected_fields`
- `getdocs_unavailable`
- `no_active_row`
- `multiple_active`
- `record_mismatch`
- `request_error`

React migration requirement:

- Keep confirmation as a redirect guard.
- Show try-again on unrecoverable confirmation failure.
- Do not navigate to editor when confirmation fails.

## Landing Retry

If confirmation fails with `no_active_row` or `record_mismatch`, landing retries access using `retryLandingSessionCheck`.

Current behavior:

- Up to 3 attempts.
- Uses remarks `landing_retry`.
- Rejects DB/error-shaped responses.
- Updates stored session id only when retry response gives a valid session.
- Re-runs server confirmation after each retry.

React migration requirement:

- Preserve retry only for the existing recoverable reasons.
- Do not retry indefinitely.
- Log the final failure reason for QA.

