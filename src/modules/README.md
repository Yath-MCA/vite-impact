# `src/modules/`

Overlay **module** system and domain screens for activity, history, and reports. Distinct from `src/features/` (product routes) and `src/components/` (shared UI).

Workflows: [skills.md](./skills.md).  
Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md).

## Root registry

| File | Role |
|------|------|
| `ModuleManager.jsx` | Hosts / mounts registered overlay modules for the editor shell |
| `ModuleRegistry.jsx` | Register/lookup module definitions (ids, components, metadata) |

## Subfolders

| Folder | Purpose | Status |
|--------|---------|--------|
| [activity](./activity/) | User activity screen | active · migrate-to-feature later |
| [history](./history/) | Document history screen | active · migrate-to-feature later |
| [reports](./reports/) | Failure/compare/correction report screens | active · migrate-to-feature later |

## Target migration

Per feature-MVC plan, these screens should eventually move to:

- `features/activity/`
- `features/history/`
- `features/reports/`

Keep `ModuleManager` / `ModuleRegistry` either under `features/editor` or `core/overlays` when that move happens.
