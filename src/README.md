# `src/` map

Feature-MVC hybrid application source. Details: [docs/FEATURE_MVC_STRUCTURE.md](../docs/FEATURE_MVC_STRUCTURE.md).  
Skills/workflows index: [docs/SKILLS_AND_WORKFLOWS.md](../docs/SKILLS_AND_WORKFLOWS.md).

| Path | Role | Docs |
|------|------|------|
| `core/` | App shell — router, layout, providers facade | [README](./core/README.md) |
| `features/` | Product modules — `pages/`, `hooks/`, `routes/`, local context | [README](./features/README.md) |
| `shared/` | Common providers, hooks, utilities, constants, and plugin wrappers | [README](./shared/README.md) |
| `components/` | Shared View kit | [README](./components/README.md) |
| `modules/` | Overlay module registry + report/history/activity screens | [README](./modules/README.md) |
| `services/` | Shared Model — API, session, editor init, supabase | [README](./services/README.md) |
| `pages/` | Thin re-exports into `features/` (deprecated) | [README](./pages/README.md) |
| `overlay-system/` | Overlay/module/error barrel facade | [README](./overlay-system/README.md) |
| `context/` | Global React providers (`core/providers` facade) | [README](./context/README.md) |
| `config/` | Theme, landing meta, permissions | [README](./config/README.md) |
| `styles/` | Cross-cutting styles | see [SKILLS_AND_WORKFLOWS](../docs/SKILLS_AND_WORKFLOWS.md) |

**Rule:** New domain UI goes under `features/<name>/`, not a new top-level domain folder under `components/`.

**Structure debt (docs-first; refactor later):** `features/extras` quarantine, `modules/*` → features, layout dedupe, empty dirs (`checks`, `routes`, …).
