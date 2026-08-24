# Error/ops contract parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Port impactweb error mail, error tracker/report UI, user-action history, and multipart upload into `impact_react_vite` with the same backend contracts, storage keys, and mail HTML as the spec.

**Architecture:** Follow `src/services/download/`: ES-module singletons, `initErrorOps()` from landing + editor, thin `window.ErrorLogTrace` bridge. Fill overlay stubs in `src/error/`. Do not wire figures/query/dialogs in this plan.

**Tech Stack:** React, Vitest, existing `apiService` (`updateorinsert`, `getdocs`, `getadmindocs`, `findupdateorinsert`, `genericsendemail`, `filesupload` / `filesuploadmultiple`), `showEditorMessage`.

**Spec:** [docs/superpowers/specs/2026-08-24-error-ops-contract-parity-design.md](../specs/2026-08-24-error-ops-contract-parity-design.md)

## Global Constraints

- Contract parity only: same collections, field names, REST paths, mail HTML, localStorage keys, 100/500 MB limits, `window.ErrorLogTrace`.
- Stack text from `new Error().stack`, never `fn.caller`.
- No `String.prototype` patches.
- One `ErrorTrackerProvider` for the app (overlay already imports it).
- No `/api/errors/sync`.
- `apiService.getDocs` forces `length = 2500`. ErrorLogs lookup **must** use `apiService.makeRequest(API_ENDPOINTS.GET_DOCS, payload)` with `length: 10`.
- Do not hard-code decoded email addresses; copy **encoded** `MAIL_DETAIL.Error_Mail` from impactweb `src/js/index.js` and `atob` at runtime.
- Mail template `find.id` for both paths: `610a4cd05e311ebaf978ef78` (from `ErrorMail_Module.js`).
- Do not wire FileUpload into figures/query or record every dialog open/close in this plan.
- After adding `src/services/error/`, `user-action/`, `upload/`, add README + skills.md and a row in `docs/SKILLS_AND_WORKFLOWS.md`.
- Unit tests: `npm run test:unit` (Vitest). Mirror `tests/unit/download/workflowDownloadService.test.js` mock style.
- Commit only if the user asked for commits in that session; otherwise skip Task commit steps.

---

## File map

**Create**

| Path | Responsibility |
|---|---|
| `src/services/error/errorContext.js` | `getDocId`, `getUserInfo`, `getSharedKey`, `getDefaultDocBag`, `getDefaultMainBag`, `isLocalHost`, `isLiveDomain`, `isUatDomain`, `isJournal` |
| `src/services/error/errorMailConfig.js` | Encoded `Error_Mail` from/to/bcc; `getSenderReceiverIds()`; template id constant |
| `src/services/error/errorMailHtml.js` | `buildMailTableHtml`, `buildMetaErrorHtml`, `formatStackHtml` |
| `src/services/error/errorSubjectMap.js` | 5-entry Map persist `xmleditor:{docId}:ErrorList`; 5-minute skip |
| `src/services/error/errorVisitThrottle.js` | `visitData_` + query string; 5-minute meta-error skip |
| `src/services/error/errorLogsApi.js` | insert + existence check |
| `src/services/error/errorMailService.js` | `shareErrorMail`, `sendMailIfAllowed` |
| `src/services/error/errorLogTrace.js` | `errorLogTrace(module, message)` |
| `src/services/error/errorBridge.js` | bind/unbind `window.ErrorLogTrace` |
| `src/services/error/index.js` | singleton + `initErrorOps()` |
| `src/error/errorTrackerStore.js` | ignore lists, caps, persist `global_error_tracking_{docid}` + migrate |
| `src/error/errorReportHtml.js` | project + error HTML tables, CSV |
| `src/error/ErrorTrackerProvider.jsx` | React context |
| `src/error/ErrorBoundary.jsx` | `logError` + `errorLogTrace` |
| `src/error/ErrorPanel.jsx` | `dangerouslySetInnerHTML` of report HTML |
| `src/services/user-action/userActionHistory.js` | empty history, aliases, merge, trim |
| `src/services/user-action/userActionService.js` | localStorage + getadmindocs / findupdateorinsert |
| `src/services/user-action/index.js` | singleton |
| `src/services/upload/fileUploadService.js` | FormData, limits, sanitize, in-flight reuse |
| `src/services/upload/index.js` | singleton |
| tests under `tests/unit/error/`, `tests/unit/user-action/`, `tests/unit/upload/` |
| README.md + skills.md next to each new service folder |

