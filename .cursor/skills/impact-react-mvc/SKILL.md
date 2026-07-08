---
name: impact-react-mvc
description: >-
  Guides IMPACT React Vite feature-MVC layout across features, pages, services,
  components, modules, overlay-system, and core. Use when deciding where to put
  new UI, working on architecture/MVC, services/session, README/skills docs, or
  folder conventions in this repo.
---

# IMPACT React Feature-MVC

## When to use

Read this skill before adding pages, shared UI, overlay modules, or docs under `src/`.

## Architecture map

| Layer | Role | Location |
|-------|------|----------|
| Model | API, session, storage | `src/services/` |
| View | Shared UI kit | `src/components/` |
| View (product) | Feature screens | `src/features/<name>/pages` |
| Controller | Hooks + routes | `src/features/<name>/hooks`, `routes` |
| Overlay modules | Reports/history/activity + registry | `src/modules/` |
| App shell | Router, providers | `src/core/` |

Canonical write-up: [docs/FEATURE_MVC_STRUCTURE.md](../../../docs/FEATURE_MVC_STRUCTURE.md)

Human index of all folder skills/READMEs: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)

## Stable routes (do not break)

- `/`, `/validateurl`, `/validateurl/:client` → `features/landing`
- `/editor` → `features/editor` (not `features_old`)
- `/login` → `features/auth`
- `/config-manager/*` → `features/config-manager`

## Where to put new code

1. **New product flow** → `src/features/<name>/{pages,hooks,routes}/`
2. **Reusable presentational UI** (no feature ownership) → `src/components/<area>/`
3. **Overlay / report module screens** → `src/modules/<area>/` (register via ModuleRegistry)
4. **HTTP / session / storage** → `src/services/<domain>/`
5. **Never** add new domain ownership under deprecated re-export folders:
   - Prefer `features/config-manager` over `components/ConfigManager`
   - Prefer `features/doc-finder` over `components/DocFinder`

## Workflow docs next to code

Open the matching tree’s `README.md` / `skills.md` before editing:

| Tree | Docs |
|------|------|
| Features | [src/features/](../../../src/features/README.md) (+ each feature folder) |
| Pages (deprecated) | [src/pages/](../../../src/pages/README.md) |
| Services | [src/services/](../../../src/services/README.md) (+ api, session, …) |
| Components | [src/components/](../../../src/components/README.md) |
| Modules | [src/modules/](../../../src/modules/README.md) |
| Overlay facade | [src/overlay-system/](../../../src/overlay-system/README.md) |
| Core / context | [src/core/](../../../src/core/README.md), [src/context/](../../../src/context/README.md) |

Full index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)

## Agent checklist

1. Open the matching folder `skills.md` before editing that area.
2. Keep email/proof URL routes stable.
3. Prefer thin pages that call services; keep payloads in `services/` or feature adapters.
4. After adding a **new** major subfolder under features/services/components/modules, add `README.md` + `skills.md` and list it in `docs/SKILLS_AND_WORKFLOWS.md`.
5. Do not add new product pages under `src/pages/` — use `features/`.
