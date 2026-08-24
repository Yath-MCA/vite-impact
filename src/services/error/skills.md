# error service skills

Use when editing `src/services/error/` or sending ErrorLogs / error mail from any page.

## Do
- Import `initErrorOps` / `errorLogTrace` / `shareErrorMail` from `services/error`.
- Call `initErrorOps()` once from editor and landing boot so `window.ErrorLogTrace` exists for leftover HTML.
- Look up ErrorLogs with `apiService.makeRequest(API_ENDPOINTS.GET_DOCS, payload)` and `length: 10`. Do not use `apiService.getDocs` (it forces length 2500).
- Keep `MAIL_DETAIL.Error_Mail` values encoded; decode with `atob` in `getSenderReceiverIds()`.
- Use template id `610a4cd05e311ebaf978ef78` for both normal and meta-error mail.

## Do not
- Assign a second window global besides `ErrorLogTrace`.
- Hard-code decoded mail addresses in feature code.
- Walk `fn.caller` for stacks — use `new Error().stack`.
- Call `initErrorOps` from this folder's tests against live mail APIs; stub `apiService`.

## Related
- Parent: [../README.md](../README.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