**Modify**

- `src/features/editor/pages/EditorPage.jsx` — call `initErrorOps()` next to `initDownloadService()`
- `src/features/landing/pages/ValidateUrlPage.jsx` — same
- `src/features/editor/messages/editorMessageLegacyKeyMap.js` — `'upload_file_too_big': EditorMessageKey.SINGLE_UPLOAD_SIZE_ERR`
- `src/services/README.md`, `docs/SKILLS_AND_WORKFLOWS.md`, `src/error/README.md`, `src/error/skills.md`

**Do not modify:** overlay-system/index.js (already imports the error files).

---

### Task 1: Session bags and mail HTML

**Files:**
- Create: `src/services/error/errorContext.js`
- Create: `src/services/error/errorMailHtml.js`
- Test: `tests/unit/error/errorMailHtml.test.js`

**Interfaces:**
- Consumes: `window.DOC_ID`, `window.SHARED_KEY`, `window.USER_INFO`, `window.IS_LIVE_DOMAIN`, `window.IS_UAT_DOMAIN`, `window.IS_JOURNAL`
- Produces: `getDocId()`, `getDefaultDocBag({ stripAcl })`, `buildMailTableHtml({ userRowsHtml, errRowsHtml, version, domain, envInfoHtml })`, `formatStackHtml(module, stack)`

- [x] **Step 1: Write the failing test**

```js
import { describe, expect, it } from 'vitest';
import { buildMailTableHtml, formatStackHtml } from '../../../src/services/error/errorMailHtml.js';

describe('errorMailHtml', () => {
  it('wraps Dear Team copy and Impact Version / Domain rows', () => {
    const html = buildMailTableHtml({
      userRowsHtml: '<tr><td>DOC ID:</td><td>D1</td></tr>',
      errRowsHtml: '',
      version: '9.0.0',
      domain: 'editor.example/path',
      envInfoHtml: ''
    });
    expect(html).toContain('<p>Dear Team,</p>');
    expect(html).toContain('Sorry for the trouble. The file automatically sent to the Newgen Technical team for investigating the error. They will get back to you soon.');
    expect(html).toContain('Impact Version:');
    expect(html).toContain('9.0.0');
    expect(html).toContain('Domain :');
  });

  it('turns Error.stack frames into br-at HTML', () => {
    const html = formatStackHtml('SaveXml', 'Error: boom\n    at foo (a.js:1:1)\n    at bar (b.js:2:2)');
    expect(html).toContain('SaveXml Stack:');
    expect(html).toContain('<br>at ');
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/error/errorMailHtml.test.js`  
Expected: FAIL (module not found)

- [x] **Step 3: Write minimal implementation**

`buildMailTableHtml` returns the exact wrapper from impactweb `GET_MAIL_TABLE_FORMAT`. `formatStackHtml` prefixes `{module} Stack:`, replaces the first `Error` token, replaces `at ` with `<br>at `, collapses `<br><br>`.

`getDefaultDocBag` reads `window.SHARED_KEY` / `USER_INFO` / `DOC_ID` and returns `{ docid, client, projectname, username }` plus any other fields the editor already puts on `updateorinsert`. If `stripAcl`, delete `_w` and `_r`.

- [x] **Step 4: Run tests and make sure they pass**

Run: `npm run test:unit -- tests/unit/error/errorMailHtml.test.js`  
Expected: PASS

---

### Task 2: Subject Map and visit throttle

**Files:**
- Create: `src/services/error/errorSubjectMap.js`
- Create: `src/services/error/errorVisitThrottle.js`
- Test: `tests/unit/error/errorSubjectMap.test.js`

**Interfaces:**
- Consumes: `localStorage`, `getDocId()`, `Date.now()`
- Produces: `shouldSkipSubject(subject, now)`, `recordSubject(subject, now)`, `shouldSkipMetaVisit(searchQuery, now)`

