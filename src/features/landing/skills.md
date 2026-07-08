# landing skills

Use when editing `src/features/landing/`.

## Do
- Keep changes in this folder's responsibility.
- Update this README key-files list when adding important files.
- Prefer feature-MVC placement rules in `docs/FEATURE_MVC_STRUCTURE.md`.

## Do not
- Invent parallel ownership in another tree without documenting status.
- Break stable routes (`/validateurl`, `/editor`, `/login`, `/config-manager`).

## Workflows
1. Validation/orchestration → ValidateUrlPage + hook.
2. Presentation/CTA → LandingUI.
3. Session handshake only via `services/session`.
4. Keep email link URLs stable.

## Related
- Parent: [../README.md](../README.md) · [../skills.md](../skills.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
