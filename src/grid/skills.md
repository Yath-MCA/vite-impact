# grid skills (top-level `src/grid`)

Use when editing the top-level grid package/examples. **Prefer `src/components/grid` for app UI wrappers.**

Detailed notes: [README.md](./README.md).

## Do
- Treat this as package/examples unless consolidating into `components/grid`.
- Document any intentional dual-grid setup.

## Do not
- Add new production dashboard grids here without a migration plan.
- Confuse with `components/grid/AgGridWrapper.jsx`.

## Workflows
1. Decide target: `components/grid` vs this package.
2. Update both READMEs if consolidating.
3. Point feature imports at the chosen path.

## Related
- [../components/grid/README.md](../components/grid/README.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)
