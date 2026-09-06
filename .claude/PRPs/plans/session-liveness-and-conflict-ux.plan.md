# Plan: Session Liveness, Conflict UX & Audit Trail (additive to existing session flow)

## Summary
The repo already has a working, legacy-compatible session/lock system (`src/services/session/sessionGateway.js` poll flow + `src/services/session/tabPresence.js` duplicate-tab guard). Instead of building the full "Session Registry + Socket Communication" plan's DB registry and duplicate-tab guard from scratch (both largely redundant with what exists), this plan adds the four pieces that are genuinely missing: automatic session release on crash/close (heartbeat liveness), a holder-side accept/reject UI, an optional real-time push notification layer on top of the existing poll flow, and wiring the already-built `DocumentHistory.jsx` view to real session data instead of its current mock data.

## User Story
As an editor user with a document open, I want my session to be released automatically if my tab crashes or closes without clicking "Logout", so that a colleague isn't blocked by a session that will never expire on its own.

As a document holder, I want to see who is requesting access and accept or reject with a reason, instead of the request being resolved silently server-side.

## Problem → Solution
**Current**: `useEditorLogout.js` is the *only* path that calls `closeSessionFromEditor` — a crashed/killed tab leaves the session "active" until an unknown server-side timeout. The requester-side wait/poll UI exists (`showSessionWaiting` + `pollAndResolve`), but there is no UI for the person currently holding the document — accept/reject happens entirely outside the client.
**Desired**: The editor sends a heartbeat while open and the last one triggers an explicit close; the current holder gets an in-editor prompt to accept/reject an incoming request with a remark; requesters get near-instant notice instead of a single 45s poll; `DocumentHistory.jsx` shows real `session_events`-equivalent data instead of `mockHistoryData`.

## Metadata
- **Complexity**: Large (4 sub-phases, ~14 files, new hook + component + optional socket module)
- **Source PRD**: N/A (no PRD was finalized — prior `/ecc:plan-prd` framing questions were not answered; this plan proceeds on the grounded "current flow vs plan" comparison from this session)
- **PRD Phase**: N/A
- **Estimated Files**: 13–15 (see Files to Change)

---

## UX Design

### Before
```
┌──────────────────────────────────────────┐
│ Editor open, tab killed/crashed           │
│ → session stays "active" server-side      │
│ → next user blocked until unknown timeout │
│                                            │
│ Requester: sees a 45s countdown popup,    │
│ one poll, then a "try again?" prompt if   │
│ unresolved. No visibility into the holder.│
│                                            │
│ Holder: no UI at all — accept/reject      │
│ happens entirely server-side.             │
│                                            │
│ Admin: DocumentHistory.jsx shows          │
│ hardcoded mockHistoryData, not real       │
│ session open/close/reject events.         │
└──────────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────────┐
│ Editor sends a heartbeat every N seconds; │
│ missed heartbeats past a threshold auto-  │
│ close the session server-side. beforeun-  │
│ load also fires an explicit close.        │
│                                            │
│ Requester: still uses the existing wait   │
│ dialog, but a socket push can resolve it  │
│ immediately instead of waiting the full   │
│ poll timeout.                             │
│                                            │
│ Holder: sees a non-blocking toast/dialog  │
│ "X is requesting access" with Accept /    │
│ Reject (+ remark) and a visible timer.    │
│                                            │
│ Admin: DocumentHistory.jsx reads real     │
│ session open/close/reject rows for a doc. │
└──────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Tab crash/kill | Session stays active indefinitely (client-invisible timeout) | Session auto-closes within a few missed heartbeats | Phase 1 |
| Access request (holder side) | No UI — resolved server-side | Accept/Reject dialog with remark, mirrors landing's `sessionDialogs.js` style | Phase 2 |
| Access request (requester side) | Single 45s poll, then manual retry prompt | Same UI, but can resolve early via push notice | Phase 3 (optional/additive) |
| Admin history view | `mockHistoryData` array | Real per-doc session event rows | Phase 4 |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/services/session/sessionGateway.js` | 1–341 | Source of truth for the check/request/poll/grant/close state machine — every new piece must call into this, not replace it |
| P0 | `src/services/session/tabPresence.js` | 1–439 | Existing heartbeat + BroadcastChannel pattern to mirror for the new editor-side heartbeat (same TTL/interval idiom, different purpose) |
| P0 | `src/services/session/sessionConstants.js` | 1–75 | `SESSION_PROCESS`, `REQUEST_STATUS`, `TAB_PRESENCE` timing constants — new constants must live here, not be hardcoded |
| P1 | `src/features/editor/hooks/useEditorLogout.js` | 1–63 | Only existing close path — the new heartbeat/auto-close hook sits alongside this, does not replace it |
| P1 | `src/features/landing/sessionDialogs.js` | 1–110 | SweetAlert2 dialog pattern (`Swal.fire`, `showLandingMessage`) to mirror for the new holder-side accept/reject dialog |
| P1 | `src/services/session/sessionConfig.js` | 1–33 | `env()` helper pattern — new heartbeat interval/threshold configs must be added here, not read directly from `import.meta.env` |
| P1 | `src/services/session/sessionCheckClassify.js` | 1–53 | Response-shape classification pattern (`r==0` conflict vs error) — reference for any new response classification |
| P2 | `src/features/editor/history/DocumentHistory.jsx` | 1–60+ | Existing (mock-data) history view — Phase 4 wires this to real data instead of creating a new view |
| P2 | `tests/unit/session/sessionGateway.test.js` | 1–70 | Vitest pattern: `vi.mock('.../apiService.js', ...)`, `apiService.makeRequest.mockResolvedValueOnce(...)` |
| P2 | `tests/unit/session/tabPresence.test.js` | all | Test pattern for timer/heartbeat-based modules — mirror for the new heartbeat hook's tests |
| P2 | `src/services/api/apiService.js` | 1–60 | `API_ENDPOINTS` map and `_runtimeEnv` pattern — reuse `LINK_SHARE`/`GET_DOCS`, do not add new endpoints without checking here first |

