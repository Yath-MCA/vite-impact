# Localhost Session Bypass, ShareKey Gate & LinkShare Payload Context

**Date:** 2026-09-07  
**Status:** Draft for review  
**Repo:** `impact_react_vite`  
**Related legacy docs:**
- `impactweb/docs/linksharing-session/linksharing-frontend-backend-map.md`
- `impactweb/docs/linksharing-session/linksharing-landing-session.md`
**Related prior work:** Editor session bootstrap (`editorSessionBootstrap`, `SessionContext`, `recoverEditorSessionByDocId`)

## Problem

1. **Logging:** `GlobalBridge` and `SessionGuard` use raw `console.*` / `import.meta.env.DEV` instead of the existing local-only `devLog` helper, and stage validation is incomplete.
2. **Editor gate:** Session verify currently hard-blocks when the linkShare Mongo row is missing. On localhost we need a controlled **bypass** after validation fails, with clear console remarks — while still requiring shareKey details.
3. **Payloads:** React `buildCheckPayload` (and related builders) omit several legacy `ADD_DEFAULT_KEYS` fields (`roleid`, `identifier`, `dtd`, `projecttitle`, `vendor`, `shorttitle`, …). There is no shared base payload built from shareKey/`ctx`.

## Goals

- Resolve a canonical **session context** from `localStorage` key `xmleditor:shared:{docId}` first; if missing, load doc data via `API_GET_DOCS` and normalize into the same context.
- Build linkShare payloads with **Approach A**: common base from shareKey/`ctx`, then process-specific deltas.
- Validate at **every** GlobalBridge / SessionGuard stage; pass `ctx` into SessionGuard.
- On validation/verify failure: if `isLocalHost()` → **pass/bypass** with structured remarks logged via `devLog`; otherwise fail closed.
- Apply localhost bypass **everywhere session verify runs** (landing, editor bootstrap, save/session guards).
- Keep shareKey mandatory: no bypass and no editor open without usable shareKey/`ctx`.

## Non-Goals

- Restoring banned globals (`window.INIT_CONFIG`, etc.) into active React editor page flow.
- Changing Java/backend linkShare process semantics.
- Redesigning collab-specific collaborative payload paths beyond current enrich helpers.
- Shipping localhost bypass behavior to non-local environments.

## Decisions (approved)

| Topic | Decision |
|-------|----------|
| Soft-open without DB row | Localhost only |
| ShareKey storage | Existing key only: `xmleditor:shared:{docId}` |
| ShareKey fallback | `API_GET_DOCS` → normalize → persist when possible |
| Bypass scope | Everywhere session verify runs |
| Fail path | Always validate; on fail + localhost → bypass + remarks console |
| Payload architecture | Approach A — base from shareKey/`ctx` + process builders |

---

## Architecture

```text
docId
  → resolveShareKeyContext(docId)
       localStorage xmleditor:shared:{docId}
       else GET_DOCS → normalizeSessionSource → persist shared if possible
  → ctx (canonical)
  → buildBaseLinkSharePayload(ctx) + process builders
  → SessionGuard.checkStage(stage, ctx)
  → verify callers: fail? → isLocalHost()? bypass : block
  → GlobalBridge stages: devLog only + guard result
```

One shared **session context** feeds payloads, SessionGuard, GlobalBridge stage checks, and verify/bootstrap callers.

---

## Components

### 1. `resolveShareKeyContext(docId)`

New helper under `src/services/session/` (name may be `shareKeyContext.js` or similar).

**Behavior:**
1. If no `docId` → `{ ok: false, source: 'none', message: 'Missing document id.' }`
2. Read `localStorage.getItem('xmleditor:shared:' + docId)`
3. If valid JSON with matching `docid` → `{ ok: true, ctx, source: 'localStorage' }` where `ctx` comes from `normalizeSessionSource` / `toSessionContext` (or equivalent existing helpers)
4. Else call existing GET_DOCS recovery (`recoverEditorSessionByDocId`)
5. On recovery success → build `ctx`, persist via existing legacy localStorage commit helpers when data is sufficient → `{ ok: true, ctx, source: 'getdocs' }`
6. On total failure → `{ ok: false, source: 'none', message: '...' }`

