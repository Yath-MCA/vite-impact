# download service skills

Use when editing `src/services/download/` or adding a download from any page/component.

## Do
- Import `downloadService` / `downloadClick` / `getDownloadRequest` from `services/download` in React code.
- Call `initDownloadService()` once from editor and landing boot so `window.iDownloadMethod` exists for legacy HTML.
- Prefer `downloadClick` for left-click. Use `getDownloadRequest` only to hydrate `href` after Init (middle-click / copy-link).
- Keep URL building and zip payloads in this folder; do not duplicate `filedownload` query strings in features.
- Use existing editor message keys (`fileDownloadSuccess`, `fileDownloadFail`, `PopupBlocker_New`).

## Do not
- Add a second download client in a feature folder.
- Rewrite message HTML `javascript:iDownloadMethod.click(...)` links until the bridge is no longer needed.
- Put React spinner UI in this service; DOM `menu_id` spinners stay here for toolbar parity.

## Related
- Parent: [../README.md](../README.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
