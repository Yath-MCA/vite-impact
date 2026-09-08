# Archived legacy files

Moved out of the live tree on 2026-09-08. Everything here was confirmed
**unused by the current app** — nothing in `vite.config.js`, `package.json`,
or any live entry point (`main.jsx`, `App.jsx`, router) referenced these
files except each other.

## Contents

- `src/legacy/` — a broken barrel (`index.js` imported from
  `./services/core`/`./services/bridge`/`./events`/`./components/loading`,
  none of which existed inside `src/legacy/`).
- `src/services/bridge/` — `GlobalBridge.js` and its barrel; never
  instantiated anywhere in the live app.
- `src/services/core/InitService.js`, `EditorInitService.js`,
  `SharedKeyService.js`, `StorageService.js`, `URLService.js`,
  `LoadingService.js`, `SessionGuard.js` — jQuery-era classes only ever
  referenced by `GlobalBridge.js` above.
- `public/legacy-editor/` — a completely separate, self-contained
  standalone mini-app (own `package.json`/`vite.config.js`/`index.html`)
  with its own duplicate copies of the same classes; not wired into the
  main build in any way.
- `tests/unit/core/sessionGuard.test.js`,
  `tests/unit/bridge/globalBridge.test.js` — tests for the moved classes.

## Restoring

Each moved path mirrors its original location under this folder. To
restore, e.g.:

```bash
git mv temp/legacy/src/services/bridge/GlobalBridge.js src/services/bridge/GlobalBridge.js
```

and re-add the corresponding export line to `src/services/core/index.js`.
