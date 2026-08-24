# error services

## Purpose / ownership
Error mail compose, ErrorLogs read/write, subject Map, `ErrorLogTrace` bridge, and `initErrorOps()`. Cross-feature: landing Validate URL and editor both boot this beside `initDownloadService()`.

## Key files
- `errorContext.js` — session bags (`getDefaultDocBag`), host/domain flags
- `errorMailConfig.js` — encoded Error_Mail from/to/bcc; template id; `getSenderReceiverIds()`
- `errorMailHtml.js` — `buildMailTableHtml`, `formatStackHtml`
- `errorSubjectMap.js` — 5-entry Map persist `xmleditor:{docId}:ErrorList`
- `errorVisitThrottle.js` — `visitData_` meta-error skip
- `errorLogsApi.js` — ErrorLogs `updateorinsert` / `getdocs` (length 10)
- `errorMailService.js` — `shareErrorMail`, `sendMailIfAllowed`
- `errorLogTrace.js` — `errorLogTrace(module, message)`
- `errorBridge.js` — `window.ErrorLogTrace`
- `index.js` — `initErrorOps()`, `resetErrorOps()`

## Dependencies
- `services/api/apiService.js` (`UPDATE_INSERT`, `GET_DOCS`, `GENERIC_SEND_MAIL` / `sendEmail`)
- Window globals: `SHARED_KEY`, `DOC_ID`, `USER_INFO`, `IS_LIVE_DOMAIN`, `IS_UAT_DOMAIN`, `IS_LOCAL_HOST`, `CanSendLocalMail`

## Status
**active** — `initErrorOps()` also loads `services/user-action` history and binds its unload sync.
