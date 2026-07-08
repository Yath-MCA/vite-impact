# loading skills

Use when editing `src/components/loading/` (or related imports).

## Do
- Keep changes scoped to this folder's responsibility.
- Prefer reuse from shared charts/grid/layout when possible.
- Update this README key-files list when adding files.

## Do not
- Add route-level pages here — use `src/features/`.
- Introduce new session/API orchestration — use `src/services/`.

## Workflows
1. Export stable loading UI from index.
2. Do not hardcode editor bootstrap here — use services/core.
3. Keep CSS scoped.

## Related
- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