## External Documentation
No external research needed for Phases 1, 2, 4 — established internal patterns only. Phase 3 (socket push) is additive and optional; if pursued, research the backend team's chosen socket library (none is installed in `package.json` today) before adding a dependency — this plan intentionally treats Phase 3 as a stretch phase, not a blocker for Phases 1/2/4.

---

## Patterns to Mirror

### HEARTBEAT_TIMER_PATTERN
```js
// SOURCE: src/services/session/tabPresence.js:163-173
function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(beat, TAB_PRESENCE.HEARTBEAT_MS);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}
```
Mirror this exact start/stop pair shape for the new editor-session heartbeat — module-level timer ref, idempotent stop.

### BEFOREUNLOAD/PAGEHIDE_CLEANUP_PATTERN
```js
// SOURCE: src/services/session/tabPresence.js:247-254
if (typeof window !== 'undefined' && !pageHideHandler) {
  pageHideHandler = () => {
    if (heldDocId) {
      releaseValidateTab({ docId: heldDocId });
    }
  };
  window.addEventListener('pagehide', pageHideHandler);
}
```
Note: `tabPresence.js` uses `pagehide`, not `beforeunload` — mirror `pagehide` for consistency (more reliable on mobile Safari/bfcache than `beforeunload`).

### GATEWAY_CALL_PATTERN
```js
// SOURCE: src/services/session/sessionGateway.js:319-340
export async function closeSessionFromEditor(ctx = {}) {
  if (!ctx.docId) {
    return { ok: false, message: 'Missing document id for logout.' };
  }
  try {
    const response = await postLinkShare(buildClosePayload(ctx), ctx);
    if (response?.r == 1) {
      return { ok: true, response };
    }
    return { ok: false, response, message: response?.remarks || 'Unable to close session.' };
  } catch (err) {
    return { ok: false, message: err?.message || 'Unable to close session.' };
  }
}
```
Every new gateway function returns `{ ok, ... }` or `{ ok: false, message }` — never throws to the caller. Mirror exactly for any new heartbeat/accept/reject gateway calls.

### CONFIG_ENV_PATTERN
```js
// SOURCE: src/services/session/sessionConfig.js:21-30
export const sessionConfig = {
  pollIntervalMs: toNumber(env('SESSION_POLL_INTERVAL_MS', 'VITE_SESSION_POLL_INTERVAL_MS', 1000), 1000),
  pollTimeoutMs: toNumber(env('SESSION_POLL_TIMEOUT_MS', 'VITE_SESSION_POLL_TIMEOUT_MS', 45000), 45000),
  ...
};
```
New config (heartbeat interval, missed-heartbeat threshold) goes here as `env('SESSION_HEARTBEAT_MS', 'VITE_SESSION_HEARTBEAT_MS', <default>)`.

