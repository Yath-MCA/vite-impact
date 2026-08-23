# landing service skills

Use when editing `src/services/landing/`.

## Do
- Keep browser, branding, and maintenance checks in this folder.
- Call `initMaintenance` from the landing page boot path only.

## Do not
- Commit editor session storage from this folder.
- Duplicate link-share check logic (that lives in `services/session`).

## Related
- Parent: [../README.md](../README.md)
- Feature: [../../features/landing/README.md](../../features/landing/README.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
