# pages skills

Use when editing `src/pages/`.

## Do
- Keep changes in this folder's responsibility.
- Update this README key-files list when adding important files.
- Prefer feature-MVC placement rules in `docs/FEATURE_MVC_STRUCTURE.md`.

## Do not
- Invent parallel ownership in another tree without documenting status.
- Break stable routes (`/validateurl`, `/editor`, `/login`, `/config-manager`).

## Workflows
1. Never add new product pages here.
2. Point AppRouter at `features/*/pages`.
3. Keep re-exports only for backwards imports.
4. Legacy unused pages: migrate to features or delete in a cleanup pass.

## Related
- [skills.md](./skills.md)
- Features: [../features/README.md](../features/README.md)
