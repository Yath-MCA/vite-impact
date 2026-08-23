# editor skills

Use when editing `src/features/editor/components/` (or related imports).

## Do
- Keep changes scoped to this folder's responsibility.
- Prefer reuse from shared charts/grid/layout when possible.
- Update this README key-files list when adding files.

## Do not
- Add route-level pages here — use `src/features/`.
- Introduce new session/API orchestration — use `src/services/`.

## Workflows
1. Change UI chrome here; page orchestration stays in `features/editor`.
2. Respect LayoutContext / EditorContext / ModuleContext contracts.
3. Test /editor route after toolbar/panel changes.

## Related
- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../../docs/SKILLS_AND_WORKFLOWS.md)
