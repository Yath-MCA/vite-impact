# config skills

Use when editing theme, landing-meta, permissions, or presets under `src/config/`.

See the detailed [README.md](./README.md) for schema and usage.

## Do
- Prefer documented config schemas; avoid ad-hoc JSON keys without updating the README.
- Keep branding/client copy in landing-meta / theme carefully.
- Do not store secrets here.

## Do not
- Duplicate collection-config without documenting which source of truth applies.
- Break clients that depend on existing landing-meta shape.

## Workflows
1. Change config file + update README examples.
2. Smoke landing/dashboard consumers.
3. Keep `skills.md` + index links in sync if new subfolders appear.

## Related
- [README.md](./README.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)
