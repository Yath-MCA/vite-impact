# user-action service skills

Use when editing `src/services/user-action/` or wiring dialog/tour/find/replace/attachment tracking.

## Do
- Read/write `xmleditor:user_action_history:{docid}` — docid comes from `URLSearchParams`, falling back to `no-docid` with a retry after 2s once a docid becomes available.
- Fold `supp_file_workflow` into `attachments_flow` on every load/merge — do not treat it as a ninth channel.
- Skip `syncUserActionHistory()` when the dialog map and tracked arrays (`query_quick_answer`, `insert_symbol`, `attachments_flow`) are all empty.
- Pass `{ keepalive: true }` for unload-time syncs and swallow `TypeError` / "Failed to fetch".
- Trim to newest 80% per channel once serialized size exceeds ~4.5 MB; on `QuotaExceededError`, trim to 50% and retry the write once.

## Do not
- Wire this service into figures/query/dialogs/tours in this plan — only the service and its exported trackers exist; call sites are a separate task.
- Bypass `getDefaultMainBag()` for `username`/`rolename`/`session_id` — reuse the same session-bag helper as `services/error`.
- Call the live `getadmindocs`/`findupdateorinsert` endpoints from tests; stub `apiService`.

## Related
- Parent: [../README.md](../README.md)
- Sibling: [../error/skills.md](../error/skills.md) (`initErrorOps()` loads this service)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
