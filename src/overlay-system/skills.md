# overlay-system skills

Use when changing the overlay-system barrel or deciding which overlay API to use.

## Do

- Keep `index.js` as a thin re-export surface.
- Prefer `features/editor/modules` + `ModuleContext` for editor overlay modules.
- Prefer `components/overlay` for simple popout chrome.
- Document which export maps to which underlying file.

## Do not

- Grow a third competing overlay framework inside this folder.
- Ignore broken re-export targets (empty `error/` / missing `overlay/` modules) — fix targets or remove exports.

## Workflows

1. Add/adjust an export only when a stable underlying module exists.
2. Smoke-import the barrel in the consumer that needs it.
3. Update README mapping table.
4. If implementing missing ErrorTracker/OverlayProvider trees, place implementations in their real folders and re-export here.

## Related

- [README.md](./README.md)
- [../features/editor/modules/README.md](../features/editor/modules/README.md)
- [../components/overlay/README.md](../components/overlay/README.md)
- Index: [docs/SKILLS_AND_WORKFLOWS.md](../../docs/SKILLS_AND_WORKFLOWS.md)
