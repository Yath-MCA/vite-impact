# IMPACT Session Service — Phase-Wise Plan

Mirrors the locked `IMPACT_Support_Service_Phase_Wise_Plan` stack and phase shape,
scoped to the Session/Collaboration feature this conversation has been building
toward (see `.claude/PRPs/plans/session-liveness-and-conflict-ux.plan.md` and
`.claude/PRPs/plans/session-realtime-push-signalr-dotnet.plan.md` for the prior,
now-superseded backend explorations).

## Locked Stack

> **2026-08-26 revision**: Database changed from SQL Server Express to **MySQL Community
> Edition**. Rationale: the target Windows Server is already under memory/disk pressure
> from MongoDB and WebSpellCheck; MySQL Community Edition has a materially smaller
> resource footprint (RAM and disk) than SQL Server Express, reducing the risk of the
> server locking up under load. This is a database-layer change only — Spring Boot,
> Spring JDBC (no JPA), the REST/WebSocket API shape, and the Windows Service/IIS
> deployment story are unaffected. See Phase 02/03/16 below for the concrete diffs.
> Note: the `impact-session-service` scaffold from the prior implementation pass was
> moved and picked up by the backend team — it now lives at
> `C:\_IMPACT\spring-boot-impact-session-service` (imported into Eclipse; `target/classes/`
> already contains a successful `mvn compile` output against the original SQL Server
> Express config). The MySQL changes below apply as **edits to that existing project**,
> not a from-scratch rebuild.

- Existing IMPACT: Java + Maven + WAR + Tomcat + MongoDB — **no change**
- New service: Java 17+ + Spring Boot + Maven + executable JAR
- REST: Spring Web
- Realtime: Spring WebSocket
- Database: **MySQL Community Edition** (InnoDB)
- Database access: Spring JDBC (no JPA / no Hibernate)
- Deployment: Windows Service
- Internal port: **8092** (Support Service already owns 8091)
- External access: IIS reverse proxy under `/session-api/`
- Backups: Windows Task Scheduler + PowerShell (`mysqldump`)
- Concurrency: MySQL has no filtered/partial unique index — enforced instead via a
  **generated column + plain unique index** (Phase 03) that reproduces the same
  one-active-session-per-document (exclusive) / per-document+user (collaborative)
  guarantee — no attachments/RAG concerns, replaced by phases specific to this feature
  (see Phase Order)

## Architecture

```text
Oracle Windows Server
│
├── Existing IMPACT
│   ├── Tomcat :8080
│   ├── WAR
│   └── MongoDB
│
├── Support Service (existing/locked)
│   └── Spring Boot :8091 → /support-api/
│
├── New Session Service
│   ├── Spring Boot :8092
│   ├── REST
│   ├── WebSocket
│   └── Spring JDBC
│
├── SQL Server Express
│   └── IMPACT_SUPPORT
│
└── MySQL Community Edition
    └── impact_session
```

## Phase Order