- [x] **Step 1: Write the failing test**

```js
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { recordSubject, shouldSkipSubject } from '../../../src/services/error/errorSubjectMap.js';
import { shouldSkipMetaVisit } from '../../../src/services/error/errorVisitThrottle.js';

describe('errorSubjectMap', () => {
  beforeEach(() => {
    window.DOC_ID = 'DOC1';
    localStorage.clear();
  });
  afterEach(() => localStorage.clear());

  it('skips the same subject within 5 minutes', () => {
    const t0 = 1_000_000;
    recordSubject('SaveXml', t0);
    expect(shouldSkipSubject('SaveXml', t0 + 4 * 60 * 1000)).toBe(true);
    expect(shouldSkipSubject('SaveXml', t0 + 6 * 60 * 1000)).toBe(false);
  });

  it('persists under xmleditor:DOC1:ErrorList', () => {
    recordSubject('SaveXml', 1_000_000);
    const raw = localStorage.getItem('xmleditor:DOC1:ErrorList');
    expect(JSON.parse(raw)[0][0]).toBe('SaveXml');
  });
});

describe('errorVisitThrottle', () => {
  beforeEach(() => localStorage.clear());
  it('skips second visit inside 5 minutes', () => {
    const q = 'docid=DOC1';
    expect(shouldSkipMetaVisit(q, 1_000_000)).toBe(false);
    expect(shouldSkipMetaVisit(q, 1_000_000 + 60_000)).toBe(true);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/error/errorSubjectMap.test.js`  
Expected: FAIL

- [x] **Step 3: Write minimal implementation**

Subject Map: load/save `JSON.stringify([...map.entries()])`, cap 5 (delete oldest key), skip if last key === subject and age < 5 min **or** map has subject and age < 5 min.

Visit throttle: key `visitData_` + `decodeURIComponent(searchQuery)` (pass `location.search.substring(1)` from caller). Store `{ count, lastVisit }`. Window `5 * 60 * 1000`. Return true when `count > 1` inside window.

- [x] **Step 4: Run tests and make sure they pass**

Run: `npm run test:unit -- tests/unit/error/errorSubjectMap.test.js`  
Expected: PASS

---

### Task 3: ErrorLogs API, mail send, ErrorLogTrace, bridge, init

**Files:**
- Create: `src/services/error/errorMailConfig.js`
- Create: `src/services/error/errorLogsApi.js`
- Create: `src/services/error/errorMailService.js`
- Create: `src/services/error/errorLogTrace.js`
- Create: `src/services/error/errorBridge.js`
- Create: `src/services/error/index.js`
- Create: `src/services/error/README.md`, `skills.md`
- Test: `tests/unit/error/errorMailService.test.js`
- Modify: `src/services/README.md`, `docs/SKILLS_AND_WORKFLOWS.md`

**Interfaces:**
- Consumes: Tasks 1–2, `apiService.makeRequest`, `API_ENDPOINTS.UPDATE_INSERT`, `GET_DOCS`, `GENERIC_SEND_MAIL`, `apiService.sendEmail`
- Produces: `errorLogTrace(module, message)`, `initErrorOps()`, `bindErrorBridge()`, `shareErrorMail(subject, track, message, stackHtml)`

Copy encoded `MAIL_DETAIL.Error_Mail` from `impactweb/src/js/index.js` into `errorMailConfig.js`. `getSenderReceiverIds()` returns `{ from, to, bcc }` via `atob`, using `to.live`/`bcc.live` when `window.IS_LIVE_DOMAIN` else `.default`.

`MAIL_TEMPLATE_ID = '610a4cd05e311ebaf978ef78'`.

Existence: last row `time_c.$numberLong || time_c.numberLong`. Send if no rows. Else send if age > 10 minutes AND NOT (module in `['WORK_FLOW','editor_initialize_events']` and same docid and age ≤ 3 days). Do not send if last module matches `/QUERY_SPAN|ORG_QUERY_SPAN|RESTORE_QUERY/i`. Lookup find drops `username` when module matches `/QUERY_SPAN|ORG_QUERY_SPAN/i`.

