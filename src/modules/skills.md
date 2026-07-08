# Modules skills

Use when working on overlay modules, ModuleManager/Registry, or activity/history/reports screens under `src/modules/`.

## Do

- Register new overlay screens through ModuleRegistry patterns used by ModuleManager.
- Keep module screens focused; share charts/grids from `src/components/` where possible.
- Document each subfolder with `README.md` + `skills.md`.

## Do not

- Bypass the registry with one-off global window modules unless matching legacy bridge contracts.
- Confuse these with `src/features/` route modules — `modules/` here means overlay/CMS modules.
- Add new product routes under `modules/` without also wiring `features/*/routes` if the screen becomes a nav destination.

## Workflow: register an overlay module

1. Implement the screen under `src/modules/<area>/`.
2. Register with ModuleRegistry (id, component, title/type metadata).
3. Ensure ModuleManager can mount it from the editor shell / ModuleContext.
4. Smoke-test open/close and any required permissions.
5. Update this folder’s README key-files list.

## Workflow: migrate area to feature

1. Create `features/<area>/{pages,routes,components}`.
2. Move screens; update imports.
3. Point AppRouter / dashboard menu at the feature routes.
4. Leave ModuleManager integration under editor/core as needed.
5. Mark old folder status `migrate-to-feature` complete in README.

## Related

- [README.md](./README.md)
- [docs/FEATURE_MVC_STRUCTURE.md](../../docs/FEATURE_MVC_STRUCTURE.md)
- Editor feature: `src/features/editor/`