1. Project Bootstrap
2. MySQL Community Edition
3. Database Schema
4. Spring JDBC Foundation
5. Application Configuration
6. REST Endpoints
7. IMPACT UI Integration
8. IMPACT Context
9. Session History Dashboard (replaces Support's "Support Dashboard")
10. WebSocket
11. WebSocket Routing
12. Authentication
13. Build & Deployment
14. Windows Service
15. IIS Reverse Proxy
16. SQL Backup
17. Concurrency & Heartbeat Rules (replaces Support's "Attachments" — this feature's core, not that one's)
18. Health Monitoring
19. Logging
20. Migration & Cutover Strategy (replaces Support's "RAG Preparation")

---

## Phase 01 — Project Bootstrap

### Goal
Standalone Spring Boot Maven service, no changes to the existing IMPACT WAR/Tomcat project or to `impact-support-service` (separate JAR, separate process).

### Stack
- Java 17+, Maven, Spring Boot, executable JAR

### Dependencies
- spring-boot-starter-web
- spring-boot-starter-websocket
- spring-boot-starter-jdbc
- mysql-connector-j (replaces mssql-jdbc per the 2026-08-26 MySQL revision)
- spring-boot-starter-validation
- spring-boot-starter-actuator

### Build / Run
```bash
mvn clean package
java -jar target/impact-session-service.jar
```

### Acceptance
- Application starts
- No dependency on the old WAR or on the Support Service
- No Mongo dependency

---

## Phase 02 — MySQL Community Edition

### Goal
Install/prepare MySQL Community Edition for the session service. **Not shared with
Support Service** — Support Service stays on its own SQL Server Express instance;
this is a separate MySQL install, chosen specifically for its lower resource
footprint given the server's existing MongoDB + WebSpellCheck memory pressure.

### Database
`impact_session` (MySQL identifiers are lowercase-by-convention; case-sensitivity of
table names depends on the server's `lower_case_table_names` setting — confirm and
keep all DDL consistently lowercase to avoid cross-platform surprises).

### Storage
```text
C:\IMPACT_DATA\Session\
├── mysql-data\   -- MySQL's own datadir, sized far smaller than an equivalent SQL Server Express instance
├── logs\
└── backup\
```
No `attachments\` folder — sessions carry no binary payloads.

Create a dedicated DB user for the service (`impact_session_user`), scoped to only
the `impact_session` database — do not reuse `impact_support_user` or grant broader
privileges than needed (`GRANT ALL ON impact_session.* TO 'impact_session_user'@'localhost'`).

### Resource footprint (why MySQL over SQL Server Express here)
SQL Server Express carries meaningfully higher baseline RAM/service overhead than
MySQL Community Edition for a workload this size (a handful of tables, modest write
volume from 15s heartbeats). On a server already under memory pressure from MongoDB
and WebSpellCheck, that difference is the deciding factor — not a performance need
this service actually has at its expected scale.

### Acceptance
- MySQL Community Edition installed, service running
- `impact_session` database created
- JDBC connection verified (`mysql-connector-j`, see Phase 01 dependency change below)

---

## Phase 03 — Database Schema

### Tables
- `session`
- `session_event`

### `session`
```sql
CREATE TABLE session (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    document_id       VARCHAR(100) NOT NULL,
    mode              VARCHAR(20)  NOT NULL,   -- EXCLUSIVE | COLLABORATIVE
    holder_user_id    VARCHAR(100) NOT NULL,
    status            VARCHAR(20)  NOT NULL,   -- ACTIVE | CLOSED | EXPIRED
    opened_at         DATETIME(6)  NOT NULL,
    last_heartbeat_at DATETIME(6)  NOT NULL,
    closed_at         DATETIME(6)  NULL,
    close_reason      VARCHAR(50)  NULL,

    -- MySQL has no filtered/partial unique index (unlike SQL Server's
    -- `CREATE UNIQUE INDEX ... WHERE`). These generated columns are the standard
    -- MySQL workaround: NULL when the row isn't in the state being constrained,
    -- and InnoDB unique indexes allow unlimited NULLs without conflict — so only
    -- rows that ARE active+matching-mode collide, reproducing the same guarantee.
    exclusive_active_key    VARCHAR(100) GENERATED ALWAYS AS (
        CASE WHEN status = 'ACTIVE' AND mode = 'EXCLUSIVE' THEN document_id ELSE NULL END
    ) STORED,
    collaborative_active_key VARCHAR(201) GENERATED ALWAYS AS (
        CASE WHEN status = 'ACTIVE' AND mode = 'COLLABORATIVE' THEN CONCAT(document_id, ':', holder_user_id) ELSE NULL END
    ) STORED,

    UNIQUE KEY ux_session_exclusive_active (exclusive_active_key),
    UNIQUE KEY ux_session_collab_active (collaborative_active_key)
) ENGINE=InnoDB;
```
`exclusive_active_key`/`collaborative_active_key` are the MySQL equivalent of the two
filtered unique indexes from the original SQL Server design — same enforcement,
different mechanism. A second `ACTIVE`+`EXCLUSIVE` insert for the same `document_id`
still fails at the DB level via `ux_session_exclusive_active`.

### `session_event`
```sql
CREATE TABLE session_event (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id   BIGINT       NOT NULL,
    document_id  VARCHAR(100) NOT NULL,
    from_user_id VARCHAR(100) NULL,
    to_user_id   VARCHAR(100) NULL,
    event_type   VARCHAR(30)  NOT NULL,  -- REQUESTED, ACCEPTED, REJECTED, HEARTBEAT_TIMEOUT, MANUAL_CLOSE, PRESENCE_JOIN, PRESENCE_LEAVE
    remark       VARCHAR(500) NULL,
    created_at   DATETIME(6)  NOT NULL,
    CONSTRAINT fk_session_event_session FOREIGN KEY (session_id) REFERENCES session(id),
    INDEX ix_session_event_document (document_id, created_at)
) ENGINE=InnoDB;
```
This table is the audit-trail source for Phase 09 and for the standing `DocumentHistory.jsx` wiring identified earlier in this conversation.

### Rule
The DB constraint is the enforcement mechanism, not application code — reject on conflict (MySQL raises a duplicate-key error, `java.sql.SQLIntegrityConstraintViolationException` / Spring's `DuplicateKeyException`, same exception type the service layer already catches), never check-then-insert (see Phase 17).

### Acceptance
- Schema creates successfully
- Both filtered unique indexes validated: a second `ACTIVE`+`EXCLUSIVE` insert for the same `document_id` fails at the DB level

---

## Phase 04 — Spring JDBC

### Goal
Explicit SQL via Spring JDBC — same rule as the Support Service.

### Use
`JdbcTemplate`, `NamedParameterJdbcTemplate`

### Do Not Use
JPA, Hibernate, EntityManager

### Repository Layer
```text
SessionRepository
SessionEventRepository
```

### Rule
`SessionRepository.openSession(...)` performs a plain `INSERT`; a unique-constraint violation from Phase 03's generated-column unique index is caught in the service layer (Spring translates MySQL's duplicate-key error to the same `DuplicateKeyException` it would for SQL Server) and translated to `409 Conflict` — this is the "reject on conflict, don't check-then-insert" rule that every session plan in this conversation has converged on.

### Acceptance
- Insert/read session works
- A conflicting exclusive-mode insert throws a catchable constraint-violation exception, not a silent failure
- No ORM dependencies

---

## Phase 05 — Application Configuration

### application.properties
```properties
server.port=8092

spring.datasource.url=jdbc:mysql://localhost:3306/impact_session?useSSL=false&serverTimezone=UTC
spring.datasource.username=impact_session_user
spring.datasource.password=${IMPACT_SESSION_DB_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2

session.heartbeat.interval-seconds=15
session.heartbeat.miss-threshold=3

management.endpoints.web.exposure.include=health,info
```
`interval-seconds × miss-threshold` = 45s expiry — deliberately matched to the existing `pollTimeoutMs` (45000ms) already used in `sessionConfig.js`, so the new liveness window feels consistent with the flow users already experience.

### Rule
Use environment variables for production secrets.

### Acceptance
- DB connection works
- Actuator health works

---

## Phase 06 — REST API

### Endpoints
```text
POST /api/session/{docId}/open        -- create or continue (exclusive or collaborative)
POST /api/session/{docId}/heartbeat
POST /api/session/{docId}/close
POST /api/session/{docId}/request     -- requester asks for access
POST /api/session/{docId}/respond     -- holder accepts/rejects, with remark
GET  /api/session/{docId}/history     -- session_event rows, for Phase 09
```

### Rule
Controllers validate/route only. Business logic (conflict handling, event logging, push triggering) stays in services.

### Acceptance
Open/heartbeat/close/request/respond/history all work over REST before WebSocket (Phase 10) is added.

---

## Phase 07 — Existing IMPACT UI Integration

### New Frontend Module (in `impact_react_vite`)
```text
src/services/session/
├── sessionServiceClient.js   -- REST calls to the new service
└── sessionSocketClient.js    -- WebSocket subscription (Phase 10/11)
```
This sits **alongside** the existing `sessionGateway.js` (legacy `linksharing` poll flow) — additive, not a replacement. See Phase 20 for the cutover question.

### Development
```javascript
const SESSION_API_BASE = "http://localhost:8092";
```

### Production
```javascript
const SESSION_API_BASE = "/session-api";
```
Added to `sessionConfig.js` following its existing `env()` pattern: `env('SESSION_SERVICE_API_BASE', 'VITE_SESSION_SERVICE_API_BASE', 'http://localhost:8092')`.

### Acceptance
- `impact_react_vite` can call the new service in dev and prod without a CORS error (IIS routing, Phase 15, removes the CORS question entirely in prod)

---

## Phase 08 — Automatic IMPACT Context

### Capture Automatically
`documentId`, `userId`, `userName`, `role`, `client`, `module` — all already available in the existing `ctx` shape built by `sessionSource.js`/`toSessionContext` (see `src/services/session/sessionStorage.js:193-196`).

### Rule
Do not ask the user for anything already available from the existing session context — reuse `buildSessionContextFromDocData`, don't rebuild it.

### Acceptance
Every `/open`, `/request`, `/respond` call carries full context with zero additional user input.

---

## Phase 09 — Session History Dashboard

### Goal
Wire the **already-existing** `src/features/editor/history/DocumentHistory.jsx` (currently rendering hardcoded `mockHistoryData`, confirmed in this conversation's earlier discovery) to `GET /api/session/{docId}/history` instead of building a new view — this is the same task as Task 4.1 in `session-liveness-and-conflict-ux.plan.md`, now with a concrete backend to call.

### Acceptance
`DocumentHistory.jsx` shows real open/close/request/accept/reject rows for a document, not `HIST-####` mock rows.

---

## Phase 10 — WebSocket

### Events
- `SESSION_REQUEST_INCOMING`
- `SESSION_REQUEST_RESOLVED` (accept/reject + remark)
- `PRESENCE_JOIN`
- `PRESENCE_LEAVE`
- `HEARTBEAT_TIMEOUT`

### Critical Flow
```text
Client action (request/respond/heartbeat)
→ Spring service
→ SQL INSERT/UPDATE
→ COMMIT
→ WebSocket publish
```
SQL Server remains the source of truth — push happens only after commit succeeds, never before (same rule the Support Service's own Phase 10 already encodes, and the same GOTCHA flagged in this conversation's earlier SignalR exploration).

### Acceptance
Realtime works without breaking the REST/history path.

---

## Phase 11 — WebSocket Routing

### Endpoint
`/ws/session`

### Channel
`session/{documentId}`

### Rules
- Isolate events by `documentId` — no cross-document leakage
- Validate authorization on subscribe (Phase 12)
- Reconnect/resubscribe safely — a dropped connection must re-join its `documentId` channel on reconnect, not silently stop receiving events (the same reconnect-must-rejoin gotcha flagged in the earlier SignalR plan — this is a universal WebSocket concern, not specific to any one library)

### Acceptance
No cross-document event leakage; reconnect recovers presence/push correctly.

---

## Phase 12 — Authentication

### Target Flow
```text
Existing IMPACT login
→ signed token
→ browser
→ Authorization: Bearer <token>
→ Spring Boot validation
```

### Rule
Do not trust `userId`/`role` supplied by JavaScript in production — this matters more for Session than it did for Support: an unvalidated client claim could let one user force-close or falsely "accept" another user's session.

### Acceptance
- Identity validated
- Session/document authorization enforced (a user cannot heartbeat, close, or respond to a session they don't hold/aren't authorized for)

---

## Phase 13 — Build and Deployment

### Existing
```text
Maven → impact.war → Tomcat
Maven → impact-support-service.jar → Windows Service → :8091
```

### New
```text
Maven → impact-session-service.jar → Windows Service → :8092
```

### Acceptance
New service deploys independently of Tomcat and of the Support Service.

---

## Phase 14 — Windows Service

### Suggested Folder
```text
C:\IMPACT\Services\Session\
├── impact-session-service.jar
├── config\
├── logs\
└── service\
```

### Configure
Automatic startup, restart on failure, dedicated service account if needed, environment variables, log capture — same checklist as the Support Service's Phase 14.

### Acceptance
Service survives reboot and restarts on failure.

---

## Phase 15 — IIS Reverse Proxy

### Target URL
`https://impact.company.com/session-api/`

### Routing (three services now)
```text
/impact/*       → Tomcat :8080
/support-api/*  → Spring Boot :8091
/session-api/*  → Spring Boot :8092
```

### Frontend
```javascript
const SESSION_API_BASE = "/session-api";
```

### Benefits
Same as Support Service: no CORS issue, one HTTPS domain, internal ports hidden, cleaner production config.

### Acceptance
REST and WebSocket upgrade (`/ws/session`) both work through IIS.

---

## Phase 16 — MySQL Backup

### Recommendation
Windows Task Scheduler + PowerShell calling `mysqldump` — not scheduled inside Spring Boot (same principle as Support Service's SQL Server backup, different tool for MySQL).

```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" `
  -u impact_session_user -p"$env:IMPACT_SESSION_DB_PASSWORD" `
  --single-transaction --routines --events `
  impact_session > "C:\IMPACT_BACKUP\Session\impact_session_$(Get-Date -Format yyyyMMdd_HHmmss).sql"
```
`--single-transaction` takes a consistent InnoDB snapshot without locking tables — the MySQL equivalent of SQL Server's `WITH CHECKSUM` backup consistency guarantee for this workload.

### Retention
Daily: 14 days. Weekly: optional 8 weeks — same policy as Support, different backup mechanism.

### Note specific to Session
`session` rows are disposable live-lock state (safe to prune once `CLOSED`/`EXPIRED` past a short window); `session_event` is the permanent audit trail and should **not** be pruned on the same schedule — treat it like Support's ticket history, not like session's live-state table. Flag this distinction explicitly to whoever owns the backup/retention job; Support Service had no equivalent split.

### Acceptance
- Scheduled backup works, cleanup works, restore test performed
- `session_event` retention is confirmed separate from `session` housekeeping

---

## Phase 17 — Concurrency & Heartbeat Rules

*(Replaces Support Service's "Attachments" phase — this is this feature's actual load-bearing phase, the reason the whole plan chain in this conversation exists.)*

### Rules
- **Exclusive mode**: one `ACTIVE` session per `document_id` — enforced by `ux_session_exclusive_active`'s generated-column unique index (Phase 03).
- **Collaborative mode**: one `ACTIVE` session per `(document_id, holder_user_id)` — enforced by `ux_session_collab_active`.
- **Reject on conflict, not check-then-insert**: a second exclusive-mode `/open` call for the same document fails at the DB constraint level; the service catches the constraint-violation exception and returns `409`, it does not pre-check with a `SELECT` first (a check-then-insert race is exactly the bug class a DB constraint exists to prevent).
- **Heartbeat**: client calls `/heartbeat` every `session.heartbeat.interval-seconds` (15s). A Spring `@Scheduled` sweep job runs periodically, marks any session `EXPIRED` whose `last_heartbeat_at` is older than `interval-seconds × miss-threshold` (45s default), and pushes `HEARTBEAT_TIMEOUT` to that document's WebSocket channel.

### Acceptance
- A second exclusive-mode open for the same `document_id` fails at the DB constraint level, not just in application code
- A killed client (heartbeat stops) is reclaimed within ~45s, not a fixed 30-minute timeout — this is the single highest-value gap identified across this entire conversation, and this phase is where it actually gets fixed

---

## Phase 18 — Health Monitoring

### Endpoint
`/actuator/health`

### Checks
Application, MySQL connectivity, disk space, WebSocket availability — same as Support, **plus**: heartbeat-sweep job liveness (last successful sweep timestamp). A stalled sweep job silently defeats Phase 17 entirely — Support Service had no equivalent background job, so this check has no analog there.

### Acceptance
Operational health, including the sweep job, can be checked without opening the UI.

---

## Phase 19 — Logging

### Log Folder
`C:\IMPACT\Services\Session\logs\`

### Log
Session opened/closed/expired, request/accept/reject (with remark), heartbeat-timeout expirations, WebSocket reconnects, database constraint-violation rejections (log at INFO — these are expected conflict outcomes, not errors; logging them as ERROR would cause alert fatigue), authentication failures.

### Never Log
Passwords, access tokens, private keys — and flag as a policy decision (not assumed) whether requester/holder **remarks** should be logged verbatim, since unlike Support's ticket messages (which exist specifically to be read/stored), a session-request remark may be more casual and the org may want a different retention stance.

### Acceptance
Logs rotate; failures — including expected conflict rejections vs. real errors — are distinguishable and diagnosable.

---

## Phase 20 — Migration & Cutover Strategy

*(Replaces Support Service's "RAG Preparation," which doesn't apply here.)*

### Recommendation
**Additive rollout, not a replacement.** This service initially owns only: heartbeat-based liveness, the holder-side accept/reject UI's backend, real-time push, and the audit-trail history — exactly the four gaps identified in this conversation's original "current flow vs plan" comparison. `sessionGateway.js`'s legacy `linksharing` poll flow **remains authoritative** for the actual grant/deny decision.

### Explicitly Out of Scope Here
Retiring `linksharing` and making this new service the sole source of truth for session grant/deny is a larger, separate decision requiring backend-team sign-off — not something this plan decides unilaterally. If that migration is ever pursued, it should be its own phase-wise plan, not an extension of this one.

### Acceptance
The new service can be deployed, and can fail, without breaking the existing poll-based grant/deny flow — verified by the same "stop the new service, confirm the old flow still works" test called out in the earlier `session-realtime-push-signalr-dotnet.plan.md`.

---

## Final Suggested Structure

```text
impact-session-service/
│
├── pom.xml
├── src/main/java/com/company/impact/session/
│   ├── ImpactSessionApplication.java
│   ├── config/
│   │   ├── CorsConfig.java
│   │   ├── DatabaseConfig.java
│   │   └── WebSocketConfig.java
│   ├── controller/
│   │   ├── HealthController.java
│   │   ├── SessionController.java
│   │   └── SessionHistoryController.java
│   ├── websocket/
│   │   ├── SessionWebSocketHandler.java
│   │   └── SessionWebSocketInterceptor.java
│   ├── service/
│   │   ├── SessionService.java
│   │   ├── SessionEventService.java
│   │   └── HeartbeatSweepService.java   -- @Scheduled sweep job (Phase 17)
│   ├── repository/
│   │   ├── SessionRepository.java
│   │   └── SessionEventRepository.java
│   ├── model/
│   ├── dto/
│   └── exception/
│       └── GlobalExceptionHandler.java  -- translates unique-constraint violations to 409
│
└── src/main/resources/
    ├── application.properties
    ├── application-dev.properties
    └── sql/
        ├── 001_schema.sql
        └── 002_indexes.sql
```

---

## Notes

- This plan supersedes the backend-technology exploration in `session-realtime-push-signalr-dotnet.plan.md` (.NET/SignalR) — that plan is kept for its research value (it correctly identified the commit-then-push ordering rule and the reconnect-must-rejoin rule, both of which carried over here) but should not be implemented; this Java/Spring Boot path is the one aligned with the org's already-locked Support Service precedent, the VP's stated reservations about MongoDB, and the backend owner's Java strength. The database within that stack was further revised from SQL Server Express to MySQL Community Edition on 2026-08-26 for server resource reasons (see the Locked Stack section above).
- Project location: `C:\_IMPACT\spring-boot-impact-session-service` (moved from the original scaffold path, imported into Eclipse by the backend team, already compiled once against the pre-MySQL config).
- The frontend-side gaps and tasks from `session-liveness-and-conflict-ux.plan.md` (Phases 1/2/4 of that plan: heartbeat hook, holder dialog, history wiring) remain valid — they now have a concrete backend (this service) to call instead of `TBD` backend contracts.
- Three services will exist side by side on the same Windows Server: Tomcat (:8080), Support Service (:8091), Session Service (:8092), each independently deployable and independently restartable.

## Next Steps
- Apply the MySQL edits (pom.xml dependency, application*.properties, 001_schema.sql, 002_indexes.sql) to the actual project at `C:\_IMPACT\spring-boot-impact-session-service` — already decided as a dedicated MySQL Community Edition instance, not shared with Support Service's SQL Server Express.
- Confirm the Phase 19 policy question on logging request/accept/reject remarks verbatim.
- Re-run `mvn compile` against the MySQL config once `mysql-connector-j` replaces `mssql-jdbc` in `pom.xml`, to confirm the project still builds clean.