Localhost: if `!window.CanSendLocalMail && isLocalHost()`, first `errorLogTrace` returns; later returns `false`. Send mail only if `(CanSendLocalMail && isLocalHost()) || !isLocalHost()`.

Meta modules: `checkIsExistErrorLog`, `SEND_ERROR_MAIL`, `ErrorShareMail`, `addTeamIdsMail`, `mailBody`, `ERROR_ON_ERROR_MAIL`, `GET_MAIL_TABLE_FORMAT` (legacy names — match this list even if React function names differ). Also meta if `SHARED_KEY == null`. Subject `Error_Mail_ERROR_{module}`. Omit `emailBCC`.

Normal mail `tbl: emaildraft`, fields `emailfrom`, `emailto`, `emailBCC`, `emailSubject`, `emailMessage`, `docid`, `find.id`. Insert ErrorLogs with `tbl: ErrorLogs` plus `getDefaultDocBag()`.

`errorLogTrace`: if args invalid, `console.log` only. Else `formatStackHtml` + track from `new Error().stack`. If `window.IMPACT_SELECTION?._SNAPSHOT`, call `{ unlock: true }`.

`initErrorOps()`: `bindErrorBridge()` (`window.ErrorLogTrace = errorLogTrace`), init tracker store (Task 4 can no-op until that task), init user-action load (Task 6 can no-op).

- [x] **Step 1: Write the failing test** (mock `apiService` like download tests)

Assert: skip send when subject recorded 1 minute ago; `makeRequest` GET_DOCS `length: 10`; `sendEmail` called when GET_DOCS returns `{ data: [] }`; not called when last row is 2 minutes old; `window.ErrorLogTrace` set after `initErrorOps()`.

