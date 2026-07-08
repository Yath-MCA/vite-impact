# utils skills

Use when editing `src/utils/`.

## Do
- Keep changes in this folder's responsibility.
- Update this README key-files list when adding important files.
- Prefer feature-MVC placement rules in `docs/FEATURE_MVC_STRUCTURE.md`.

## Do not
- Invent parallel ownership in another tree without documenting status.
- Break stable routes (`/validateurl`, `/editor`, `/login`, `/config-manager`).

## Workflows
1. Keep utils pure and tested under tests/unit/utils when logic-heavy.
2. Domain IO stays in services.
3. Document new exports in README.

## Related
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)
- [src/README.md](../README.md)
