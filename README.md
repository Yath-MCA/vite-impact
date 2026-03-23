# Impact Vite CMS Platform

React 18 + Vite CMS/editor platform with modular overlays, role/client permissions, AG Grid data workflows, and dashboard/reporting surfaces.

## What is included

- Dual-navbar CMS editor with TOC, center edit canvas, PDF preview, and thumbnail rail
- Overlay system with dialog, right sidebar, and draggable popout support
- Dashboard suite:
  - `DashboardPage` (operations)
  - `AdminDashboard` (users/clients/projects/system metrics)
  - `ClientDashboard` (publisher production view)
  - `ReportsPage` (filters/charts/grid/export actions)
- AG Grid wrapper with enterprise-aware setup and reusable grid defaults
- Role + client permission model (`AuthContext`, `usePermissions`, `clientConfig`)
- Environment generation/build pipeline (`env:*`, `build:*` scripts)

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
- `npm run test:e2e` - Playwright tests

## Route map

- `/dashboard`
- `/admindashboard` (aliases: `/admin-dashboard`, `/admin`)
- `/client`
- `/reports`
- `/settings`
- `/editor`
- `/editor-readyonly`
- `/validateurl/:client`

## Key implementation paths

- Routing: `src/routes/AppRouter.jsx`, `src/routes/AppRoutes.jsx`
- Editor page: `src/pages/EditorPage.jsx`
- Overlay runtime: `src/context/ModuleContext.jsx`, `src/modules/ModuleManager.jsx`
- Permissions: `src/context/AuthContext.jsx`, `src/hooks/usePermissions.js`, `src/config/clientConfig.js`
- Grid wrapper: `src/components/grid/AgGridWrapper.jsx`
- Dashboards/pages: `src/pages/*.jsx` and `src/components/{dashboard,admin,client,reports,charts}`

## Migration safety archive

Unused migration candidates are moved (not deleted) under:

- `temp_migration/`
- Report file: `temp_migration/migration-report.json`
- Helper script: `scripts/migration-cleanup-unused.mjs`

This preserves rollback capability during cleanup.

## Documentation

- Developer guide: `docs/DEVELOPER_GUIDE.md`
- Environment setup: `docs/ENVIRONMENT_README.md`
- Overlay notes: `docs/OVERLAY_SYSTEM_README.md`
- Legacy/readme index: `md_docs/README.md`