### DIALOG_PATTERN
```js
// SOURCE: src/features/landing/sessionDialogs.js:19-22
export async function promptSendAccessRequest() {
  const result = await showLandingMessage(LandingMessageKey.SEND_REQUEST);
  return Boolean(result?.isConfirmed);
}
```
Holder-side accept/reject dialog should follow the same shape: a message-catalog key (not inline strings) + `Swal.fire`/`showEditorMessage`-equivalent + boolean/typed return. Check `src/features/editor/messages/editorMessages.js` (used by `useEditorLogout.js`) for the editor-side equivalent of `showLandingMessage` before inventing a new one.

### TEST_MOCK_PATTERN
```js
// SOURCE: tests/unit/session/sessionGateway.test.js:5-13
vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: { makeRequest: vi.fn() },
  API_ENDPOINTS: { LINK_SHARE: '/api/linksharing', GET_DOCS: '/api/getdocs' }
}));
```
Every new gateway/heartbeat test mocks `apiService.makeRequest` this way — never hits a real network call.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/services/session/sessionConstants.js` | UPDATE | Add `EDITOR_HEARTBEAT` timing block (interval, missed-threshold) and a `SESSION_PROCESS.HEARTBEAT` value if the backend supports one |
| `src/services/session/sessionConfig.js` | UPDATE | Add `editorHeartbeatMs` / `editorHeartbeatMissThreshold` config entries |
| `src/services/session/sessionGateway.js` | UPDATE | Add `sendEditorHeartbeat(ctx)` following `GATEWAY_CALL_PATTERN`; reuse `postLinkShare` |
| `src/features/editor/hooks/useEditorSessionHeartbeat.js` | CREATE | New hook: starts/stops heartbeat interval, calls `pagehide`-based auto-close, mirrors `tabPresence.js` timer pattern |
| `src/features/editor/pages/EditorPage.jsx` | UPDATE | Mount `useEditorSessionHeartbeat` alongside existing session bootstrap |
| `tests/unit/session/sessionGateway.test.js` | UPDATE | Add tests for `sendEditorHeartbeat` |
| `tests/unit/editor/useEditorSessionHeartbeat.test.js` | CREATE | New test file, mirrors `tabPresence.test.js` timer-fake pattern |
| `src/features/editor/messages/editorMessages.js` | UPDATE | Add message keys for the accept/reject dialog (request incoming, accepted, rejected) |
| `src/features/editor/components/SessionRequestDialog.jsx` | CREATE | Holder-side accept/reject UI with remark field and countdown, mirrors `sessionDialogs.js` |
| `src/features/editor/hooks/useEditorSession.js` | CREATE | Owns polling for incoming requests (or socket subscription in Phase 3) and surfaces them to `SessionRequestDialog` |
| `src/services/session/sessionGateway.js` | UPDATE | Add `respondToAccessRequest(ctx, decision, remark)` — reuse `buildUpdateReqStatusTimePayload`-style payload builder in `sessionPayloads.js` |
| `src/services/session/sessionPayloads.js` | UPDATE | Add payload builder for accept/reject-with-remark if the existing `buildUpdateReqStatusTimePayload` doesn't already cover it |
| `src/features/editor/history/DocumentHistory.jsx` | UPDATE | Replace `mockHistoryData` with a data-fetching hook against real session-event data; keep existing filter/pagination UI as-is |
| `src/features/editor/history/README.md` | UPDATE | Document the new data source per the folder's own `skills.md` convention (see `session/skills.md` for the pattern: "Update this README key-files list when adding important files") |

## NOT Building
- **A new `sessions`/`session_events` Postgres schema or REST/GraphQL registry** (original plan Phase 1) — `sessionGateway.js`'s `linksharing`/`getdocs` backend is the existing source of truth; a parallel registry is out of scope unless the backend team confirms the current datastore cannot express the atomic-uniqueness requirement.
- **A new duplicate-tab guard** (original plan Phase 3) — `tabPresence.js` already does this; do not reimplement `BroadcastChannel`/localStorage locking.
- **A mandatory socket dependency** — Phase 3 here is additive/optional; Phases 1, 2, and 4 must work correctly on the existing poll model alone.
- **Collaborative-mode / exclusive-mode branching logic changes** — `ctx.collaborative` and `sessionConfig.enableCollabBypass` already exist and are out of scope for this plan; not touching that logic.
- **Backend/server-side changes** — this plan is client-repo scoped; any heartbeat-processing or accept/reject-processing endpoint contract change must be coordinated with the backend team and is called out as a risk below, not designed here.

---

## Step-by-Step Tasks

### Phase 1 — Heartbeat liveness & auto-close

#### Task 1.1: Add heartbeat config and constants
- **ACTION**: Add `editorHeartbeatMs` and `editorHeartbeatMissThreshold` to `sessionConfig.js`; add a `SESSION_PROCESS.HEARTBEAT` (or reuse an existing process key if the backend has no heartbeat endpoint yet — flag this as a backend dependency, see Risks) to `sessionConstants.js`.
- **IMPLEMENT**: `editorHeartbeatMs: toNumber(env('SESSION_EDITOR_HEARTBEAT_MS', 'VITE_SESSION_EDITOR_HEARTBEAT_MS', 15000), 15000)`.
- **MIRROR**: `CONFIG_ENV_PATTERN` above.
- **IMPORTS**: none new.
- **GOTCHA**: confirm with backend whether a heartbeat process value already exists in `linksharing` before inventing one — if not, this task blocks on a backend contract addition (see Risks).
- **VALIDATE**: `npm run test:unit -- sessionConfig` (or wherever config is covered) shows the new keys resolve to defaults when no env var is set.

#### Task 1.2: Add `sendEditorHeartbeat` gateway function
- **ACTION**: Add `sendEditorHeartbeat(ctx)` to `sessionGateway.js`.
- **IMPLEMENT**: POST via `postLinkShare` with the new heartbeat process value; return `{ ok, response }` / `{ ok: false, message }`.
- **MIRROR**: `GATEWAY_CALL_PATTERN` above (`closeSessionFromEditor`).
- **IMPORTS**: none new — reuse existing `postLinkShare`, `sessionConstants`.
- **GOTCHA**: do not throw — every other gateway function in this file returns a result object, never rejects to the caller.
- **VALIDATE**: unit test mocking `apiService.makeRequest` resolves `{ ok: true }` on `r==1`.

#### Task 1.3: Create `useEditorSessionHeartbeat` hook
- **ACTION**: New hook that starts a `setInterval` heartbeat on mount (only while the editor session is active), stops it on unmount, and calls `closeSessionFromEditor` on `pagehide` if no explicit logout already happened.
- **IMPLEMENT**: timer ref + start/stop pair; `pagehide` listener that fires `closeSessionFromEditor(ctx)` (fire-and-forget is acceptable here — the tab is closing).
- **MIRROR**: `HEARTBEAT_TIMER_PATTERN` and `BEFOREUNLOAD/PAGEHIDE_CLEANUP_PATTERN` above, both from `tabPresence.js`.
- **IMPORTS**: `sendEditorHeartbeat`, `closeSessionFromEditor` from `sessionGateway.js`; `getEditorSessionContextFromStorage` from `sessionStorage.js`.
- **GOTCHA**: `useEditorLogout.js` already calls `closeSessionFromEditor` on manual logout — guard against double-close (e.g. a ref flag set once close has been sent) so `pagehide` doesn't fire a redundant close after an intentional logout navigation.
- **VALIDATE**: unit test with fake timers (`vi.useFakeTimers()`) asserting the heartbeat fires every `editorHeartbeatMs` and stops on unmount; a `pagehide` dispatch triggers exactly one close call.

#### Task 1.4: Mount the hook in `EditorPage.jsx`
- **ACTION**: Call `useEditorSessionHeartbeat()` alongside the existing session bootstrap in `EditorPage.jsx`.
- **IMPLEMENT**: single hook call near other session-related hooks already mounted there.
- **MIRROR**: existing hook-mounting style in `EditorPage.jsx` (read the file's current hook list before inserting).
- **IMPORTS**: `useEditorSessionHeartbeat` from the new hook file.
- **GOTCHA**: must not start the heartbeat before the session is actually granted (i.e. after `commitSessionForEditor` has run) — starting it during the pre-grant landing flow would send heartbeats for a session that doesn't exist yet.
- **VALIDATE**: manual — open editor, confirm (via network tab or a temporary console log) a heartbeat request fires every `editorHeartbeatMs`; close the tab without logout, confirm a close request fires on `pagehide`.

---

### Phase 2 — Holder-side accept/reject UI

#### Task 2.1: Add message catalog keys
- **ACTION**: Add `REQUEST_INCOMING`, `REQUEST_ACCEPTED`, `REQUEST_REJECTED` (or equivalent) keys to `src/features/editor/messages/editorMessages.js`.
- **IMPLEMENT**: follow the existing `EditorMessageKey` enum + lookup pattern already used for `LOG_OUT_SHOW` / `ERROR_IMPACT` in that file.
- **MIRROR**: read `editorMessages.js` first — do not invent a parallel message system; `landingMessages.js`/`LandingMessageKey` is the equivalent pattern on the landing side.
- **IMPORTS**: none new.
- **GOTCHA**: keep remark-field copy generic — the plan's "remark" data comes from the requester, don't hardcode example text into the message catalog.
- **VALIDATE**: existing message-catalog unit tests (if any) still pass with the new keys added.

#### Task 2.2: Build `SessionRequestDialog.jsx`
- **ACTION**: New component rendering an accept/reject dialog with a remark textarea and a visible countdown (reuse the `showSessionWaiting` countdown-DOM-update technique).
- **IMPLEMENT**: `Swal.fire`-based (or the editor's `showEditorMessage` wrapper if it supports custom HTML/input — check before assuming) dialog with two actions; returns `{ decision: 'accept'|'reject', remark }`.
- **MIRROR**: `DIALOG_PATTERN` above; the `showSessionWaiting` countdown-update technique in `sessionDialogs.js:42-72` for the timer UI.
- **IMPORTS**: whichever Swal wrapper the editor context uses (check `useEditorLogout.js`'s `showEditorMessage` import path — do not import the landing-only `shared/plugins/sweetalert` directly if an editor-scoped wrapper exists).
- **GOTCHA**: the landing dialogs are documented as "outside editor ModuleContext" (`sessionDialogs.js:3`) — confirm whether the editor has a *different* Swal/message plumbing before reusing landing's directly; this is a real risk of a wrong import (see Risks).
- **VALIDATE**: Storybook/manual render (or a component test with `@testing-library/react` if the project has RTL — check `package.json`/existing editor component tests for the pattern) confirms Accept/Reject buttons and remark field render and return the right shape.

#### Task 2.3: Add `respondToAccessRequest` gateway function
- **ACTION**: Add a gateway function that posts the accept/reject decision + remark.
- **IMPLEMENT**: reuse `buildUpdateReqStatusTimePayload`'s shape in `sessionPayloads.js` as a base, adding a remark field if not already present — read `sessionPayloads.js` in full before assuming the field name (do not guess a payload key that doesn't match the legacy `linksharing` contract).
- **MIRROR**: `GATEWAY_CALL_PATTERN`.
- **IMPORTS**: `postLinkShare` (already in `sessionGateway.js`), new payload builder from `sessionPayloads.js`.
- **GOTCHA**: this is the task most likely to require a real backend field name — do not invent one; if the field is unknown, flag `TBD — needs backend contract confirmation` in code comments rather than guessing.
- **VALIDATE**: unit test mocking `apiService.makeRequest`, asserting the correct process value and remark field are sent.

#### Task 2.4: Wire `useEditorSession.js` to surface incoming requests
- **ACTION**: New hook polling (Phase 2 baseline) for a pending request against the current doc, and invoking `SessionRequestDialog` when one appears.
- **IMPLEMENT**: interval poll (reuse `sessionConfig.pollIntervalMs` semantics, or add a new `requestPollIntervalMs`) calling a "get pending request" gateway function — check whether `pollAccessRequest`/`GET_REQUESTSTATUS_PROCESS` (seen in `sessionConstants.js`) already covers this from the holder's side before adding a new endpoint call.
- **MIRROR**: the polling/interval shape in `useLandingSessionFlow.js`'s `waitTimerRef`/`countdownRef` pattern.
- **IMPORTS**: `respondToAccessRequest`, `SessionRequestDialog`.
- **GOTCHA**: this hook must not run for the requester's own tab — gate on `sessionCtx.role === 'holder'` or equivalent; verify the actual ctx shape before assuming a `role` field exists.
- **VALIDATE**: unit test with a mocked pending-request response asserts the dialog invocation is triggered exactly once per new request (not re-triggered on every poll tick while the same request is still pending).

---

### Phase 3 — Real-time push (additive, optional)

#### Task 3.1: Confirm backend socket support before starting
- **ACTION**: This phase is gated on a backend capability that does not exist in this repo today (no `socket.io-client`/`ws` dependency, no socket endpoint documented). Do not begin implementation until backend confirms a socket/WebSocket endpoint is available.
- **VALIDATE**: N/A — this is a go/no-go checkpoint, not a code task. If backend confirms support, treat Phase 3 as its own follow-up plan (`/ecc:prp-plan` again, scoped narrowly to the socket client) rather than expanding this one.

---

### Phase 4 — Wire `DocumentHistory.jsx` to real data

#### Task 4.1: Replace `mockHistoryData` with a real data hook
- **ACTION**: Add a `useSessionHistory(docId)` hook (or equivalent) that fetches real session open/close/request/reject events, replacing the top-of-file `mockHistoryData` array in `DocumentHistory.jsx`.
- **IMPLEMENT**: call whichever backend query already returns session history — `pollAccessRequest`/`GET_REQUESTSTATUS_PROCESS` or `GET_DOCS` may already expose partial history; if no endpoint returns full history today, flag `TBD — needs backend endpoint for session_events-equivalent history` rather than fabricating one.
- **MIRROR**: existing `useMemo`-based filter/pagination logic in `DocumentHistory.jsx:34-54` — keep the UI and filtering behavior identical, only change the data source.
- **IMPORTS**: new hook file under `src/features/editor/history/` (or `src/services/session/` if the query belongs there per `session/skills.md`'s ownership rule).
- **GOTCHA**: `DocumentHistory.jsx` today has zero backend calls (`useState`/`useMemo` only) — this is the first time this component makes a network request; add loading/error states consistent with how other dashboard grids in the codebase handle it (check `AgGridWrapper.jsx` usage elsewhere for the convention before inventing one).
- **VALIDATE**: manual — load the history view for a doc with known session activity, confirm rows match actual open/close/request events instead of `HIST-1000..1049` mock rows.

#### Task 4.2: Update `history/README.md`
- **ACTION**: Document the new real data source per the folder-README convention seen in `session/README.md`/`session/skills.md`.
- **VALIDATE**: README accurately lists the new hook/service file.

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `sendEditorHeartbeat` sends correct payload | valid ctx | `{ ok: true }` on `r==1` | — |
| `sendEditorHeartbeat` handles error | `apiService.makeRequest` rejects | `{ ok: false, message }`, no throw | Yes |
| `useEditorSessionHeartbeat` fires on interval | fake timers, `editorHeartbeatMs=15000` | heartbeat call count increments every tick | — |
| `useEditorSessionHeartbeat` stops on unmount | unmount hook | no further heartbeat calls after unmount | Yes |
| `pagehide` triggers exactly one close | dispatch `pagehide` event | `closeSessionFromEditor` called once | Yes — double-close guard |
| `respondToAccessRequest` accept | ctx + `{decision:'accept'}` | correct process/remark payload sent | — |
| `respondToAccessRequest` reject with remark | ctx + `{decision:'reject', remark}` | remark field present in payload | Yes |
| `useEditorSession` dialog trigger | one pending request, then same request again on next poll | dialog invoked exactly once | Yes — no duplicate dialogs |
| `useSessionHistory` maps backend rows to view shape | mocked history rows | matches `DocumentHistory.jsx` expected row shape | — |

### Edge Cases Checklist
- [ ] Heartbeat sent while offline/network error — must not crash the editor, must retry on next interval
- [ ] `pagehide` firing after an already-completed manual logout (no double-close)
- [ ] Holder dialog appearing while holder is mid-save (should not block/interrupt an active save — verify against editor save lifecycle before finalizing UX)
- [ ] Reject remark empty string vs omitted — payload builder must handle both without sending `undefined`
- [ ] History view for a doc with zero session events (empty state, not a crash)
- [ ] Concurrent access: two requesters for the same doc within the same poll window

---

## Validation Commands

### Static Analysis
```bash
npm run lint
```
EXPECT: Zero lint errors (`--max-warnings 0` per `package.json`)

### Unit Tests
```bash
npm run test:unit -- session editor
```
EXPECT: All new and existing session/editor tests pass

### Full Test Suite
```bash
npm run test:unit
```
EXPECT: No regressions across the full suite

### Browser Validation
```bash
npm run dev
```
EXPECT: Editor session heartbeat visible in network tab at the configured interval; closing the tab without logout triggers a close call; holder-side dialog appears when a request comes in; `DocumentHistory.jsx` shows non-mock rows for a real doc.

### Manual Validation
- [ ] Open a doc, confirm heartbeat requests appear in DevTools Network at `editorHeartbeatMs` cadence
- [ ] Close the tab (not via Logout button) — confirm a close/release call fires via `pagehide`
- [ ] From a second browser, request access to the same doc — confirm the holder sees the accept/reject dialog with remark field
- [ ] Reject with a remark — confirm the requester's existing `showSessionDenied` dialog surfaces that remark
- [ ] Open `DocumentHistory.jsx` for a doc with known activity — confirm real rows, not `HIST-####` mock IDs

