# download services

## Purpose / ownership
Cross-feature download orchestration: help PDFs, workflow PDF/XML, zip packages, and the legacy `window.iDownloadMethod` bridge.

## Key files
- `downloadConfig.js` — action catalog and constants
- `downloadPayloads.js` — zip/file-list/record payload builders
- `downloadContext.js` — SHARED_KEY / DOC_ID / role helpers
- `downloadAlerts.js` — editor message / toast mapping
- `WorkflowDownloadService.js` — port of legacy `WorkflowDownloadModule`
- `downloadBridge.js` — `window.iDownloadMethod` sync
- `index.js` — singleton, `initDownloadService()`, `downloadClick()`, `getDownloadRequest()`

## Dependencies
- `services/api/apiService.js` (`FILE_DOWNLOAD`, `ZIP_DOWNLOAD`, `GET_DOCS`, `UPDATE_INSERT`)
- `features/editor/messages` for success/fail/popup-blocker alerts
- Window globals set by core init: `SHARED_KEY`, `DOC_ID`, `USER_INFO`, `BUCKET_URL`

## Status
**active**
