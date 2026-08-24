# user-action service skills

Use when editing `src/services/user-action/` or wiring dialog/tour/find/replace/attachment tracking.

## Do
- Read/write `xmleditor:user_action_history:{docid}` — this docid comes from `URLSearchParams`, falling back to `no-docid` with a retry after 2s once one becomes available. `payLoad().find.docid` is a **different** docid source (`getDocId()` / the global `window.DOC_ID`) — do not conflate the two.
- Stamp every tracked entry with `time_c` (epoch ms) and `time_iso` (ISO string) — never a generic `timestamp` field; the merge algorithm reads `time_c`.
- Call `trackDialogOpenClose(action, options)` and `trackAttachmentsFlow(update)` with the legacy parameter shapes — not `(dialogId, action, extra)`.
- Route `guided_tour` activity through `UPDATE_INSERT`, not `FIND_UPDATE_INSERT` — every other channel uses `FIND_UPDATE_INSERT`.
- Skip `syncUserActionHistory()` when the dialog map and tracked arrays (`query_quick_answer`, `insert_symbol`, `attachments_flow`) are all empty, and when a sync is already in flight (`isSyncing` guard).
- Pass `{ keepalive: true }` for unload-time syncs and swallow `TypeError` / `/NetworkError|Failed to fetch|Load failed/i`.
- Trim to newest 80% per channel once serialized size exceeds ~4.5 MB; on `QuotaExceededError`, trim to 50% and retry the write once.
- Report failures via `errorLogTrace(module, message)`, matching legacy's `ErrorLogTrace(...)` calls.

## Do not
- Wire this service into figures/query/dialogs/tours in this plan — only the service and its exported trackers exist; call sites are a separate task.
- Bypass `getDefaultMainBag()` for `username`/`rolename`/`session_id` — reuse the same session-bag helper as `services/error`.
- Call the live `getadmindocs`/`findupdateorinsert` endpoints from tests; stub `apiService`.

## Related
- Parent: [../README.md](../README.md)
- Sibling: [../error/skills.md](../error/skills.md) (`initErrorOps()` loads this service)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