**Hard rule:** Callers must not open editor / bypass verify without `ok: true` and a usable `ctx`.

### 2. Payload layer (Approach A)

Refactor `src/services/session/sessionPayloads.js`:

- `buildBaseLinkSharePayload(ctx)`  
  Always includes legacy ADD_DEFAULT_KEYS-aligned fields from shareKey/`ctx`:
  - `tbl: 'linksharing'`
  - `docid`, `client`, `username`, `role`, `rolename`, `roleid`
  - `identifier`, `dtd`, `linkinfo`, `type`, `projecttitle`, `vendor`, `shorttitle`
  - `collaborative` when present on ctx  
  Field sources follow `linksharing-landing-session.md` ADD_DEFAULT_KEYS table.

- Process builders start from base, then add only deltas:
  - `buildCheckPayload(ctx)` → `process`, `session_id`, `session_start_time`, `remarks` (+ optional `tabid`)
  - `buildUpdateReqStatusTimePayload(ctx)` → request fields
  - `buildStaleCleanupPayload(ctx)` → stale doc/request status
  - `buildPollPayload(ctx)` → poll fields
  - `buildClosePayload(ctx)` → close fields
  - `buildVerifyQuery(ctx)` → read-only getdocs shape (uses same `ctx`, not the write base blob)

Existing `enrichLinkSharePayload` in `sessionGateway.js` remains for transport-time username/role/collab fill; it must not fight or duplicate the base builder’s required fields.

### 3. `SessionGuard.checkStage(stage, ctx)`

Update `src/services/core/SessionGuard.js`.

**Stages:** `init`, `loading`, `editorInit` (retain `adminInit` if referenced).

**Inputs:** `stage`, `ctx` (required parameter; do not re-read ad-hoc keys inconsistently). Prefer `ctx` over raw storage; storage may be used only to rebuild `ctx` if caller omitted it via `resolveShareKeyContext`.

**Checks (every stage):**
- `docId` / `ctx.docId` present
- shareKey/`ctx` present and `docid` matches
- Optional stage-specific extras later without changing the result contract

**Result:**
```js
{ ok: boolean, bypassed: boolean, stage: string, remarks: string }
```

**Rules:**
- Validation fails + `isLocalHost()` → `{ ok: true, bypassed: true, remarks }` + `devLog.warn('[SessionGuard]', remarks)`
- Validation fails + not local → `{ ok: false, bypassed: false, remarks }` + `devLog.warn` (still local-only logger → silent in prod, which is desired)
- Validation passes → `{ ok: true, bypassed: false, remarks: '' }` + optional `devLog.log` stage pass

Fix key mismatch: guard must align with React storage (`docid` / `xmleditor:shared:{docId}` in **localStorage** for shared payload), not the outdated `sessionStorage DOC_ID` + `sessionStorage xmleditor:shared:` assumption alone. Prefer resolving through `resolveShareKeyContext` / passed `ctx`.

### 4. `GlobalBridge` stage logging

Update `src/services/bridge/GlobalBridge.js`:

- Replace raw `console.log` / `import.meta.env.DEV` gates with `devLog`
- At each stage setup (`init`, `loading`, `editorInit`, helpers as applicable):
  - `devLog.log('[GlobalBridge] {stage} start')`
  - resolve/pass `ctx`
  - `const result = sessionGuard.checkStage(stage, ctx)`
  - `devLog.log` / `devLog.warn` with `result.remarks` when bypassed or failed
  - `devLog.log('[GlobalBridge] {stage} complete', { ok, bypassed })`

Out of scope: `public/legacy-editor/**` unless a tiny mirror is explicitly requested later.

### 5. Verify / bootstrap callers

Everywhere session verify runs (landing grant/verify, `bootstrapEditorSession`, save/session guards that call `verifySession`):

1. Ensure shareKey/`ctx` resolved first — if not, fail (no localhost bypass without shareKey).
2. Run real verify against linkShare collection.
3. If verify fails because **DB record not available** / no active row (and equivalent empty getdocs cases):
   - localhost → treat as **bypass pass**, attach remarks e.g. `localhost_bypass:no_linkshare_row`, log via `devLog`
   - non-local → keep current hard fail
