# services skills

Use when editing `src/services/`.

## Do
- Keep changes in this folder's responsibility.
- Update this README key-files list when adding important files.
- Prefer feature-MVC placement rules in `docs/FEATURE_MVC_STRUCTURE.md`.

## Do not
- Invent parallel ownership in another tree without documenting status.
- Break stable routes (`/validateurl`, `/editor`, `/login`, `/config-manager`).

## Workflows
1. Add domain folder or extend existing (`api`, `session`, …).
2. Keep payload builders next to domain (`sessionPayloads`) or feature adapters.
3. Do not put React UI in services.
4. Add README/skills for new domains; update index.

## Related
- [skills.md](./skills.md)
- Session: [./session/](./session/)
- Download: [./download/](./download/)
- Error: [./error/](./error/)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)
