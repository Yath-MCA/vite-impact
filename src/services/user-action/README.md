# user-action services

## Purpose / ownership
Dialog/tour/find/replace/attachment activity history: localStorage persistence, `UserPreference` fetch/sync. Bound from `services/error`'s `initErrorOps()`.

## Key files
- `userActionHistory.js` — empty history shape, alias fold (`supp_file_workflow` → `attachments_flow`), merge, trim
- `userActionService.js` — `createUserActionService()`: localStorage load/save, `getadmindocs` fetch + merge, `findupdateorinsert` sync
- `index.js` — singleton `userActionService`, `initUserActionSync()` (beforeunload/pagehide keepalive sync)

## Dependencies
- `services/api/apiService.js` (`GET_ADMINDOCS`, `FIND_UPDATE_INSERT`)
- `services/error/errorContext.js` (`getDefaultMainBag()` for `username`/`rolename`/`session_id`)
- Window globals: `DOC_ID`, `SHARED_KEY`, `USER_INFO`; `docid` query param

## Status
**active** — call sites (figures, query, tours, dialogs) are out of scope; only the service and its exported `trackDialogOpenClose` / `trackAttachmentsFlow` / `trackSuppFileWorkflow` helpers exist.
