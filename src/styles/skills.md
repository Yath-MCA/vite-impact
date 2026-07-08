# styles skills

Use when editing `src/styles/`.

## Do
- Keep changes in this folder's responsibility.
- Update this README key-files list when adding important files.
- Prefer feature-MVC placement rules in `docs/FEATURE_MVC_STRUCTURE.md`.

## Do not
- Invent parallel ownership in another tree without documenting status.
- Break stable routes (`/validateurl`, `/editor`, `/login`, `/config-manager`).

## Workflows
1. Prefer Tailwind utility classes in components when consistent with app.
2. Shared CSS only for true cross-cutting styles.
3. Avoid duplicating client theme CSS already under assets.

## Related
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)
- [src/README.md](../README.md)
