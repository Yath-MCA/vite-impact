# core skills

Use when editing `src/core/`.

## Do
- Keep changes in this folder's responsibility.
- Update this README key-files list when adding important files.
- Prefer feature-MVC placement rules in `docs/FEATURE_MVC_STRUCTURE.md`.

## Do not
- Invent parallel ownership in another tree without documenting status.
- Break stable routes (`/validateurl`, `/editor`, `/login`, `/config-manager`).

## Workflows
1. Register stable routes in AppRouter.
2. Keep feature routes lazy-loaded from `features/`.
3. Prefer `core/providers` as the documented import path going forward.
4. Watch layout duplication vs `components/layout`.

## Related
- [skills.md](./skills.md)
- Features README, Components layout README
