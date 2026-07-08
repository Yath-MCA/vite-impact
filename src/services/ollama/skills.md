# services/ollama skills

Use when changing Ollama client/config under `src/services/ollama/`.

## Do
- Keep HTTP in this service; keep secrets in env (`VITE_OLLAMA_*`).
- Update the detailed [README.md](./README.md) for API/usage changes.
- Pair UI with `components/ollama` or a feature — not inside services.

## Do not
- Hardcode model URLs in React components.
- Expand UI into this folder.

## Workflows
1. Adjust `ollamaConfig` / `ollamaService`.
2. Verify against local `ollama serve`.
3. Document env keys and hooks usage in README.

## Related
- Parent: [../README.md](../README.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../../docs/SKILLS_AND_WORKFLOWS.md)
