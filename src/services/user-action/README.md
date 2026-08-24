# user-action services

## Purpose / ownership
Dialog/tour/find/replace/attachment activity history: localStorage persistence, `UserPreference` fetch/sync. Bound from `services/error`'s `initErrorOps()`.

## Key files
- `userActionHistory.js` — empty history shape, `normalizeHistoryData` (alias fold + open_close_dialog shape normalize), composite-key merge, trim
- `userActionService.js` — `createUserActionService()`: per-channel `RECORD_INFO` routing (`guided_tour` syncs via `UPDATE_INSERT`, the rest via `FIND_UPDATE_INSERT`), `invoke(channel)`, localStorage load/save, `getadmindocs` fetch + merge, `findupdateorinsert`/`updateorinsert` sync with an `isSyncing` reentrancy guard
- `index.js` — singleton `userActionService`, `initUserActionSync()` (beforeunload/pagehide keepalive sync)

## Dependencies
- `services/api/apiService.js` (`GET_ADMINDOCS`, `FIND_UPDATE_INSERT`)
- `services/error/errorContext.js` (`getDefaultMainBag()` for `username`/`rolename`/`session_id`)
- Window globals: `DOC_ID`, `SHARED_KEY`, `USER_INFO`; `docid` query param

## Status
**active** — call sites (figures, query, tours, dialogs) are out of scope; only the service and its exported `trackDialogOpenClose` / `trackAttachmentsFlow` / `trackSuppFileWorkflow` helpers exist.
