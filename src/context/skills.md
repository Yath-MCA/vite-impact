# context skills

Use when editing `src/context/`.

## Do
- Keep changes in this folder's responsibility.
- Update this README key-files list when adding important files.
- Prefer feature-MVC placement rules in `docs/FEATURE_MVC_STRUCTURE.md`.

## Do not
- Invent parallel ownership in another tree without documenting status.
- Break stable routes (`/validateurl`, `/editor`, `/login`, `/config-manager`).

## Workflows
1. Keep editor/layout/module context here until a safer second-pass migration.
2. Feature-local context stays under features (e.g. dashboard).
3. Do not put API session handshake in context — use services/session.

## Related
- [../core/providers/index.js](../core/providers/index.js)
- [../core/README.md](../core/README.md)
