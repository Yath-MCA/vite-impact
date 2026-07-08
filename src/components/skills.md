# Components skills

Use when editing or adding shared UI under `src/components/`.

## Do

- Keep components presentational; call into `services/` or feature hooks for data.
- Add `README.md` + `skills.md` when creating a **new** subfolder; update [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md).
- Reuse `charts/`, `grid/`, `layout/`, `loading/` before inventing parallel widgets.
- For editor chrome, edit `components/editor/*` and wire from `features/editor/pages`.

## Do not

- Put new route pages or session orchestration here.
- Implement new ConfigManager / DocFinder logic under the re-export folders.
- Duplicate layouts that already exist under `core/layout` without consolidating.

## Workflow: add a shared component

1. Choose the closest area folder (or create one + docs).
2. Implement the component; keep props/API narrow.
3. Import from `features/<name>` or other components — avoid deep cross-feature coupling.
4. Add/adjust unit or visual coverage if the area already has tests.
5. Document key files in that folder’s `README.md`.

## Workflow: promote UI to a feature

1. Move ownership to `src/features/<name>/`.
2. Leave a thin re-export under `components/` only if old imports must stay.
3. Update router / dashboard imports to the feature path.
4. Mark status `thin re-export` in README.

## Related

- [README.md](./README.md)
- [docs/FEATURE_MVC_STRUCTURE.md](../../docs/FEATURE_MVC_STRUCTURE.md)
- Skill: `.cursor/skills/impact-react-mvc`
