# Plan: Phase 3 — Real-Time Session Push via SignalR on ImpactSupport.Api (.NET 10 + SQLite)

## Summary
Yes, .NET + SQLite is the right call — but as the *existing* `ImpactSupport.Api` project, not a new service, and via **SignalR** rather than a Node/socket.io layer. That API already models a near-identical problem (`SupportSession`/`SupportMessage`, active-status filtering, `DocumentId`/`ImpactSessionId`/`ClientName` fields matching this frontend's `clientConfig.js` exactly) and already whitelists `http://localhost:5173` — this frontend's Vite dev origin — in its CORS policy. This plan adds a new `Session` module to that same API (mirroring the `Support` module's structure) with a SignalR hub for push notifications, while flagging where SQLite's single-writer model is and isn't a good fit across the four use cases from the prior plan (heartbeat, accept/reject, push, audit trail).

## User Story
As a document holder, I want to be notified the instant someone requests access, instead of the requester waiting out a fixed poll timeout — so the request/accept/reject round-trip feels immediate rather than laggy.

## Problem → Solution
**Current**: `impact_react_vite`'s session flow is 100% poll-based against a legacy `linksharing`/`getdocs` backend (see `src/services/session/sessionGateway.js`) — no push channel exists anywhere in the stack. The prior plan's Phase 3 was left as a go/no-go checkpoint ("no socket dependency exists, confirm backend support before starting").
**Desired**: `ImpactSupport.Api` — a real, already-CORS-configured .NET 10 Web API with EF Core + SQLite already proven for session-shaped data — gains a `Session` module with a SignalR hub. The frontend adds `@microsoft/signalr` and subscribes for `sessionRequestIncoming` / `sessionRequestResolved` events, using them to shortcut the existing poll wait instead of replacing it.

## Metadata
- **Complexity**: Large (cross-repo: new .NET module + frontend socket client; 9 files across two repositories)
- **Source PRD**: N/A
- **PRD Phase**: Phase 3 of `.claude/PRPs/plans/session-liveness-and-conflict-ux.plan.md` (previously a go/no-go checkpoint, now unblocked)
- **Estimated Files**: 9 (6 in `ImpactSupport.Api`, 3 in `impact_react_vite`)

---

## UX Design
Internal/transport-layer change — no new user-facing UI. It shortcuts the wait in the existing `showSessionWaiting` dialog (`src/features/landing/sessionDialogs.js`) and the holder-side dialog planned in Phase 2; neither dialog's appearance changes, only how quickly they resolve.

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Requester wait dialog | Resolves only after `pollTimeoutMs` (45s) or a full poll cycle | Can resolve immediately on a `sessionRequestResolved` push, poll remains as fallback | Additive — poll path is untouched |
| Holder-side request notice (Phase 2) | Polls for a pending request | Notified immediately via `sessionRequestIncoming` push | Poll remains as fallback if the socket is down |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `ImpactSupport.Api\Support\Controllers\SupportController.cs` | 1–233 | Direct structural template — transactional create-or-continue-session logic, active-status filtering, ID-generation helpers to mirror exactly for the new `Session` module |
| P0 | `ImpactSupport.Api\Support\Data\SupportSession.cs` / `SupportMessage.cs` | all | Entity shape to mirror for `Session`/`SessionEvent` entities |
| P0 | `ImpactSupport.Api\Support\Data\SupportDbContext.cs` | 1–93 (SupportSession/SupportMessage sections) | `OnModelCreating` index/constraint pattern (`HasIndex(...).IsUnique()`, composite index on `{UserId, DocumentId, UserRole, Status}`) — mirror for `Session` uniqueness |
| P0 | `ImpactSupport.Api\Program.cs` | 1–119 | DI registration, CORS policy (`ImpactUiCors`), `AddDbContext`/`MigrateAsync` startup pattern — the SignalR hub and `Session` DbContext wiring must slot in here the same way |
| P1 | `ImpactSupport.Api\appsettings.json` | 1–46 | `ConnectionStrings:SupportDb` pattern — new session store connection string (or reuse `SupportDb`, see Task 1.1) follows this shape |
| P1 | `ImpactSupport.Api\Properties\launchSettings.json` | all | Confirms current dev host is `http://localhost:5089` — the frontend's socket client config must point here in dev |
| P1 | `ImpactSupport.Api\ImpactSupport.Api.csproj` | all | Current package set (EF Core 10, Sqlite 10, no SignalR client packages needed server-side — SignalR ships in the ASP.NET Core shared framework, no extra NuGet package required for the server) |
| P1 | `src/services/session/sessionGateway.js` | 1–341 | The poll flow the push layer augments, not replaces — every socket event must resolve into a call to an *existing* function here (`pollAndResolve`, `continueBlockedSession`), never a parallel state machine |
| P1 | `src/services/session/sessionConfig.js` | 1–33 | `env()` pattern — new `sessionSocketUrl` config entry follows this exactly |
| P2 | `ImpactSupport.Api\Migrations\20260817041135_InitialSupportChatSqlite.cs` | 1–40+ | EF Core SQLite migration shape to mirror for the new `Session` migration |
| P2 | `package.json` (impact_react_vite) | 49–75 | Confirms no socket client dependency exists yet — `@microsoft/signalr` is a new dependency, check with the team before adding per this repo's own convention of checking `package.json` first |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| ASP.NET Core SignalR | learn.microsoft.com/aspnet/core/signalr | Ships in the shared framework for ASP.NET Core apps — `builder.Services.AddSignalR()` + `app.MapHub<T>("/path")`, no extra server NuGet package needed on net10.0 |
| SignalR + SQLite backplane | N/A — single-instance only | SignalR's default in-memory backplane only works for a **single server instance**. If `ImpactSupport.Api` is ever scaled to multiple instances, a backplane (Redis/SQL Server) is required — SQLite cannot serve as a SignalR backplane. Flagged as a risk below since this app's current deployment topology (single `localhost:5089` dev profile, file-based SQLite) suggests single-instance today, but this must be confirmed for production. |
| `@microsoft/signalr` npm client | npmjs.com/package/@microsoft/signalr | Official client, framework-agnostic (works with plain JS/React, no server-specific bundler config needed), supports automatic reconnect via `.withAutomaticReconnect()` |

`GOTCHA`: SignalR requires `AllowCredentials()` and an explicit origin list in CORS (no wildcard) when using WebSockets with credentials — `Program.cs`'s existing `ImpactUiCors` policy already does this correctly (`WithOrigins(...).AllowCredentials()`), so no CORS change is needed beyond adding the production frontend origin when it's known.

---

## Patterns to Mirror

### TRANSACTIONAL_CREATE_OR_CONTINUE_PATTERN
```csharp
// SOURCE: ImpactSupport.Api\Support\Controllers\SupportController.cs:43-81
await using var transaction = await _db.Database.BeginTransactionAsync();

var existingSession = await _db.SupportSessions
    .Where(x =>
        x.UserId == request.UserId &&
        x.DocumentId == request.DocumentId &&
        x.UserRole == request.UserRole &&
        ActiveStatuses.Contains(x.Status))
    .OrderByDescending(x => x.UpdatedAtUtc)
    .FirstOrDefaultAsync();

if (existingSession is not null) { /* continue existing */ }
else { /* create new */ }

await _db.SaveChangesAsync();
await transaction.CommitAsync();
```
Mirror this exactly for any new `Session`-module create/continue logic — same active-status-list + transaction shape.

### ENTITY_INDEX_PATTERN
```csharp
// SOURCE: ImpactSupport.Api\Support\Data\SupportDbContext.cs:61-74
entity.HasKey(x => x.Id);
entity.HasIndex(x => x.SupportSessionId).IsUnique();
entity.HasIndex(x => new { x.UserId, x.DocumentId, x.UserRole, x.Status });
```
The new `Session` entity's uniqueness constraint (one active session per `DocumentId` for exclusive mode) goes here as a composite unique index scoped to active statuses — note EF Core/SQLite does not support *filtered* unique indexes directly the way SQL Server does; a `HasIndex(...).IsUnique()` on `(DocumentId, Status)` is not equivalent to "unique only when Status='OPEN'" — see GOTCHA in Task 1.2.

### PROGRAM_CS_DI_PATTERN
```csharp
// SOURCE: ImpactSupport.Api\Program.cs:60-63
builder.Services.AddDbContext<SupportDbContext>(options =>
{
    options.UseSqlite(builder.Configuration.GetConnectionString("SupportDb"));
});
```
New DbContext (or reused `SupportDbContext` with new DbSets, see Task 1.1) registers the same way.

### CORS_PATTERN
```csharp
// SOURCE: ImpactSupport.Api\Program.cs:44-58
builder.Services.AddCors(options =>
{
    options.AddPolicy("ImpactUiCors", policy =>
    {
        policy
            .WithOrigins("http://localhost:8080", "https://localhost:8080", "http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});
```
Add the production `impact_react_vite` origin here once known — do not switch to `AllowAnyOrigin()`, which is incompatible with `AllowCredentials()` and would break existing CORS behavior for the TestCaseViewer UI that already depends on this policy.

### GATEWAY_CALL_PATTERN (frontend side)
```js
// SOURCE: src/services/session/sessionGateway.js:319-340 (closeSessionFromEditor)
export async function closeSessionFromEditor(ctx = {}) {
  if (!ctx.docId) { return { ok: false, message: 'Missing document id for logout.' }; }
  try { /* ... */ } catch (err) { return { ok: false, message: err?.message || '...' }; }
}
```
The new `sessionSocketClient.js` must return the same `{ ok, ... }` / `{ ok: false, message }` shape from its `connect()`/`emit()` wrappers — never let a socket error throw uncaught into a React component.

---

## Files to Change

| File | Repo | Action | Justification |
|---|---|---|---|
| `ImpactSupport.Api\Session\Data\SessionRecord.cs` | ImpactSupport.Api | CREATE | Entity mirroring `SupportSession.cs` shape, scoped to editor session/request state |
| `ImpactSupport.Api\Session\Data\SessionEvent.cs` | ImpactSupport.Api | CREATE | Entity mirroring `SupportMessage.cs` — one row per open/close/request/accept/reject, doubles as the Phase 4 audit-trail source |
| `ImpactSupport.Api\Support\Data\SupportDbContext.cs` | ImpactSupport.Api | UPDATE | Add `DbSet<SessionRecord>`, `DbSet<SessionEvent>` and their `OnModelCreating` index config, following `ENTITY_INDEX_PATTERN` |
| `ImpactSupport.Api\Session\Hubs\SessionHub.cs` | ImpactSupport.Api | CREATE | SignalR `Hub` with `JoinDocumentGroup(docId)` and server-invoked `SessionRequestIncoming`/`SessionRequestResolved` methods |
| `ImpactSupport.Api\Session\Controllers\SessionController.cs` | ImpactSupport.Api | CREATE | REST endpoints for request/accept/reject, mirroring `SupportController.cs`; on state change, calls `IHubContext<SessionHub>.Clients.Group(docId).SendAsync(...)` to push |
| `ImpactSupport.Api\Program.cs` | ImpactSupport.Api | UPDATE | Add `builder.Services.AddSignalR()`, `app.MapHub<SessionHub>("/hubs/session")`, register new DbSets' migration in the existing `MigrateAsync` startup block |
| `src/services/session/sessionSocketClient.js` | impact_react_vite | CREATE | Thin `@microsoft/signalr` wrapper: `connect(docId)`, `on(event, handler)`, `disconnect()` — mirrors `GATEWAY_CALL_PATTERN` return shape |
| `src/services/session/sessionConfig.js` | impact_react_vite | UPDATE | Add `sessionSocketUrl: env('SESSION_SOCKET_URL', 'VITE_SESSION_SOCKET_URL', 'http://localhost:5089/hubs/session')` |
| `package.json` | impact_react_vite | UPDATE | Add `@microsoft/signalr` dependency — confirm with the team first per this repo's own "check before adding" convention |

## NOT Building
- **A replacement for `sessionGateway.js`'s poll/grant/deny state machine** — the socket layer only shortcuts the wait; `pollAndResolve`/`continueBlockedSession` remain the source of truth and the fallback path if the socket is unavailable.
- **A SignalR backplane (Redis/SQL Server)** — out of scope unless/until `ImpactSupport.Api` is confirmed to run as more than one instance; single-instance in-memory SignalR is sufficient for the current deployment shape.
- **Migrating the legacy `linksharing` backend's data into `ImpactSupport.Api`** — the new `Session`/`SessionEvent` tables are additive, purely for the push-notification and (optionally, Phase 4) audit-trail concerns; the legacy backend remains authoritative for grant/deny.
- **A filtered/partial unique index enforcing "one active session per docid" at the SQLite level** — SQLite doesn't support this the way SQL Server does; enforcing single-active-session-per-doc stays application-level (inside the transaction, per `TRANSACTIONAL_CREATE_OR_CONTINUE_PATTERN`), same as `SupportController.cs` already does today.

---

## Step-by-Step Tasks

### Task 1.1: Decide DbContext ownership and confirm SQLite fit
- **ACTION**: Add `SessionRecord`/`SessionEvent` DbSets to the *existing* `SupportDbContext` (simplest — one migration pipeline, one connection string) rather than a new DbContext/database file, unless the team wants session data isolated from QA-tooling data for operational reasons.
- **IMPLEMENT**: extend `SupportDbContext.cs`'s DbSet list and `OnModelCreating`.
- **GOTCHA — the actual "can we use SQLite" answer**: yes for `SessionEvent` (audit trail, low write volume, append-only) and yes for request/accept/reject rows (bursty, low volume). Be more cautious for a **15-second heartbeat per open editor tab** (Phase 1 of the prior plan) — SQLite serializes writers, and at meaningful concurrent-editor scale this could contend. Mitigation if heartbeat volume becomes a concern: batch heartbeat writes (upsert `LastHeartbeatUtc` rather than inserting an event row per beat), or move only the heartbeat table to a real RDBMS later — this does not block Phase 3 (push), which is comparatively low-volume (only fires on request/accept/reject/join, not every 15s).
- **VALIDATE**: confirm with whoever owns `C:\data\ImpactSupport\` (the current SQLite file path in `appsettings.json`) that this path is on a volume with acceptable write latency and is backed up — it is not visibly under source control or a managed DB service today.

### Task 1.2: Add `SessionRecord` and `SessionEvent` entities + migration
- **ACTION**: Create the two entity classes and extend `SupportDbContext`.
- **IMPLEMENT**: `SessionRecord { Id, DocumentId, HolderUserId, Status, OpenedAtUtc, LastHeartbeatUtc, ClosedAtUtc, ClientName }`; `SessionEvent { Id, DocumentId, FromUserId, ToUserId, EventType, Remark, CreatedAtUtc }` — field names chosen to match the frontend's existing `ctx` shape (`docId`→`DocumentId`, etc.) from `sessionSource.js`; confirm exact field names there before finalizing.
- **MIRROR**: `ENTITY_INDEX_PATTERN`.
- **GOTCHA**: do not attempt a SQLite partial/filtered unique index for "one open `SessionRecord` per `DocumentId`" — enforce it in the controller transaction instead, exactly like `SupportController.CreateRequest` does for support sessions.
- **VALIDATE**: `dotnet ef migrations add AddSessionTables` produces a clean migration; `dotnet ef database update` (or the existing `MigrateAsync` startup path) applies without error against a fresh copy of the SQLite file.

### Task 1.3: Add `SessionHub`
- **ACTION**: Create a SignalR `Hub` subclass with a `JoinDocumentGroup(string docId)` client-invoked method (adds the caller's connection to a group named after `docId`) and two server-to-client events: `SessionRequestIncoming(payload)`, `SessionRequestResolved(payload)`.
- **IMPLEMENT**: standard ASP.NET Core `Hub` class; no custom auth beyond what the existing CORS/credentials setup provides (flag if the org requires connection-level auth — none exists in `Program.cs` today for any endpoint, so this matches current security posture, not a regression).
- **IMPORTS**: `Microsoft.AspNetCore.SignalR`.
- **GOTCHA**: group membership is per-connection and does not survive reconnects automatically — the frontend client must re-call `JoinDocumentGroup` after every reconnect (handle this in `sessionSocketClient.js`, not assume SignalR does it for you).
- **VALIDATE**: manual — two SignalR client connections joining the same `docId` group; a server-side `SendAsync` call to the group reaches both.

### Task 1.4: Add `SessionController` with push-on-write
- **ACTION**: New controller with `POST session/{docId}/request`, `POST session/{docId}/respond` endpoints, mirroring `SupportController`'s transactional create/continue shape; after each successful write, inject `IHubContext<SessionHub>` and call `Clients.Group(docId).SendAsync("SessionRequestIncoming"/"SessionRequestResolved", payload)`.
- **MIRROR**: `TRANSACTIONAL_CREATE_OR_CONTINUE_PATTERN`.
- **IMPORTS**: `Microsoft.AspNetCore.SignalR` (`IHubContext<SessionHub>`), the new `SessionRecord`/`SessionEvent` DbSets.
- **GOTCHA**: push the event *after* `transaction.CommitAsync()` succeeds, never before — a push notifying of a request that then fails to commit would desync the requester's UI from actual DB state.
- **VALIDATE**: unit/integration test (xUnit, if the project has a test project — none was found under `ImpactSupport.Api`; flag adding one as part of this task, mirroring ASP.NET Core's standard `WebApplicationFactory`-based integration test pattern since no existing C# test pattern exists in this codebase to mirror) asserting a `respond` call triggers exactly one hub broadcast.

### Task 1.5: Wire SignalR into `Program.cs`
- **ACTION**: Add `builder.Services.AddSignalR();` near the other `AddX` calls; add `app.MapHub<SessionHub>("/hubs/session");` near `app.MapControllers()`.
- **MIRROR**: existing `Program.cs` ordering (services before `Build()`, endpoint mapping after).
- **GOTCHA**: `app.UseCors("ImpactUiCors")` must run *before* `MapHub` (CORS middleware order matters for SignalR negotiate requests) — verify placement relative to the existing `app.UseCors(...)` call at line 108.
- **VALIDATE**: `dotnet run` starts without error; browser dev tools show a successful `/hubs/session/negotiate` request from a manual test page.

### Task 2.1: Add `sessionSocketClient.js`
- **ACTION**: New frontend module wrapping `@microsoft/signalr`'s `HubConnectionBuilder`.
- **IMPLEMENT**: `connect(docId)` builds a connection to `sessionConfig.sessionSocketUrl`, calls `.withAutomaticReconnect()`, invokes `JoinDocumentGroup(docId)` on connect and on every `onreconnected` event (per Task 1.3's GOTCHA); `on(event, handler)` wraps `connection.on`; `disconnect()` wraps `connection.stop()`.
- **MIRROR**: `GATEWAY_CALL_PATTERN` return shape — `connect()` resolves `{ ok: true }` or `{ ok: false, message }`, never throws to the caller.
- **IMPORTS**: `@microsoft/signalr`, `sessionConfig` from `./sessionConfig.js`.
- **GOTCHA**: this module must be safe to import even when the socket layer is unreachable (dev environments without `ImpactSupport.Api` running) — all connection failures degrade to "poll only," never block the existing `sessionGateway.js` flow.
- **VALIDATE**: unit test mocking `@microsoft/signalr`'s `HubConnectionBuilder` (check whether the project's existing Vitest mocking conventions, per `TEST_MOCK_PATTERN` in the prior plan, extend cleanly to a default-export class-based library — `@microsoft/signalr` exports a builder class, not a simple function, so the mock shape will differ from `apiService.makeRequest`'s `vi.fn()` pattern).

### Task 2.2: Add `sessionSocketUrl` config
- **ACTION**: Add the config entry to `sessionConfig.js`.
- **MIRROR**: `CONFIG_ENV_PATTERN` from the prior plan (`env()` helper).
- **VALIDATE**: resolves to `http://localhost:5089/hubs/session` by default in dev, matching `launchSettings.json`'s `applicationUrl`.

### Task 2.3: Wire the socket client into the existing wait/poll flow
- **ACTION**: In `useLandingSessionFlow.js`'s `confirmSendRequest` waiting branch, subscribe to `SessionRequestResolved` for the current `docId` alongside the existing `setTimeout(resolve, result.waitMs)`; whichever resolves first (socket event or timeout) proceeds to `pollAndResolve`.
- **IMPLEMENT**: `Promise.race([socketResolvedPromise, timeoutPromise])`.
- **MIRROR**: the existing `waitTimerRef`/`countdownRef` cleanup discipline in `useLandingSessionFlow.js:44-54` — the socket subscription must be torn down in the same `useEffect` cleanup, not left dangling.
- **IMPORTS**: `sessionSocketClient` from the new file.
- **GOTCHA**: do not remove the existing poll/timeout path — this is a race, not a replacement; if `ImpactSupport.Api` or the socket is unreachable, the existing 45s-poll UX must be unchanged.
- **VALIDATE**: manual — with `ImpactSupport.Api` running, a second browser accepting a request resolves the first browser's wait dialog in well under 45s; with the socket server stopped, the wait dialog still resolves via the existing poll path at the same cadence as before this change.

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `SessionController.Request` creates row + pushes | valid request | 1 `SessionRecord`/`SessionEvent` row, 1 hub broadcast | — |
| `SessionController.Respond` push order | accept/reject | push fires only after `CommitAsync` succeeds | Yes — commit-then-push ordering |
| `sessionSocketClient.connect` failure | unreachable hub URL | `{ ok: false, message }`, no throw | Yes |
| `useLandingSessionFlow` race | socket resolves before timeout | proceeds immediately, timeout cleared | — |
| `useLandingSessionFlow` fallback | socket never resolves | falls back to existing poll behavior unchanged | Yes — regression guard |

### Edge Cases Checklist
- [ ] `ImpactSupport.Api` unreachable at connect time — frontend must not error, must silently fall back to poll-only
- [ ] SignalR reconnect after a network blip — must re-join the `docId` group (Task 1.3 GOTCHA)
- [ ] Two requesters racing for the same doc — both must get correct, distinct push outcomes, not a shared broadcast collision
- [ ] `ImpactSupport.Api` restarts mid-session — SQLite-backed `SessionRecord`s must not be lost (confirm the SQLite file path in `appsettings.json` is not on ephemeral storage)

---

## Validation Commands

### Static Analysis
```bash
dotnet build ImpactSupport.Api.csproj
```
EXPECT: Zero build errors/warnings

```bash
npm run lint
```
EXPECT: Zero lint errors in the frontend repo

### Unit Tests
```bash
dotnet test
```
EXPECT: New `SessionController`/`SessionHub` tests pass (note: no existing test project was found under `ImpactSupport.Api` — creating one is part of Task 1.4)

```bash
npm run test:unit -- session
```
EXPECT: New `sessionSocketClient`/`useLandingSessionFlow` tests pass

### Database Validation
```bash
dotnet ef database update --project ImpactSupport.Api.csproj
```
EXPECT: `SessionRecord`/`SessionEvent` tables created in the SQLite file with no errors

### Browser Validation
```bash
dotnet run --project ImpactSupport.Api.csproj
npm run dev
```
EXPECT: Two browser sessions against the same doc — an accept/reject on one resolves the other's wait dialog near-instantly instead of after the full poll timeout.

### Manual Validation
- [ ] `/hubs/session/negotiate` succeeds from the Vite dev origin (confirms CORS + SignalR wiring)
- [ ] Stopping `ImpactSupport.Api` mid-session does not break the existing poll-based flow
- [ ] Two tabs racing a request each resolve correctly, no cross-talk

---

## Acceptance Criteria
- [ ] All Task 1.x (.NET) and Task 2.x (frontend) tasks completed
- [ ] All validation commands pass
- [ ] Push layer is provably additive — poll fallback verified working with the socket server stopped
- [ ] No SQLite filtered-unique-index attempted (documented as NOT Building)
- [ ] No type/lint errors in either repo

## Completion Checklist
- [ ] `.NET` code follows `SupportController`'s existing transactional pattern exactly
- [ ] Frontend code follows `sessionGateway.js`'s `{ ok, message }` never-throw convention
- [ ] CORS policy updated (not replaced) to add any new production origin
- [ ] `ImpactSupport.Api`'s current single-instance/in-memory SignalR limitation documented for whoever owns its deployment
- [ ] Self-contained — the one open question (exact `ctx` field names for `SessionRecord`, see Task 1.2) is explicitly flagged rather than guessed

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `ImpactSupport.Api` is currently a dev/QA-tooling box (`localhost:5089`, local SQLite file path `C:\data\ImpactSupport\`), not confirmed as production-deployed or reachable from the production `impact_react_vite` domain | Medium–High | High — Phase 3 cannot ship to production until this is confirmed | Confirm deployment/hosting plan with whoever owns this API before starting Task 1.5; this plan's scope assumes dev-parity today |
| SignalR's default backplane is single-instance only | Low today, High if this API scales out | Medium | Documented in External Documentation; add a Redis/SQL backplane only if/when multi-instance deployment happens |
| SQLite write contention if `SessionRecord` heartbeat writes (Phase 1 of the prior plan) are added to the same DB later | Medium | Medium | Mitigation already noted in Task 1.1 — batch/upsert heartbeat writes rather than one row per beat; keep heartbeat and push concerns in separate tables if volume becomes a real problem |
| Exact field names for `SessionRecord`/`SessionEvent` vs. the frontend's `ctx` shape (`sessionSource.js`) are assumed, not confirmed | Medium | Low–Medium — a rename pass, not a redesign | Flagged explicitly in Task 1.2; confirm against `sessionSource.js`'s actual `toSessionContext` output before finalizing entity fields |
| `@microsoft/signalr` is a new frontend dependency | Low | Low | Repo convention already requires checking before adding a new dependency (see Mandatory Reading, `package.json`) — flagged in Files to Change |

## Notes
- This resolves two of the three `TBD` backend-contract risks flagged in the prior plan (`session-liveness-and-conflict-ux.plan.md`): a concrete backend now exists that could plausibly also host the heartbeat-processing and accept/reject-with-remark endpoints from Phases 1/2 of that plan, not just the Phase 3 push layer. That's a bigger decision (moving session backend logic off the legacy `linksharing` system onto `ImpactSupport.Api`) than this plan's scope — flagged here for the team to weigh, not decided unilaterally.
- `ImpactSupport.Api`'s `SupportDbContext` already carries a `Clients` table (`PLOS`, `OUP`, `LWW`, ... ) matching `impact_react_vite`'s `clientConfig.js` `CLIENTS` map exactly — this is corroborating evidence the two systems are meant to be siblings, not coincidentally similar.
- Cross-repo plan: `ImpactSupport.Api` and `impact_react_vite` appear to be separate repositories/working trees. Treat Task 1.x and Task 2.x as two coordinated PRs, not one — do not attempt a single commit spanning both trees.

---

## Next Steps
- Confirm `ImpactSupport.Api`'s production deployment status before starting Task 1.5 (the single highest-impact open risk).
- Confirm `SessionRecord`/`SessionEvent` field names against `sessionSource.js`'s `toSessionContext` output (Task 1.2).
- Run `/prp-implement .claude/PRPs/plans/session-realtime-push-signalr-dotnet.plan.md` once both are confirmed.
