# landing service skills

Use when editing `src/services/landing/`.

## Do
- Keep browser, branding, and maintenance schedule/toast logic in this folder.
- Call `initMaintenance({ init: true })` then `fireMaintenanceAlert()` from landing boot after the browser check.
- Treat `ON` as an upcoming window (start and end still in the future), not a hard outage block.

## Do not
- Commit editor session storage from this folder.
- Duplicate link-share check logic (that lives in `services/session`).

## Related
- Parent: [../README.md](../README.md)
- Feature: [../../features/landing/README.md](../../features/landing/README.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