- [x] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/error/errorMailService.test.js`  
Expected: FAIL

- [x] **Step 3: Write minimal implementation**

- [x] **Step 4: Run tests and make sure they pass**

Expected: PASS

- [x] **Step 5: Docs** — list key files in README; add Services table row `error` in `docs/SKILLS_AND_WORKFLOWS.md`.

---

### Task 4: Tracker store (no React yet)

**Files:**
- Create: `src/error/errorTrackerStore.js`
- Create: `src/error/errorReportHtml.js`
- Test: `tests/unit/error/errorTrackerStore.test.js`

**Interfaces:**
- Consumes: `errorLogsApi.insertErrorLog`, `getDocId`, `formatStackHtml`
- Produces: `createErrorTrackerStore()`, `logError(module, fn, error, context)`, `renderErrorReportTable(options)`, `exportErrorReportCsv(options)`, `getRecentErrors()`

Ignore: module `system`; functions `lazyInitialization`, `initialization_failed`, `initializeModule`, `loadModuleClass`, `loadModuleImmediately`, `loadModuleInstance`, `registerModule`; messages `/ref_form/i`, `/loadModuleClass/i`.

Caps 100/module, 5000 global. Persist key `global_error_tracking_{docid}`. On load, if empty, copy `global_error_tracking` once.

`logError` increments `repeatCount` when last entry same message+function. Then persist + insert ErrorLogs (`stack`, `track`, `repeatCount`, `timestamp`).

Report intro = same two `<p>` as mail. Return `false` when no errors.

Do not implement `/api/errors/sync`.

- [x] **Step 1: Write failing tests** — ignore `system`; persist scoped key; migrate unscoped; 101st error per module drops oldest; `renderErrorReportTable` false when empty; CSV header `Timestamp,Module,Function,Message,Repeat Count,Context,Browser,User ID`.

- [x] **Step 2: Run test to verify it fails**

- [x] **Step 3: Implement**

- [x] **Step 4: Run tests and make sure they pass**

---

### Task 5: Overlay ErrorTrackerProvider, ErrorBoundary, ErrorPanel

**Files:**
- Create: `src/error/ErrorTrackerProvider.jsx`
- Create: `src/error/ErrorBoundary.jsx`
- Create: `src/error/ErrorPanel.jsx`
- Modify: `src/error/README.md`, `src/error/skills.md`
- Test: `tests/unit/error/ErrorBoundary.test.jsx` (if the repo already uses `@testing-library/react`; otherwise a store-level test that ErrorBoundary’s `componentDidCatch` calls `logError` via an injected store — prefer RTL if `package.json` has it)

**Interfaces:**
- Consumes: Task 4 store (module-level singleton `errorTrackerStore`)
- Produces: `ErrorTrackerProvider`, `useErrorTracker()`, default export `ErrorBoundary`, default export `ErrorPanel`

Overlay already has:

```js
export { ErrorTrackerProvider, useErrorTracker } from '../error/ErrorTrackerProvider';
export { default as ErrorBoundary } from '../error/ErrorBoundary';
export { default as ErrorPanel } from '../error/ErrorPanel';
```

Named exports **must** match exactly.

`ErrorBoundary.componentDidCatch(error, info)`: `errorTrackerStore.logError(this.props.name || 'react', 'render', error, { componentStack: info.componentStack })` then `errorLogTrace(...)`.

`ErrorPanel`: `const html = errorTrackerStore.renderErrorReportTable({ limit: 50 });` if html, `div.error-report-table` with `dangerouslySetInnerHTML`.

- [x] **Step 1: Write failing import test**

```js
import { ErrorTrackerProvider, useErrorTracker } from '../../../src/overlay-system/index.js';
import ErrorBoundary from '../../../src/error/ErrorBoundary.jsx';
import ErrorPanel from '../../../src/error/ErrorPanel.jsx';
expect(ErrorTrackerProvider).toBeTypeOf('function');
expect(ErrorBoundary).toBeTypeOf('function');
expect(ErrorPanel).toBeTypeOf('function');
```

- [x] **Step 2–4:** implement until overlay imports resolve and `npm run test:unit -- tests/unit/error/` passes.

---

### Task 6: User action history service

**Files:**
- Create: `src/services/user-action/userActionHistory.js`
- Create: `src/services/user-action/userActionService.js`
- Create: `src/services/user-action/index.js`
- Create: README.md, skills.md
- Test: `tests/unit/user-action/userActionHistory.test.js`
- Modify: `docs/SKILLS_AND_WORKFLOWS.md`

**Interfaces:**
- Consumes: `API_ENDPOINTS.GET_ADMINDOCS`, `FIND_UPDATE_INSERT`, `getDefaultMainBag()`, `getDocId()`, `USER_INFO.MAIL_ID`, `USER_INFO.TRACK_ROLE_NAME` or `ROLE_NAME`, `getSessionId()` from existing session helpers if present else `window.SESSION_ID`
- Produces: `updateActivity(channel, update)`, `syncUserActionHistory({ keepalive })`, `trackDialogOpenClose`, `trackAttachmentsFlow`, `trackSuppFileWorkflow`

Canonical keys: `open_close_dialog`, `query_quick_answer`, `insert_symbol`, `video_tour`, `guided_tour`, `find_words`, `replace_words`, `attachments_flow`.

Aliases on load: fold `open_close_dialog` → `open_close_dialog` if both appear, same for query/insert/attachments; `supp_file_workflow` → append `attachments_flow`.

localStorage key `xmleditor:user_action_history:{docid}`; if no docid, `no-docid` and retry load after 2s.

Trim when serialized size > 4.5 MB keep 80%; QuotaExceeded keep 50%.

`find`: `{ recordtype: 'user_action_history', username, docid, rolename, session_id }`. `tbl: UserPreference`.

Skip sync if dialog map and query/insert/attachments arrays are empty. Unload: `keepalive: true`; ignore `TypeError` / Failed to fetch.

- [x] **Step 1: Write failing tests** — alias fold; dialog open assigns `_session`; close copies it; trim 80%; merge prefers newer `time_c`.

- [x] **Step 2–4:** implement until tests pass. Export singleton from `index.js`. Call `load` from `initErrorOps()` in Task 3 file (add one line).

---

### Task 7: File upload service

**Files:**
- Create: `src/services/upload/fileUploadService.js`
- Create: `src/services/upload/index.js`
- Create: README.md, skills.md
- Test: `tests/unit/upload/fileUploadService.test.js`
- Modify: `src/features/editor/messages/editorMessageLegacyKeyMap.js`
- Modify: `docs/SKILLS_AND_WORKFLOWS.md`

**Interfaces:**
- Consumes: `API_ENDPOINTS.UPLOAD_MULTI` (default ctor arg), `getDefaultDocBag({ stripAcl: true })`, `showEditorMessage`
- Produces: `makeRequest(files, customData)` → `Promise<object|null>`

Limits: 100 MB per file, 500 MB total. Toast keys: `upload_file_too_big` (map to `EditorMessageKey.SINGLE_UPLOAD_SIZE_ERR`), `upload_size_big` (already mapped to `UPLOAD_SIZE_BIG`). If `customData.subfolder === 'images'`, skip multi toast.

FormData: `file_${i}`, `tbl: Usernotes`, `optional: 1`, `status: '0'`, arrays `file_sn`, `file_on`, `ext`. Sanitize: drop empty sn; pair on/ext; ext from sn if missing.

In-flight: return the same promise if `_inFlightUploadPromise` is set.

HTTP failure: `console.error`, return `null`. Localhost: log `Object.fromEntries(formData.entries())`.

POST via `apiService.makeRequest(url, null, { rawBody: formData, headers: { appKey, apiKey } })` **without** forcing `Content-Type: multipart/form-data` (let axios set boundary). If `makeRequest` always json-encodes, add `rawBody` support (already on `makeRequest`) and pass FormData as `rawBody`.

- [x] **Step 1: Write failing tests** — 101 MB file returns null; second `makeRequest` while first pending returns same promise; sanitize drops empty `file_sn`.

- [x] **Step 2–4:** implement until tests pass.

---

### Task 8: Boot from editor and landing

**Files:**
- Modify: `src/features/editor/pages/EditorPage.jsx` (the `useEffect` that already calls `initDownloadService()`)
- Modify: `src/features/landing/pages/ValidateUrlPage.jsx` (same for `initDownloadService()`)

**Interfaces:**
- Consumes: `initErrorOps` from `src/services/error/index.js`
- Produces: `window.ErrorLogTrace` after editor/landing mount

- [x] **Step 1:** In both files, `import { initErrorOps } from '../../../services/error/index.js';` and `initErrorOps();` immediately after `initDownloadService();`.

- [x] **Step 2:** Confirm `EditorInitService.handleTimeout` still calls `window.ErrorLogTrace` (already does). No signature change.

- [x] **Step 3:** Run `npm run test:unit -- tests/unit/error tests/unit/user-action tests/unit/upload tests/unit/download`

Expected: PASS (download still green; new suites green)

---

## Spec coverage

| Spec section | Task |
|---|---|
| §4 HTTP ErrorLogs / mail | 3 |
| §4 UserPreference | 6 |
| §4 multipart upload | 7 |
| §5.1 subject Map | 2 |
| §5.2 tracker persist | 4 |
| §5.3 visitData_ | 2 |
| §5.4 user action keys | 6 |
| §6.1 ErrorLogTrace / mail HTML | 1, 3 |
| §6.2 tracker + overlay | 4, 5 |
| §6.3 user action | 6 |
| §6.4 upload | 7 |
| §7 GET_JSON bags | 1, 6, 7 |
| §8 public API / window | 3, 8 |
| §9 out of scope | no tasks (intentionally) |
| §10 tests | 1–7 |
| Overlay import names | 5 |
| Boot landing + editor | 8 |

## Placeholder scan

No TBD. Stack = `Error.stack`. Tracker key = scoped + one migrate. Mail tbl = `emaildraft` both paths. Window name = `ErrorLogTrace` only.

## Type consistency

- `initErrorOps()` / `errorLogTrace(module, message)` / `shareErrorMail(...)` / `logError(module, fn, error, context)` / `makeRequest(files, customData)` / `updateActivity(channel, update)` used the same way in later tasks as defined above.
- Overlay: `ErrorTrackerProvider`, `useErrorTracker`, default `ErrorBoundary`, default `ErrorPanel`.
