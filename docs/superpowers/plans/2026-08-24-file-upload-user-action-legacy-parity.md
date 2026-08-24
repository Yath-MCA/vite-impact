# File upload / user-action legacy parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `src/services/upload/fileUploadService.js` and `src/services/user-action/{userActionHistory,userActionService}.js` (built during the error-ops-contract-parity plan) so their field names, merge algorithm, session bookkeeping, and per-channel endpoint routing match the **current** impactweb sources byte-for-byte in contract, not the earlier design-spec's approximation of them.

**Architecture:** Same file layout as before (`src/services/upload/`, `src/services/user-action/`). No new files — this plan replaces function bodies inside the existing modules and updates their tests to assert the corrected shapes. Public entry points (`fileUploadService.makeRequest`, `userActionService.trackDialogOpenClose`, `.trackAttachmentsFlow`, `.syncUserActionHistory`) keep the same import paths so `src/services/error/index.js`'s `initErrorOps()` wiring (`userActionService.load()`) needs no changes.

**Tech Stack:** React, Vitest, existing `apiService`, `errorLogTrace` from `src/services/error/errorLogTrace.js` (now used for failure reporting, matching legacy's `ErrorLogTrace(...)` calls).

**Spec:** Source of truth for this plan is the two current legacy files, read in full during planning:
- `C:\_IMPACT\tomcat\webapps\impactweb\src\modules\components\FileUploadModule.js`
- `C:\_IMPACT\tomcat\webapps\impactweb\src\modules\components\UserActionRecord_Handler.js`

The original design doc (`docs/superpowers/specs/2026-08-24-error-ops-contract-parity-design.md`) covered these two modules only at a high level (§2, §6.3, §6.4); this plan supersedes those sections with the exact behavior read from the current source.

## Global Constraints

- Match field names exactly: history entries use `time_c` (epoch ms number) and `time_iso` (ISO string) — never a generic `timestamp` field.
- Match the dialog `_session` algorithm exactly: on `open`, `_session = (count of prior entries with action === 'open' in this dialog's bucket) + 1`. On `close`, `_session` = the `_session` of the nearest prior `open` entry not yet matched by a `close` (walk backward, track closed `_session` values in a Set, skip them).
- Match the merge algorithm exactly: `open_close_dialog` entries key on `` `${_session}_${action}` ``; other array channels key on a composite signature of `time_c|action|process|filename|oldfilename|dialog_id|_session|time_iso|info` (falling back to `` `${time_c}|idx:${index}` `` when that signature is empty except time). Server entry wins when `server time_c >= local time_c`.
- Match per-channel endpoint routing: `open_close_dialog`, `query_quick_answer`, `insert_symbol`, `find_words`, `replace_words`, `attachments_flow` sync via `FIND_UPDATE_INSERT`; `video_tour` and `guided_tour` are `ignore_local_storage: true` and `guided_tour` syncs via `UPDATE_INSERT` (not `FIND_UPDATE_INSERT`).
- `payLoad().find.docid` comes from the global doc id (`getDocId()` — `window.DOC_ID` / `window.SHARED_KEY.docid`), **not** the URL query string. Only the localStorage key (`getLocalStorageKey()` equivalent) parses `docid` from `URLSearchParams`. These are two different docid sources in the legacy file and must stay different in the port.
- `trackDialogOpenClose(action, options)` and `trackAttachmentsFlow(update)` keep the legacy parameter shapes (not the earlier port's `(dialogId, action, extra)` / raw-spread shapes).
- Unload-sync error swallowing matches `/NetworkError|Failed to fetch|Load failed/i` (or `TypeError`) — the earlier port only matched `Failed to fetch`.
- `syncUserActionHistory` guards against concurrent syncs with an `isSyncing` flag (legacy `_isSyncing`), matching the current source; the earlier port had no such guard.
- Upload headers set `'Content-Type': 'multipart/form-data'` explicitly (matching current `FileUploadModule.js` literally, even though this differs from the general "let the browser set the multipart boundary" guidance in the earlier design doc — the current legacy source is the authority here, not that doc).
- **Deliberate fix, not a copy:** legacy `createFormData` has a latent bug — when `appendFiles` aborts on an oversized single file it returns `null`, but `isMultiSizeExceeded(null)` evaluates to `NaN > 500` which is `false`, so `createFormData` falls through and returns a **partial** `FormData` (some files appended, one silently dropped) instead of aborting the whole upload. This port fixes that: `createFormData` returns `null` outright when `appendFiles` returns `null`. This is the one intentional behavioral deviation in this plan; call it out in code review, don't silently diverge elsewhere.
- `sanitizeAttachmentData` returns `{}` (not `{ file_sn: [], file_on: [], ext: [] }`) when the caller passes none of `file_sn`/`file_on`/`ext` — this matters because `appendCommonData` only emits those FormData fields when the caller supplied them.
- Array fields (`file_sn`, `file_on`, `ext`) go into `FormData` as **repeated `formData.append(key, item)` calls**, not `JSON.stringify(array)`.
- `errorLogTrace(module, message)` (from `src/services/error/errorLogTrace.js`, already built) replaces bare `console.warn` on `syncUserActionHistory`, `UPDATE_LOCAL_STORAGE`, `UPDATE_LOCAL_STORAGE_TRIM`, and `FETCH_DB` failure paths, matching legacy's `ErrorLogTrace(...)` calls.
- Unit tests: `npm run test:unit` (Vitest), same mock style as `tests/unit/download/workflowDownloadService.test.js`.
- Commit only if the user asked for commits in that session; otherwise skip Task commit steps.

---

## File map

**Modify**

| Path | Change |
|---|---|
| `src/services/upload/fileUploadService.js` | Full rewrite: explicit `Content-Type` header, `sanitizeAttachmentData` (renamed from `sanitizeFileArrays`), `appendCommonData`/`appendFiles`/`createFormData` order and repeated-field append, `_isUploading` flag, null-propagation fix |
| `tests/unit/upload/fileUploadService.test.js` | Update assertions for header, repeated-field FormData, `sanitizeAttachmentData` empty-return case |
| `src/services/user-action/userActionHistory.js` | Full rewrite: `time_c`/`time_iso` fields, `normalizeHistoryData`/`normalizeOpenCloseHistory`, composite merge keys, count-based `_session` algorithm |
| `tests/unit/user-action/userActionHistory.test.js` | Rewrite fixtures to use `time_c`/`time_iso`, composite merge keys, `normalizeHistoryData` |
| `src/services/user-action/userActionService.js` | Full rewrite: per-channel `RECORD_INFO` routing, `invoke()`, `payLoad()` via global `getDocId()`, `_isSyncing` guard, `trackDialogOpenClose(action, options)` / `trackAttachmentsFlow(update)` legacy shapes, `errorLogTrace` wiring |
| `tests/unit/user-action/userActionService.test.js` | Rewrite for new signatures, per-channel endpoint assertions, `_isSyncing` reentrancy test |
| `src/services/upload/README.md`, `skills.md` | Update to describe the exact header/array-append/sanitize behavior |
| `src/services/user-action/README.md`, `skills.md` | Update to describe `time_c`/`time_iso`, per-channel routing, legacy call shapes |

**Do not modify:** `src/services/user-action/index.js` (forwarding wrappers are signature-agnostic via `...args`), `src/services/error/index.js` (already calls `userActionService.load()`, still valid), `EditorPage.jsx` / `ValidateUrlPage.jsx` (no change — `initErrorOps()` wiring is unaffected).

---

### Task 1: File upload service — legacy parity

**Files:**
- Modify: `src/services/upload/fileUploadService.js`
- Modify: `tests/unit/upload/fileUploadService.test.js`

**Interfaces:**
- Consumes: `apiService.makeRequest`, `API_ENDPOINTS.UPLOAD_MULTI`, `getDefaultDocBag({ stripAcl: true })`, `isLocalHost()`, `showEditorMessage('upload_file_too_big' | 'upload_size_big')`
- Produces: `FileUploadService` (constructor `(endpoint, headers, options)`), `sanitizeAttachmentData(data)`, `createFileUploadService(endpoint, headers, options)`

- [ ] **Step 1: Write the failing test**

Replace `tests/unit/upload/fileUploadService.test.js` with:

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: {
    makeRequest: vi.fn().mockResolvedValue({ r: 1 })
  },
  API_ENDPOINTS: {
    UPLOAD_MULTI: '/api/filesuploadmultiple'
  }
}));

