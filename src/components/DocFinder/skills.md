# DocFinder skills

Use when editing `src/components/DocFinder/` (or related imports).

## Do
- Keep changes scoped to this folder's responsibility.
- Prefer reuse from shared charts/grid/layout when possible.
- Update this README key-files list when adding files.

## Do not
- Add route-level pages here — use `src/features/`.
- Introduce new session/API orchestration — use `src/services/`.

## Workflows
1. Edit `src/features/doc-finder/*`.
2. Keep re-exports for legacy imports.
3. Dashboard DocDashboard should import from features.

## Related
- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