4. Other verify failures (`record_mismatch`, multiple active rows, etc.):
   - Still prefer fail-closed in production
   - On localhost: same bypass policy as agreed (“everywhere session verify runs” + validate then bypass) with distinct remarks so logs show the real failure reason

---

## Data flow

### Happy path (shareKey in localStorage)

1. Editor/landing has `docId`
2. `resolveShareKeyContext` → `source: 'localStorage'`
3. Payloads / guard / verify use `ctx`
4. Verify finds active row → proceed normally (`bypassed: false`)

### Recovery path (no local shared)

1. GET_DOCS returns doc row(s)
2. Normalize + persist `xmleditor:shared:{docId}` when possible
3. Continue as happy path with `source: 'getdocs'`

### Localhost bypass path (no linkShare active row)

1. ShareKey/`ctx` OK
2. Verify fails: no DB session row
3. `isLocalHost()` true → bypass pass + remarks in console
4. Editor may open; production would still block

### Hard fail path

1. No shareKey after localStorage + GET_DOCS → block everywhere (including localhost)
2. Non-local verify failure → block

---

## Error handling & remarks

Remarks should be stable, grep-friendly strings, for example:

| Condition | Remarks (example) |
|-----------|-------------------|
| Missing docId | `guard_fail:missing_doc_id` |
| Missing shareKey/ctx | `guard_fail:missing_share_key` |
| docid mismatch | `guard_fail:share_key_docid_mismatch` |
| No linkShare row (localhost bypass) | `localhost_bypass:no_linkshare_row` |
| Verify mismatch (localhost bypass) | `localhost_bypass:verify_failed:{reason}` |

All operator-facing stage logs go through `devLog` so non-local consoles stay clean.

---

## Testing

| Area | Expectations |
|------|----------------|
| `resolveShareKeyContext` | localStorage hit; GET_DOCS fallback; both miss → not ok |
| `buildBaseLinkSharePayload` | Includes ADD_DEFAULT_KEYS fields from fixture ctx |
| Process builders | Contain base fields + process deltas; no regression on existing unit tests |
| `SessionGuard` | Fail → localhost bypass; fail → non-local not ok; pass → ok |
| `devLog` / GlobalBridge | Stage logs call `devLog` (mock `isLocalHost`) |
| `bootstrapEditorSession` / verify | Localhost + no row → ok bypass; missing shareKey → fail; non-local + no row → fail |

Prefer Vitest unit tests under `tests/unit/session` and `tests/unit/bridge` / core as appropriate. Follow existing `.test.js` / `.test.jsx` include patterns.

---

## File touch list (implementation preview)

| File | Change |
|------|--------|
| `src/services/session/shareKeyContext.js` (new) or equivalent | Resolver |
| `src/services/session/sessionPayloads.js` | Base + process builders |
| `src/services/session/sessionGateway.js` | Verify bypass helpers if needed; keep transport enrich |
| `src/services/session/editorSessionBootstrap.js` | ShareKey-first + localhost verify bypass |
| `src/services/core/SessionGuard.js` | `checkStage(stage, ctx)` + bypass result |
| `src/services/bridge/GlobalBridge.js` | `devLog` + guard with ctx |
| `src/shared/utils/devLogger.js` | Reuse as-is |
| `src/services/session/index.js` | Export new helpers |
| Unit tests | New/updated as above |

Legacy reference only (do not copy blindly into React): impactweb linksharing docs listed above.

---

## Success criteria

- Local-only stage logging across GlobalBridge + SessionGuard via `devLog`
- Every stage validates with `ctx`; localhost failures become bypass with remarks
- ShareKey required from `xmleditor:shared:{docId}` or GET_DOCS
- LinkShare write payloads include common shareKey base fields; process builders only add deltas
- Localhost can open editor when linkShare DB row is missing **if** shareKey/`ctx` is present
- Non-local behavior remains fail-closed on missing DB session / failed verify
