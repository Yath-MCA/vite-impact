# overlay-system

## Purpose / ownership

Barrel/facade that re-exports overlay + module-registry + error-tracker pieces for a unified import path (`src/overlay-system/index.js`).

**Not the same as:**

| Path | Role |
|------|------|
| `src/components/overlay/` | Presentational popout overlay UI (`PopoutOverlay.jsx`) |
| `src/features/editor/modules/` | ModuleManager / ModuleRegistry |
| `src/context/ModuleContext.jsx` | Editor module host used by `features/editor` |

## Key files

- `index.js` — re-exports providers/components from sibling/overlay trees

## Dependencies

Intended consumers import providers/UI that live under `../overlay`, `../features/editor/modules/ModuleRegistry`, `../error/*`. Some of those targets may still be incomplete/empty (see `src/error` placeholder status). Prefer confirming paths before expanding this facade.

## Status

**active · thin facade**

## Skills

See [skills.md](./skills.md).
