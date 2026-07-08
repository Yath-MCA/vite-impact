# layout skills

Use when editing `src/components/layout/` (or related imports).

## Do
- Keep changes scoped to this folder's responsibility.
- Prefer reuse from shared charts/grid/layout when possible.
- Update this README key-files list when adding files.

## Do not
- Add route-level pages here — use `src/features/`.
- Introduce new session/API orchestration — use `src/services/`.

## Workflows
1. Check `core/layout` before adding parallel shells.
2. Prefer one AppLayout source of truth.
3. Document any intentional duplication.

## Related
- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
