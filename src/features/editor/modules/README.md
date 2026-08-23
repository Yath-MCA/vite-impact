# `src/features/editor/modules/`

Overlay **module** system for the editor shell. Distinct from routed feature screens and shared UI components.

Workflows: [skills.md](./skills.md).  
Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../../docs/SKILLS_AND_WORKFLOWS.md).

## Root registry

| File | Role |
|------|------|
| `ModuleManager.jsx` | Hosts / mounts registered overlay modules for the editor shell |
| `ModuleRegistry.jsx` | Register/lookup module definitions (ids, components, metadata) |

Dashboard-related screens that used to live under `src/modules` now live under `features/dashboard/*`; editor history lives under `features/editor/history`.
