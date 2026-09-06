# Impact Vite CMS Platform

React 18 + Vite CMS/editor platform with modular overlays, role/client permissions, AG Grid data workflows, and dashboard/reporting surfaces.

## What is included

- Dual-navbar CMS editor with TOC, center edit canvas, PDF preview, and thumbnail rail
- Overlay system with dialog, right sidebar, and draggable popout support
- Dashboard suite (`src/features/dashboard/`): Dev/Admin/Client/Doc dashboards, reports, config manager
- AG Grid wrapper with enterprise-aware setup and reusable grid defaults
- Role + client permission model (`AuthProvider`, menu permission utilities, `clientConfig`)
- Environment generation/build pipeline (`env:*`, `build:*` scripts)
- Contract-parity services ported from the legacy `impactweb` app: error mail/tracker, user-action history, file upload, download

## Quick start

```bash
npm install
npm run dev
```

Open the app in browser (default Vite host/port shown in terminal).

## Common scripts

- `npm run dev` - frontend local dev
- `npm run dev:backend` - graphql wrapper only
- `npm run dev:fullstack` - frontend + backend wrapper
- `npm run build:local` - local production build
- `npm run build:dev|uat|stage|prod` - env-specific production build
- `npm run test:unit` - Vitest unit tests
- `npm run test:e2e` - Playwright tests

## Route map

- `/` and `/validateurl`, `/validateurl/:client` → landing feature
- `/login` → auth feature
- `/dashboard/*` → dev dashboard (default)
- `/doc-dashboard/*` → document dashboard
- `/client` → client dashboard
- `/config-manager/*` → dashboard config manager
- `/editor`, `/editor-readyonly` → editor feature

## Architecture

This project uses a **feature-MVC hybrid** layout — see [`docs/FEATURE_MVC_STRUCTURE.md`](docs/FEATURE_MVC_STRUCTURE.md) for the full model. Domain UI lives under `src/features/<name>/{pages,hooks,routes}`; `src/components/` holds shared view primitives only; `src/services/` holds shared Model-layer services.

## Key implementation paths

- Routing: `src/core/router/AppRouter.jsx`
- Editor page: `src/features/editor/pages/EditorPage.jsx`
- Overlay runtime: `src/context/ModuleContext.jsx`, `src/features/editor/modules/ModuleManager.jsx`
- Auth: `src/shared/providers/AuthProvider.jsx` (`useAuth()`), permissions: `src/features/dashboard/utils/menuPermissions.js`, client config: `src/config/clientConfig.js`
- Grid wrapper: `src/features/dashboard/components/grid/AgGridWrapper.jsx`
- Dashboards/pages: `src/features/dashboard/pages/*.jsx`
- Services: `src/services/` (see [`docs/SKILLS_AND_WORKFLOWS.md`](docs/SKILLS_AND_WORKFLOWS.md) for the full per-service README/skills index)

## Documentation

- Feature-MVC structure: `docs/FEATURE_MVC_STRUCTURE.md`
- Folder structure (legacy reference): `docs/FOLDER_STRUCTURE.md`
- Skills & per-folder workflows: `docs/SKILLS_AND_WORKFLOWS.md`
- Developer guide: `docs/DEVELOPER_GUIDE.md`
- Environment setup: `docs/ENVIRONMENT_README.md`
- Overlay notes: `docs/OVERLAY_SYSTEM_README.md`