vi.mock('../../../src/features/editor/messages/editorMessages.js', () => ({
  showEditorMessage: vi.fn().mockResolvedValue({ isConfirmed: true })
}));

import { apiService } from '../../../src/services/api/apiService.js';
import { showEditorMessage } from '../../../src/features/editor/messages/editorMessages.js';
import { FileUploadService, sanitizeAttachmentData } from '../../../src/services/upload/fileUploadService.js';

function makeFile(name, sizeBytes) {
  const file = new File([new Uint8Array(1)], name);
  Object.defineProperty(file, 'size', { value: sizeBytes });
  return file;
}

function installWindowState() {
  window.SHARED_KEY = { client: 'LWW', docid: 'DOC1', projectname: 'SampleArticle' };
  window.DOC_ID = 'DOC1';
  window.USER_INFO = { MAIL_ID: 'user@example.com', ROLE_ID: 'CE01' };
}

describe('fileUploadService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    installWindowState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects a single file over 100MB and aborts the whole upload (fixes legacy partial-upload bug)', async () => {
    const service = new FileUploadService();
    const result = await service.makeRequest([makeFile('ok.png', 10), makeFile('big.png', 101 * 1024 * 1024)]);
    expect(result).toBeNull();
    expect(showEditorMessage).toHaveBeenCalledWith('upload_file_too_big');
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('rejects a total over 500MB unless subfolder is images', async () => {
    const service = new FileUploadService();
    const files = [makeFile('a.png', 300 * 1024 * 1024), makeFile('b.png', 300 * 1024 * 1024)];

    const blocked = await service.makeRequest(files, {});
    expect(blocked).toBeNull();
    expect(showEditorMessage).toHaveBeenCalledWith('upload_size_big');

    showEditorMessage.mockClear();
    apiService.makeRequest.mockClear();
    const allowed = await service.makeRequest(files, { subfolder: 'images' });
    expect(allowed).toEqual({ r: 1 });
    expect(showEditorMessage).not.toHaveBeenCalled();
  });

  it('posts with an explicit multipart Content-Type header', async () => {
    const service = new FileUploadService();
    await service.makeRequest([makeFile('a.png', 10)]);
    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/filesuploadmultiple',
      null,
      expect.objectContaining({
        headers: expect.objectContaining({ 'Content-Type': 'multipart/form-data' })
      })
    );
  });

  it('appends file_sn/file_on/ext as repeated fields, not a JSON string', async () => {
    const service = new FileUploadService();
    await service.makeRequest([makeFile('a.png', 10)], {
      file_sn: ['a.png', ''],
      file_on: ['Original A', 'Original B'],
      ext: ['', 'gif']
    });
    const formData = apiService.makeRequest.mock.calls[0][2].rawBody;
    expect(formData.getAll('file_sn')).toEqual(['a.png']);
    expect(formData.getAll('file_on')).toEqual(['Original A']);
    expect(formData.getAll('ext')).toEqual(['png']);
  });

  it('reuses the in-flight request while one is pending, calling the API only once', async () => {
    let resolveRequest;
    apiService.makeRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );

    const service = new FileUploadService();
    const first = service.makeRequest([makeFile('a.png', 10)]);
    const second = service.makeRequest([makeFile('b.png', 10)]);

    resolveRequest({ r: 1 });
    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(apiService.makeRequest).toHaveBeenCalledTimes(1);
    expect(firstResult).toEqual({ r: 1 });
    expect(secondResult).toEqual({ r: 1 });
  });

  describe('sanitizeAttachmentData', () => {
    it('returns {} when none of file_sn/file_on/ext are passed', () => {
      expect(sanitizeAttachmentData({ tbl: 'Usernotes' })).toEqual({});
    });

    it('drops empty file_sn, pairs file_on by cleaned index, derives ext from sn', () => {
      const result = sanitizeAttachmentData({
        file_sn: ['a.png', '', 'b'],
        file_on: ['A', 'B', 'C'],
        ext: ['png', 'gif', '']
      });
      expect(result).toEqual({
        file_sn: ['a.png', 'b'],
        file_on: ['A', 'C'],
        ext: ['png', '']
      });
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/upload/fileUploadService.test.js`
Expected: FAIL — `sanitizeAttachmentData` is not exported (the current file exports `sanitizeFileArrays`); the header/repeated-field/partial-upload assertions fail against the current implementation.

- [ ] **Step 3: Write minimal implementation**

Replace `src/services/upload/fileUploadService.js` with:

```js
import { apiService, API_ENDPOINTS } from '../api/apiService.js';
import { getDefaultDocBag, isLocalHost } from '../error/errorContext.js';
import { showEditorMessage } from '../../features/editor/messages/editorMessages.js';

const MAX_SINGLE_FILE_SIZE_MB = 100;
const MAX_MULTI_FILE_SIZE_MB = 500;

function toMb(bytes) {
  return bytes / (1024 * 1024);
}

/**
 * Mirrors impactweb FileUploadModule.sanitizeAttachmentData: drop empty file_sn,
 * pair file_on by the cleaned index, derive ext from sn when missing.
 * Returns {} when none of file_sn/file_on/ext were passed at all.
 */
export function sanitizeAttachmentData(data = {}) {
  const snList = Array.isArray(data.file_sn) ? data.file_sn : null;
  const onList = Array.isArray(data.file_on) ? data.file_on : null;
  const extList = Array.isArray(data.ext) ? data.ext : null;

  if (!snList && !onList && !extList) return {};

  const safeSn = snList || [];
  const safeOn = onList || [];
  const safeExt = extList || [];

  const cleanedSn = [];
  const cleanedOn = [];
  const cleanedExt = [];
  let nameIdx = 0;

  for (let i = 0; i < safeSn.length; i++) {
    const normalizedSn = String(safeSn[i] || '').trim();
    if (!normalizedSn) continue;

    const normalizedOn = String(safeOn[nameIdx] || safeOn[i] || '').trim();
    let normalizedExt = String(safeExt[i] || '').trim();
    if (!normalizedExt && normalizedSn.indexOf('.') !== -1) {
      normalizedExt = normalizedSn.split('.').pop();
    }

    cleanedSn.push(normalizedSn);
    cleanedOn.push(normalizedOn);
    cleanedExt.push(normalizedExt);
    nameIdx++;
  }

  return { file_sn: cleanedSn, file_on: cleanedOn, ext: cleanedExt };
}

export class FileUploadService {
  constructor(endpoint = API_ENDPOINTS.UPLOAD_MULTI, headers = {}, options = {}) {
    this.uploadUrl = endpoint;
    this.headers = { 'Content-Type': 'multipart/form-data', ...headers };
    this.options = options;
    this._isUploading = false;
    this._inFlightUploadPromise = null;
  }

  isSingleSizeExceeded(fileSize) {
    if (toMb(fileSize) > MAX_SINGLE_FILE_SIZE_MB) {
      showEditorMessage('upload_file_too_big');
      return true;
    }
    return false;
  }

  isMultiSizeExceeded(totalSize) {
    return toMb(totalSize) > MAX_MULTI_FILE_SIZE_MB;
  }

  handleSizeExceeded(subfolder) {
    if (subfolder !== 'images') {
      showEditorMessage('upload_size_big');
    }
    return null;
  }

  appendFiles(formData, fileArr) {
    let totalSize = 0;
    for (let i = 0; i < fileArr.length; i++) {
      const file = fileArr[i];
      if (this.isSingleSizeExceeded(file.size)) return null;
      totalSize += file.size;
      formData.append(`file_${i}`, file);
    }
    return totalSize;
  }

  appendCommonData(formData, customData = {}) {
    const bag = getDefaultDocBag({ stripAcl: true });
    const normalizedAttachments = sanitizeAttachmentData(customData);
    const commonData = {
      tbl: 'Usernotes',
      ...bag,
      ...customData,
      ...normalizedAttachments,
      optional: 1,
      status: '0'
    };

    Object.entries(commonData).forEach(([key, value]) => {
      if (Array.isArray(value) && (key === 'file_on' || key === 'file_sn' || key === 'ext')) {
        value.forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, value);
      }
    });
  }

  debugFormData(formData) {
    if (isLocalHost()) {
      console.log(JSON.stringify(Object.fromEntries(formData.entries())));
    }
  }

  /**
   * Fix vs legacy: legacy's isMultiSizeExceeded(null) evaluates NaN > 500 = false when
   * appendFiles aborts on an oversized single file, so it silently returns a partial
   * FormData instead of aborting. This port aborts outright on that null.
   */
  createFormData(fileArr, customData = {}) {
    const formData = new FormData();
    const { subfolder } = customData;

    this.appendCommonData(formData, customData);
    const totalSize = this.appendFiles(formData, fileArr);
    if (totalSize == null) return null;

    if (this.isMultiSizeExceeded(totalSize)) {
      return this.handleSizeExceeded(subfolder);
    }

    this.debugFormData(formData);
    return formData;
  }

  async makeRequest(files, customData = {}) {
    if (this._inFlightUploadPromise) {
      console.warn('FileUploadService.makeRequest: upload already in progress, returning in-flight promise.');
      return this._inFlightUploadPromise;
    }

    this._isUploading = true;
    this._inFlightUploadPromise = (async () => {
      try {
        const formData = this.createFormData(Array.from(files || []), customData);
        if (!formData) return null;

        return await apiService.makeRequest(this.uploadUrl, null, {
          rawBody: formData,
          headers: this.headers
        });
      } catch (err) {
        console.error('Error uploading file:', err);
        return null;
      } finally {
        this._isUploading = false;
        this._inFlightUploadPromise = null;
      }
    })();

    return this._inFlightUploadPromise;
  }
}

export function createFileUploadService(endpoint, headers, options) {
  return new FileUploadService(endpoint, headers, options);
}
```

- [ ] **Step 4: Run tests and make sure they pass**

Run: `npm run test:unit -- tests/unit/upload/fileUploadService.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Update docs**

In `src/services/upload/README.md`, replace the `Key files` bullet for `fileUploadService.js` with: `` `fileUploadService.js` — `FileUploadService` class (`Content-Type: multipart/form-data` header, repeated-field FormData for `file_sn`/`file_on`/`ext`), `makeRequest(files, customData)`, `sanitizeAttachmentData` ``.

In `src/services/upload/skills.md`, replace the sanitize bullet with: "Sanitize `file_sn`/`file_on`/`ext` with `sanitizeAttachmentData` — returns `{}` when none of the three arrays were passed, otherwise drops empty `file_sn`, derives `ext` from the sn extension when missing, and appends each array as **repeated** `formData.append(key, item)` calls (never `JSON.stringify`)." and add a bullet: "A single oversized file aborts the whole upload — do not let `createFormData` fall through to a partial `FormData` (that was a legacy bug, fixed in this port)."

---

### Task 2: User-action history — legacy field/merge/session parity

**Files:**
- Modify: `src/services/user-action/userActionHistory.js`
- Modify: `tests/unit/user-action/userActionHistory.test.js`

**Interfaces:**
- Produces: `createEmptyHistory()`, `normalizeHistoryData(raw)`, `mergeHistory(local, server)`, `serializedByteSize(history)`, `trimHistory(history, ratio)`, `appendDialogActivity(dialogMap, update)`, `isHistoryEmpty(history)`, `HISTORY_CHANNELS`

- [ ] **Step 1: Write the failing test**

Replace `tests/unit/user-action/userActionHistory.test.js` with:

```js
import { describe, expect, it } from 'vitest';
import {
  appendDialogActivity,
  createEmptyHistory,
  isHistoryEmpty,
  mergeHistory,
  normalizeHistoryData,
  serializedByteSize,
  trimHistory
} from '../../../src/services/user-action/userActionHistory.js';

describe('userActionHistory', () => {
  it('folds supp_file_workflow alias into attachments_flow on normalize', () => {
    const raw = {
      attachments_flow: [{ filename: 'a', time_c: 1 }],
      supp_file_workflow: [{ filename: 'b', time_c: 2 }]
    };
    const history = normalizeHistoryData(raw);
    expect(history.attachments_flow.map((e) => e.filename)).toEqual(['a', 'b']);
  });

  it('normalizes an array-of-entries open_close_dialog into a dialog-id map', () => {
    const raw = {
      open_close_dialog: [
        { dialog_id: 'D1', action: 'open', _session: 1 },
        { dialog_id: 'D2', action: 'open', _session: 1 }
      ]
    };
    const history = normalizeHistoryData(raw);
    expect(Object.keys(history.open_close_dialog).sort()).toEqual(['D1', 'D2']);
  });

  it('assigns _session as count-of-prior-opens+1 on open, and copies the nearest unclosed open on close', () => {
    let dialogMap = {};
    dialogMap = appendDialogActivity(dialogMap, { dialog_id: 'D1', action: 'open' });
    dialogMap = appendDialogActivity(dialogMap, { dialog_id: 'D1', action: 'close' });
    dialogMap = appendDialogActivity(dialogMap, { dialog_id: 'D1', action: 'open' });
    expect(dialogMap.D1[0]._session).toBe(1);
    expect(dialogMap.D1[1]._session).toBe(1);
    expect(dialogMap.D1[2]._session).toBe(2);
  });

  it('trims to newest 80% of each channel and folds a raw supp_file_workflow input', () => {
    const history = createEmptyHistory();
    history.query_quick_answer = Array.from({ length: 10 }, (_, i) => ({ info: `q${i}`, time_c: i }));
    history.supp_file_workflow = [{ filename: 'legacy1', time_c: 1 }, { filename: 'legacy2', time_c: 2 }];

    const trimmed = trimHistory(history, 0.8);
    expect(trimmed.query_quick_answer).toHaveLength(8);
    expect(trimmed.query_quick_answer[0].info).toBe('q2');
    expect(trimmed.attachments_flow.map((e) => e.filename)).toEqual(['legacy2']);
  });

  it('merges array channels on the composite signature, newer time_c wins', () => {
    const local = createEmptyHistory();
    local.attachments_flow = [{ filename: 'f1', process: 'upload', time_c: 5, time_iso: 'A' }];
    const server = createEmptyHistory();
    server.attachments_flow = [{ filename: 'f1', process: 'upload', time_c: 10, time_iso: 'B' }];

    const merged = mergeHistory(local, server);
    expect(merged.attachments_flow).toEqual([{ filename: 'f1', process: 'upload', time_c: 10, time_iso: 'B' }]);
  });

  it('merges open_close_dialog entries keyed on _session + action', () => {
    const local = createEmptyHistory();
    local.open_close_dialog = { D1: [{ action: 'open', _session: 1, time_c: 1 }] };
    const server = createEmptyHistory();
    server.open_close_dialog = { D1: [{ action: 'open', _session: 1, time_c: 1 }, { action: 'close', _session: 1, time_c: 5 }] };

    const merged = mergeHistory(local, server);
    expect(merged.open_close_dialog.D1.map((e) => e.action)).toEqual(['open', 'close']);
  });

  it('reports empty history when dialog map and tracked arrays are empty', () => {
    expect(isHistoryEmpty(createEmptyHistory())).toBe(true);
    const nonEmpty = createEmptyHistory();
    nonEmpty.insert_symbol = [{ info: 'x' }];
    expect(isHistoryEmpty(nonEmpty)).toBe(false);
  });

  it('computes serialized byte size', () => {
    expect(serializedByteSize(createEmptyHistory())).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/user-action/userActionHistory.test.js`
Expected: FAIL — `normalizeHistoryData` is not exported (current file exports `foldAliases`); `_session` assignment and merge-key assertions fail against the current implementation.

- [ ] **Step 3: Write minimal implementation**

Replace `src/services/user-action/userActionHistory.js` with:

```js
/**
 * User action history shape, normalize, merge, and trim (impactweb
 * UserActionRecord_Handler.js parity — field names time_c/time_iso, not timestamp).
 */

export const HISTORY_CHANNELS = [
  'open_close_dialog',
  'query_quick_answer',
  'insert_symbol',
  'video_tour',
  'guided_tour',
  'find_words',
  'replace_words',
  'attachments_flow'
];

const ARRAY_CHANNELS = HISTORY_CHANNELS.filter((channel) => channel !== 'open_close_dialog');

export function createEmptyHistory() {
  return {
    open_close_dialog: {},
    query_quick_answer: [],
    insert_symbol: [],
    video_tour: [],
    guided_tour: [],
    find_words: [],
    replace_words: [],
    attachments_flow: []
  };
}

function normalizeDialogGroupKey(update = {}) {
  return String(update.dialog_id || update.module_name || 'unknown').trim() || 'unknown';
}

function normalizeOpenCloseHistory(entries) {
  const grouped = {};
  (Array.isArray(entries) ? entries : []).forEach((entry) => {
    if (!entry || typeof entry !== 'object') return;
    const key = normalizeDialogGroupKey(entry);
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(entry);
  });
  return grouped;
}

/** Normalize a raw (possibly stringified) history blob: canonical channels + open_close_dialog shape + supp_file_workflow fold. */
export function normalizeHistoryData(raw) {
  const normalized = createEmptyHistory();
  let parsed = raw;

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      parsed = null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return normalized;

  HISTORY_CHANNELS.forEach((key) => {
    if (key === 'open_close_dialog') {
      if (Array.isArray(parsed[key])) {
        normalized[key] = normalizeOpenCloseHistory(parsed[key]);
      } else if (parsed[key] && typeof parsed[key] === 'object') {
        const openClose = {};
        Object.keys(parsed[key]).forEach((dialogId) => {
          if (Array.isArray(parsed[key][dialogId])) {
            openClose[dialogId] = parsed[key][dialogId];
          }
        });
        normalized[key] = openClose;
      }
    } else if (Array.isArray(parsed[key])) {
      normalized[key] = parsed[key];
    }
  });

  if (Array.isArray(parsed.supp_file_workflow) && parsed.supp_file_workflow.length) {
    normalized.attachments_flow = [...normalized.attachments_flow, ...parsed.supp_file_workflow];
  }

  return normalized;
}

function getTime(entry) {
  const raw = (entry && entry.time_c && entry.time_c.$numberLong) || (entry && entry.time_c) || 0;
  return parseInt(raw, 10) || 0;
}

function getEntryKey(entry) {
  const sessionId = (entry && entry._session) || 'no_session';
  const action = (entry && entry.action) || 'unknown';
  return `${sessionId}_${action}`;
}

function getArrayEntryKey(entry = {}, index = 0) {
  const t = getTime(entry);
  const signature = [
    t,
    entry.action || '',
    entry.process || '',
    entry.filename || '',
    entry.oldfilename || '',
    entry.dialog_id || '',
    entry._session || '',
    entry.time_iso || '',
    entry.info || ''
  ].join('|');
  if (signature === `${t}||||||||`) return `${t}|idx:${index}`;
  return signature;
}

function mergeByKey(localArr = [], serverArr = [], keyFn) {
  const map = new Map();
  localArr.forEach((entry, index) => {
    map.set(keyFn(entry, index), entry);
  });
  serverArr.forEach((entry, index) => {
    const key = keyFn(entry, index);
    const existing = map.get(key);
    if (!existing || getTime(entry) >= getTime(existing)) {
      map.set(key, entry);
    }
  });
  return [...map.values()].sort((a, b) => getTime(a) - getTime(b));
}

/** Merge local vs server history; newer time_c wins per entry key (mirrors impactweb mergeHistoryByTimestamp). */
export function mergeHistory(localHistory = createEmptyHistory(), serverHistory = createEmptyHistory()) {
  const merged = createEmptyHistory();

  const localOCD = localHistory.open_close_dialog || {};
  const serverOCD = serverHistory.open_close_dialog || {};
  const dialogKeys = new Set([...Object.keys(localOCD), ...Object.keys(serverOCD)]);
  dialogKeys.forEach((dialogKey) => {
    merged.open_close_dialog[dialogKey] = mergeByKey(localOCD[dialogKey], serverOCD[dialogKey], getEntryKey);
  });

  ARRAY_CHANNELS.forEach((key) => {
    merged[key] = mergeByKey(localHistory[key], serverHistory[key], getArrayEntryKey);
  });

  return merged;
}

export function serializedByteSize(history) {
  return new TextEncoder().encode(JSON.stringify(history)).length;
}

/** Keep newest `ratio` share of each channel; also folds a raw supp_file_workflow present on the input group. */
export function trimHistory(history, ratio) {
  const trimmed = createEmptyHistory();

  Object.keys(history.open_close_dialog || {}).forEach((dialogKey) => {
    const entries = history.open_close_dialog[dialogKey] || [];
    const keep = Math.ceil(entries.length * ratio);
    trimmed.open_close_dialog[dialogKey] = entries.slice(-keep);
  });

  ARRAY_CHANNELS.forEach((key) => {
    const entries = history[key] || [];
    const keep = Math.ceil(entries.length * ratio);
    trimmed[key] = entries.slice(-keep);
  });

  if (Array.isArray(history.supp_file_workflow) && history.supp_file_workflow.length) {
    const legacyEntries = history.supp_file_workflow;
    const keep = Math.ceil(legacyEntries.length * ratio);
    trimmed.attachments_flow = [...trimmed.attachments_flow, ...legacyEntries.slice(-keep)];
  }

  return trimmed;
}

function getLatestOpenSession(entries = []) {
  const closedSessions = new Set();
  for (let index = entries.length - 1; index >= 0; index--) {
    const entry = entries[index] || {};
    if (entry.action === 'close' && entry._session != null) {
      closedSessions.add(entry._session);
      continue;
    }
    if (entry.action === 'open' && entry._session != null && !closedSessions.has(entry._session)) {
      return entry;
    }
  }
  return null;
}

/**
 * Bucket open_close_dialog entries by dialog_id||module_name.
 * open: _session = (count of prior 'open' entries in this bucket) + 1.
 * close: _session = the nearest prior unclosed open's _session (walk backward, skip closed sessions).
 */
export function appendDialogActivity(dialogMap = {}, update = {}) {
  const dialogKey = normalizeDialogGroupKey(update);
  const next = { ...dialogMap };
  const sessions = [...(next[dialogKey] || [])];
  const entry = { ...update };

  if (entry.action === 'open') {
    entry._session = sessions.filter((e) => e && e.action === 'open').length + 1;
  } else if (entry.action === 'close') {
    const lastOpen = getLatestOpenSession(sessions);
    entry._session = lastOpen ? lastOpen._session : null;
  }

  sessions.push(entry);
  next[dialogKey] = sessions;
  return next;
}

export function isHistoryEmpty(history) {
  const dialogEmpty = Object.keys(history?.open_close_dialog || {}).length === 0;
  const arraysEmpty = ['query_quick_answer', 'insert_symbol', 'attachments_flow'].every(
    (channel) => !(history?.[channel] || []).length
  );
  return dialogEmpty && arraysEmpty;
}
```

- [ ] **Step 4: Run tests and make sure they pass**

Run: `npm run test:unit -- tests/unit/user-action/userActionHistory.test.js`
Expected: PASS (8 tests)

---

### Task 3: User-action service — per-channel routing, invoke(), legacy tracker shapes

**Files:**
- Modify: `src/services/user-action/userActionService.js`
- Modify: `tests/unit/user-action/userActionService.test.js`

**Interfaces:**
- Consumes: Task 2 exports, `apiService.getAdminDocs`, `apiService.makeRequest`, `API_ENDPOINTS.FIND_UPDATE_INSERT`, `API_ENDPOINTS.UPDATE_INSERT`, `getDefaultMainBag()`, `getDocId()`, `getUserInfo()`, `getWindowRef()`, `errorLogTrace(module, message)` (from `src/services/error/errorLogTrace.js`)
- Produces: `createUserActionService()` → `{ history, load, invoke, payLoad, updateActivity, fetchAndMerge, syncUserActionHistory({keepalive}), trackDialogOpenClose(action, options), trackAttachmentsFlow(update), trackSuppFileWorkflow(update) }`

- [ ] **Step 1: Write the failing test**

Replace `tests/unit/user-action/userActionService.test.js` with:

```js
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../src/services/api/apiService.js', () => ({
  apiService: {
    getAdminDocs: vi.fn().mockResolvedValue({ data: [] }),
    makeRequest: vi.fn().mockResolvedValue({ r: 1 })
  },
  API_ENDPOINTS: {
    GET_ADMINDOCS: '/api/getadmindocs',
    FIND_UPDATE_INSERT: '/api/findupdateorinsert',
    UPDATE_INSERT: '/api/updateorinsert'
  }
}));

import { apiService } from '../../../src/services/api/apiService.js';
import { createUserActionService } from '../../../src/services/user-action/userActionService.js';

function installWindowState({ search = '?docid=DOC1' } = {}) {
  window.DOC_ID = 'DOC1';
  window.SHARED_KEY = { docid: 'DOC1' };
  window.USER_INFO = { MAIL_ID: 'user@example.com', TRACK_ROLE_NAME: 'Editor' };
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { search, pathname: '/editor', hostname: 'localhost' }
  });
}

describe('userActionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    installWindowState();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('persists activity under xmleditor:user_action_history:{docid} using the query-string docid', () => {
    const service = createUserActionService();
    service.trackDialogOpenClose('open', { dialog_id: 'D1' });
    const raw = localStorage.getItem('xmleditor:user_action_history:DOC1');
    expect(raw).toBeTruthy();
    expect(JSON.parse(raw).open_close_dialog.D1[0].action).toBe('open');
  });

  it('payLoad().find.docid comes from the global doc id, independent of the localStorage key docid', () => {
    const service = createUserActionService();
    expect(service.payLoad().find.docid).toBe('DOC1');
    expect(service.payLoad().find.username).toBe('user@example.com');
    expect(service.payLoad().find.rolename).toBe('Editor');
  });

  it('trackDialogOpenClose stamps time_c/time_iso and legacy dialog fields', () => {
    const service = createUserActionService();
    service.trackDialogOpenClose('open', { dialog_id: 'D1', remark: 'find dialog' });
    const entry = service.history.open_close_dialog.D1[0];
    expect(entry).toMatchObject({ action: 'open', dialog_id: 'D1', remark: 'find dialog', _session: 1 });
    expect(typeof entry.time_c).toBe('number');
    expect(typeof entry.time_iso).toBe('string');
  });

  it('trackAttachmentsFlow builds the legacy filename/process/status payload', () => {
    const service = createUserActionService();
    service.trackAttachmentsFlow({ filename: 'a.pdf', process: 'upload', status: 'done' });
    const entry = service.history.attachments_flow[0];
    expect(entry).toMatchObject({
      filename: 'a.pdf',
      oldfilename: '',
      username: 'user@example.com',
      role: 'Editor',
      process: 'upload',
      status: 'done'
    });
  });

  it('skips sync when dialog map and tracked arrays are empty', async () => {
    const service = createUserActionService();
    await service.syncUserActionHistory();
    expect(apiService.makeRequest).not.toHaveBeenCalled();
  });

  it('syncs open_close_dialog activity via FIND_UPDATE_INSERT', async () => {
    const service = createUserActionService();
    service.trackDialogOpenClose('open', { dialog_id: 'D1' });
    await service.syncUserActionHistory();
    expect(apiService.makeRequest).toHaveBeenCalledWith(
      '/api/findupdateorinsert',
      expect.objectContaining({ tbl: 'UserPreference' }),
      {}
    );
  });

  it('syncs guided_tour activity via UPDATE_INSERT (not FIND_UPDATE_INSERT)', async () => {
    const service = createUserActionService();
    service.invoke('guided_tour');
    service.updateActivity('guided_tour', { step: 1 });
    // guided_tour is ignore_local_storage — force non-empty history via attachments_flow so the empty-history guard doesn't skip.
    service.trackAttachmentsFlow({ filename: 'a.pdf' });
    await service.syncUserActionHistory();
    expect(apiService.makeRequest).toHaveBeenCalledWith('/api/updateorinsert', expect.anything(), {});
  });

  it('does not persist ignore_local_storage channels (video_tour, guided_tour) to localStorage', () => {
    const service = createUserActionService();
    service.invoke('guided_tour');
    service.updateActivity('guided_tour', { step: 1 });
    expect(service.history.guided_tour).toEqual([]);
  });

  it('ignores Failed to fetch / NetworkError during keepalive unload sync', async () => {
    apiService.makeRequest.mockRejectedValueOnce(new TypeError('NetworkError when attempting to fetch resource'));
    const service = createUserActionService();
    service.trackAttachmentsFlow({ filename: 'a.pdf' });
    await expect(service.syncUserActionHistory({ keepalive: true })).resolves.toBeUndefined();
  });

  it('drops a concurrent syncUserActionHistory call while one is in flight', async () => {
    let resolveRequest;
    apiService.makeRequest.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve;
      })
    );
    const service = createUserActionService();
    service.trackAttachmentsFlow({ filename: 'a.pdf' });

    const first = service.syncUserActionHistory();
    const second = service.syncUserActionHistory();
    resolveRequest({ r: 1 });
    await Promise.all([first, second]);

    expect(apiService.makeRequest).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- tests/unit/user-action/userActionService.test.js`
Expected: FAIL — `trackDialogOpenClose('open', { dialog_id: 'D1' })` doesn't match the current `(dialogId, action, extra)` signature; `invoke`/`payLoad` are not exported; `guided_tour` doesn't route to `UPDATE_INSERT`.

- [ ] **Step 3: Write minimal implementation**

Replace `src/services/user-action/userActionService.js` with:

```js
import { apiService, API_ENDPOINTS } from '../api/apiService.js';
import { getDefaultMainBag, getDocId, getUserInfo, getWindowRef } from '../error/errorContext.js';
import { errorLogTrace } from '../error/errorLogTrace.js';
import {
  appendDialogActivity,
  createEmptyHistory,
  isHistoryEmpty,
  mergeHistory,
  normalizeHistoryData,
  serializedByteSize,
  trimHistory
} from './userActionHistory.js';

const RECORD_TYPE = 'user_action_history';
const MAX_BYTES = 4.5 * 1024 * 1024;
const RETRY_DELAY_MS = 2000;
const UNLOAD_ERROR_PATTERN = /NetworkError|Failed to fetch|Load failed/i;

function createRecordInfo(key, { addSessionId = false, ignoreLocalStorage = false, endpoint = API_ENDPOINTS.FIND_UPDATE_INSERT } = {}) {
  return {
    primary_key: key,
    ignore_local_storage: ignoreLocalStorage,
    set_endpoint: endpoint,
    add_in_find: addSessionId ? ['session_id'] : []
  };
}

const RECORD_INFO = {
  open_close_dialog: createRecordInfo('open_close_dialog', { addSessionId: true }),
  query_quick_answer: createRecordInfo('query_quick_answer'),
  insert_symbol: createRecordInfo('insert_symbol'),
  find_words: createRecordInfo('find_words'),
  replace_words: createRecordInfo('replace_words'),
  attachments_flow: createRecordInfo('attachments_flow'),
  video_tour: createRecordInfo('video_tour', { addSessionId: true, ignoreLocalStorage: true }),
  guided_tour: createRecordInfo('guided_tour', {
    addSessionId: true,
    ignoreLocalStorage: true,
    endpoint: API_ENDPOINTS.UPDATE_INSERT
  })
};

function storageKey(docid) {
  return `xmleditor:${RECORD_TYPE}:${docid || 'no-docid'}`;
}

function resolveDocIdFromQuery() {
  const win = getWindowRef();
  const params = new URLSearchParams(win?.location?.search || '');
  return params.get('docid') || '';
}

function isIgnorableUnloadError(err, keepalive) {
  if (!keepalive) return false;
  return err instanceof TypeError || UNLOAD_ERROR_PATTERN.test(err?.message || '');
}

export function createUserActionService() {
  let history = createEmptyHistory();
  let currentDocId = 'no-docid';
  let currentChannel = RECORD_INFO.open_close_dialog;
  let isSyncing = false;
  let retryTimer = null;

  function readFromStorage(docid) {
    try {
      const raw = localStorage.getItem(storageKey(docid));
      return raw ? normalizeHistoryData(JSON.parse(raw)) : createEmptyHistory();
    } catch {
      return createEmptyHistory();
    }
  }

  function writeToStorage() {
    try {
      if (serializedByteSize(history) > MAX_BYTES) {
        history = trimHistory(history, 0.8);
      }
      localStorage.setItem(storageKey(currentDocId), JSON.stringify(history));
    } catch (err) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22) {
        history = trimHistory(history, 0.5);
        try {
          localStorage.setItem(storageKey(currentDocId), JSON.stringify(history));
        } catch (retryErr) {
          errorLogTrace('UPDATE_LOCAL_STORAGE_TRIM', retryErr?.message || String(retryErr));
        }
      } else {
        errorLogTrace('UPDATE_LOCAL_STORAGE', err?.message || String(err));
      }
    }
  }

  function load() {
    const docid = resolveDocIdFromQuery();
    if (!docid) {
      currentDocId = 'no-docid';
      if (!retryTimer) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          load();
        }, RETRY_DELAY_MS);
      }
      return;
    }
    currentDocId = docid;
    history = readFromStorage(currentDocId);
  }

  function invoke(channelKey) {
    if (RECORD_INFO[channelKey]) {
      currentChannel = RECORD_INFO[channelKey];
    }
    return currentChannel;
  }

  function updateActivity(channelKey, update = {}) {
    const channel = channelKey ? invoke(channelKey) : currentChannel;
    if (channel.ignore_local_storage) return;

    const key = channel.primary_key;
    if (key === 'open_close_dialog') {
      history.open_close_dialog = appendDialogActivity(history.open_close_dialog, update);
    } else {
      if (!Array.isArray(history[key])) history[key] = [];
      history[key].push(update);
    }
    writeToStorage();
  }

  function payLoad() {
    const bag = getDefaultMainBag();
    return {
      tbl: 'UserPreference',
      find: {
        recordtype: RECORD_TYPE,
        username: bag.username,
        docid: getDocId(),
        rolename: bag.rolename,
        session_id: bag.session_id
      }
    };
  }

  async function fetchAndMerge() {
    try {
      const response = await apiService.getAdminDocs(payLoad());
      if (response?.data?.length) {
        const raw = response.data[0];
        const serverHistory = normalizeHistoryData(raw.history || raw);
        history = mergeHistory(history, serverHistory);
        writeToStorage();
      }
    } catch (err) {
      errorLogTrace('FETCH_DB', err?.message || String(err));
    }
    return history;
  }

  async function syncUserActionHistory({ keepalive = false } = {}) {
    if (isSyncing) return;
    if (isHistoryEmpty(history)) return;

    isSyncing = true;
    try {
      const bag = getDefaultMainBag();
      const json = {
        ...payLoad(),
        update: {
          recordtype: RECORD_TYPE,
          history,
          ...bag
        }
      };
      const endpoint = currentChannel.set_endpoint || API_ENDPOINTS.FIND_UPDATE_INSERT;
      const requestOptions = keepalive ? { keepalive: true } : {};

      await apiService.makeRequest(endpoint, json, requestOptions);
    } catch (err) {
      if (!isIgnorableUnloadError(err, keepalive)) {
        errorLogTrace('syncUserActionHistory', err?.message || String(err));
      }
    } finally {
      isSyncing = false;
    }
  }

  function trackDialogOpenClose(action, options = {}) {
    const now = options.timestamp instanceof Date ? options.timestamp : new Date();
    const dialogId = String(options.dialog_id || options.remark || 'unknown').trim() || 'unknown';
    const info = Object.prototype.hasOwnProperty.call(options, 'info')
      ? options.info
      : options.isDirectClose ? 'without any update' : '';

    updateActivity('open_close_dialog', {
      action,
      remark: options.remark || dialogId,
      info,
      dialog_id: dialogId,
      durationMs: typeof options.durationMs === 'number' ? Math.max(0, Math.round(options.durationMs)) : null,
      isDirectClose: !!options.isDirectClose,
      time_c: now.getTime(),
      time_iso: now.toISOString()
    });
  }

  function trackAttachmentsFlow(update = {}) {
    const now = update.timestamp instanceof Date ? update.timestamp : new Date();
    const user = getUserInfo();
    updateActivity('attachments_flow', {
      filename: update.filename || '',
      oldfilename: update.oldfilename || '',
      username: update.username || user.MAIL_ID,
      role: update.role || user.TRACK_ROLE_NAME,
      process: update.process || '',
      existing_payload: update.existing_payload || null,
      status: update.status || '',
      time_c: now.getTime(),
      time_iso: now.toISOString()
    });
  }

  function trackSuppFileWorkflow(update = {}) {
    return trackAttachmentsFlow(update);
  }

  load();
  invoke('open_close_dialog');

  return {
    get history() {
      return history;
    },
    load,
    invoke,
    payLoad,
    updateActivity,
    fetchAndMerge,
    syncUserActionHistory,
    trackDialogOpenClose,
    trackAttachmentsFlow,
    trackSuppFileWorkflow
  };
}
```

- [ ] **Step 4: Run tests and make sure they pass**

Run: `npm run test:unit -- tests/unit/user-action/userActionService.test.js`
Expected: PASS (10 tests)

- [ ] **Step 5: Run the full user-action + upload + error suite**

Run: `npm run test:unit -- tests/unit/user-action tests/unit/upload tests/unit/error`
Expected: PASS — confirms `src/services/error/index.js`'s `userActionService.load()` call still resolves (no import/signature break) and `errorLogTrace` import doesn't create a cycle back into `services/error`.

---

### Task 4: Docs and full regression

**Files:**
- Modify: `src/services/user-action/README.md`
- Modify: `src/services/user-action/skills.md`

- [ ] **Step 1:** In `src/services/user-action/README.md`, replace the `Key files` section with:

```markdown
## Key files
- `userActionHistory.js` — empty history shape, `normalizeHistoryData` (alias fold + open_close_dialog shape normalize), composite-key merge, trim
- `userActionService.js` — `createUserActionService()`: per-channel `RECORD_INFO` routing (`guided_tour` syncs via `UPDATE_INSERT`, the rest via `FIND_UPDATE_INSERT`), `invoke(channel)`, localStorage load/save, `getadmindocs` fetch + merge, `findupdateorinsert`/`updateorinsert` sync with an `isSyncing` reentrancy guard
- `index.js` — singleton `userActionService`, `initUserActionSync()` (beforeunload/pagehide keepalive sync)
```

- [ ] **Step 2:** In `src/services/user-action/skills.md`, replace the "Do" list with:

```markdown
## Do
- Read/write `xmleditor:user_action_history:{docid}` — this docid comes from `URLSearchParams`, falling back to `no-docid` with a retry after 2s once one becomes available. `payLoad().find.docid` is a **different** docid source (`getDocId()` / the global `window.DOC_ID`) — do not conflate the two.
- Stamp every tracked entry with `time_c` (epoch ms) and `time_iso` (ISO string) — never a generic `timestamp` field; the merge algorithm reads `time_c`.
- Call `trackDialogOpenClose(action, options)` and `trackAttachmentsFlow(update)` with the legacy parameter shapes — not `(dialogId, action, extra)`.
- Route `guided_tour` activity through `UPDATE_INSERT`, not `FIND_UPDATE_INSERT` — every other channel uses `FIND_UPDATE_INSERT`.
- Skip `syncUserActionHistory()` when the dialog map and tracked arrays (`query_quick_answer`, `insert_symbol`, `attachments_flow`) are all empty, and when a sync is already in flight (`isSyncing` guard).
- Pass `{ keepalive: true }` for unload-time syncs and swallow `TypeError` / `/NetworkError|Failed to fetch|Load failed/i`.
- Trim to newest 80% per channel once serialized size exceeds ~4.5 MB; on `QuotaExceededError`, trim to 50% and retry the write once.
- Report failures via `errorLogTrace(module, message)`, matching legacy's `ErrorLogTrace(...)` calls.
```

- [ ] **Step 3: Run the full unit suite**

Run: `npm run test:unit`
Expected: Same pass/fail profile as the prior plan run (217+ passed; only the pre-existing, unrelated `tests/unit/link_session/` failures — reproduced independently of this branch's changes — remain).

- [ ] **Step 4: Commit** (only if the user has asked for commits this session)

```bash
git add src/services/upload/fileUploadService.js tests/unit/upload/fileUploadService.test.js \
  src/services/user-action/userActionHistory.js tests/unit/user-action/userActionHistory.test.js \
  src/services/user-action/userActionService.js tests/unit/user-action/userActionService.test.js \
  src/services/upload/README.md src/services/upload/skills.md \
  src/services/user-action/README.md src/services/user-action/skills.md
git commit -m "fix: match file upload and user-action services to current impactweb source contracts"
```

---

## Spec coverage

| Legacy behavior | Task |
|---|---|
| `FileUploadModule` headers, order, `sanitizeAttachmentData`, repeated-field FormData, size gates | 1 |
| `createFormData` partial-upload bug fix | 1 |
| `time_c`/`time_iso` field names | 2 |
| `normalizeHistoryData` / `normalizeOpenCloseHistory` | 2 |
| Composite merge keys (`getEntryKey`, `getArrayEntryKey`) | 2 |
| Count-based `_session` open / nearest-unclosed-open on close | 2 |
| Per-channel `record_info` routing (`guided_tour` → `UPDATE_INSERT`) | 3 |
| `payLoad()` global docid vs localStorage-key query-string docid split | 3 |
| `trackDialogOpenClose(action, options)` / `trackAttachmentsFlow(update)` shapes | 3 |
| `_isSyncing` reentrancy guard | 3 |
| Broadened unload-error pattern | 3 |
| `errorLogTrace` wiring on failure paths | 3 |
| Docs | 4 |

## Placeholder scan

No TBD. All code blocks are complete, runnable implementations and tests.

## Type consistency

- `sanitizeAttachmentData` (Task 1) is the same name/shape used nowhere else — the earlier `sanitizeFileArrays` name is fully replaced, not aliased.
- `normalizeHistoryData` (Task 2) replaces `foldAliases` everywhere, including inside `userActionService.js` (Task 3) — no leftover references to `foldAliases`.
- `appendDialogActivity(dialogMap, update)`, `mergeHistory(local, server)`, `trimHistory(history, ratio)`, `isHistoryEmpty(history)`, `serializedByteSize(history)` keep their Task-2-defined names and signatures when used in Task 3.
- `trackDialogOpenClose(action, options)` / `trackAttachmentsFlow(update)` (Task 3) are the only entry points other code should call — `updateActivity(channelKey, update)` stays available for direct/advanced use (e.g. `guided_tour`) but channel-specific trackers are preferred.