---

## Acceptance Criteria
- [ ] All Phase 1, 2, 4 tasks completed (Phase 3 is a go/no-go checkpoint only, pending backend confirmation)
- [ ] All validation commands pass
- [ ] Tests written and passing for every new gateway function and hook
- [ ] No type errors, no lint errors
- [ ] Matches UX design above (heartbeat auto-close, holder dialog, real history data)

## Completion Checklist
- [ ] Code follows discovered patterns (see Patterns to Mirror)
- [ ] Error handling matches `{ ok, message }` gateway convention — no new function throws to its caller
- [ ] Tests follow the `vi.mock('.../apiService.js', ...)` pattern
- [ ] No hardcoded remark/message strings — routed through the message catalog
- [ ] `session/README.md`, `session/skills.md`, and `history/README.md` updated per each folder's own convention
- [ ] No unnecessary scope additions — Phase 3 (sockets) and the original plan's DB-registry/duplicate-tab-guard phases explicitly excluded
- [ ] Self-contained — no questions needed during implementation, except the two explicitly flagged `TBD` items below

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Backend has no heartbeat-processing endpoint today | Medium | High — blocks Phase 1 entirely | Confirm with backend before Task 1.1; if absent, this becomes a backend-first dependency, not a client-only change |
| Backend accept/reject-with-remark payload shape unknown | Medium | Medium — Task 2.3 may need rework | Flagged as `TBD` in Task 2.3; confirm field name against actual `linksharing` contract before implementing |
| Editor Swal/message plumbing differs from landing's | Low–Medium | Low — wrong import, easy fix | Task 2.2 explicitly calls out checking `useEditorLogout.js`'s message import before reusing landing's `shared/plugins/sweetalert` |
| Holder dialog interrupts an in-progress save | Low | Medium — bad UX if timed wrong | Edge case flagged in Testing Strategy; verify against save lifecycle during Task 2.2/2.4 implementation |
| No backend endpoint for full session history today | Medium | Medium — Phase 4 may only get partial data | Flagged as `TBD` in Task 4.1; ship partial history (open/close only) if request/reject events aren't queryable yet, rather than blocking the whole phase |

## Notes
- This plan deliberately does **not** cover the original `SESSION_REGISTRY_IMPLEMENTATION_PLAN.md`'s Phase 1 (DB registry rewrite) or Phase 3 (duplicate-tab guard) — both are already substantially implemented (`sessionGateway.js`'s existing backend contract, `tabPresence.js`) and rebuilding them would be redundant, not "best approach with existing flow."
- Phase 3 (sockets) is kept as a separate, optional, backend-gated phase rather than folded into the critical path — Phases 1/2/4 deliver the actual reliability and UX gaps on the existing poll model alone.
- Two backend contract unknowns are explicitly flagged as `TBD` (heartbeat endpoint, accept/reject remark field, full history query) rather than guessed — per this plan's own anti-fluff rule, do not invent plausible-sounding backend fields during implementation.

---

## Next Steps
- Confirm the two `TBD` backend-contract items with the backend team before starting Task 1.1 and Task 2.3.
- Run `/prp-implement .claude/PRPs/plans/session-liveness-and-conflict-ux.plan.md` to execute Phases 1, 2, and 4.
- Revisit Phase 3 as its own plan once backend socket support is confirmed.
