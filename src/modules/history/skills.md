# history skills

Use when editing `src/modules/history/`.

## Do
- Keep screens focused; reuse `src/components` widgets.
- Register overlays via ModuleRegistry when used in editor overlays.
- Update key files in README when adding screens.

## Do not
- Add new primary app routes without `features/history` migration planning.
- Bypass ModuleManager when the UI is meant as an editor overlay.

## Workflows
1. Extend DocumentHistory carefully.
2. Keep overlay registration consistent.
3. Migrate to feature folder when product nav needs a dedicated route.

## Related
- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
