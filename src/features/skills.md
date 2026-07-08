# features skills

Use when creating or changing product modules under `src/features/`.

## Do

- Follow dashboard as the structural gold standard (`pages`, `layout`, `routes`, `context`, `hooks`).
- Wire routes through `core/router/AppRouter.jsx` with stable URL contracts.
- Keep Model code in `services/`; keep shared chrome in `components/` when reusable.
- Quarantine `extras/` — migrate callers, do not expand it.

## Do not

- Add new product pages under `src/pages/`.
- Put feature-owned UI back under `components/ConfigManager` or `components/DocFinder` (re-exports only).
- Route `/editor` to `features_old`.

## Workflows

### Add a feature

1. Create `features/<name>/{pages,hooks,routes}/` (+ context/layout if needed).
2. Export routes; register in AppRouter.
3. Add README + skills; list in `docs/SKILLS_AND_WORKFLOWS.md`.
4. Add unit tests under `tests/unit/<area>/` when logic is non-trivial.

### Promote from components/modules

1. Move ownership to the feature folder.
2. Leave thin re-exports if old imports must remain.
3. Update menus/router imports.
4. Mark old location status in its README.

## Related

- [README.md](./README.md)
- [docs/FEATURE_MVC_STRUCTURE.md](../../docs/FEATURE_MVC_STRUCTURE.md)
- Skill: `.cursor/skills/impact-react-mvc`
