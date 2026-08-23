# Developer Guide

This document is the practical developer reference for the current CMS platform state.

## 1) Architecture overview

- App bootstrap: `src/main.jsx` -> `src/App.jsx`
- Provider stack in `App.jsx`:
  - `ClientProvider`
  - `LayoutProvider`
  - `ModuleProvider`
  - `EditorProvider`
  - `AuthProvider` is mounted inside router (`AppRouter`)
- Primary router: `src/core/router/AppRouter.jsx`

## 2) Editor architecture

Main page: `src/features/editor/pages/EditorPage.jsx`

Key sections:

- `Navbar1` + `Navbar2` top bars
- Left navigation panel (lazy): `NavigationPanel`
- Editor center: CKEditor 4 instance
- Right preview panel (lazy): `PdfPreview`
- Thumbnail rail (lazy): `ThumbnailPanel`
- Fixed status/footer: `EditorFooter`
- Overlay host: `ModuleManager`

### Editor module registration

`EditorPage` registers modules at runtime using `useModule()`:

- `settings` -> `RIGHT_SIDEBAR`
- `styles` -> `MODAL`
- `media` -> `MODAL`
- `inspector` -> `POPOUT`

## 3) Overlay system

Core:

- Context/types: `src/context/ModuleContext.jsx`
- Runtime renderer: `src/features/editor/modules/ModuleManager.jsx`
- Popout UI: `src/components/overlay/PopoutOverlay.jsx`

Supported types:

- `modal`
- `right-sidebar`
- `popout`

Pattern:

```js
const { registerModule, openModule } = useModule();
registerModule('myModule', MyComponent, MODULE_TYPES.MODAL, { title: 'My Module' });
openModule('myModule', { anyProp: 'value' });
```

## 4) Routing and layouts

Current route host: `src/core/router/AppRouter.jsx` (used by `App.jsx`).

If you are adding new pages, keep `AppRouter.jsx` updated first.

## 5) Permissions and RBAC

### Auth access map

`src/context/AuthContext.jsx` contains role access helper:

- `hasAccess(scope)`
- access scopes: `dashboard`, `editor`, `reports`, `admin`

### Client + role feature permissions

`src/hooks/usePermissions.js` combines:

- role permissions from `src/config/clientConfig.js`
- client enabled features from `src/config/clientConfig.js`

Use:

```js
const { can, canAccess } = usePermissions({ userRole, clientId });
```

## 6) Grid system

Reusable wrapper: `src/features/dashboard/components/grid/AgGridWrapper.jsx`

Capabilities:

- community + enterprise-aware initialization
- pagination, filtering, sorting defaults
- sidebar tool panels
- row grouping support
- server-side datasource pass-through

## 7) Dashboards and reports

Pages:

- `src/features/dashboard/pages/DevDashboard.jsx`
- `src/features/dashboard/pages/AdminDashboard.jsx`
- `src/features/extras/ClientDashboard.jsx`
- `src/features/dashboard/reports/pages/ReportsPage.jsx`

UI modules:

- `src/features/dashboard/components/*`
- `src/features/extras/components/admin/*`
- `src/features/extras/components/client/*`
- `src/features/dashboard/reports/components/*`
- `src/components/charts/*`

## 8) Performance notes

Implemented:

- Route/page lazy loading in router
- Panel lazy loading in editor
- `React.memo` for repeated presentational modules
- Debounced editor-content synchronization in `EditorPage`
- Virtualized rendering patterns in TOC/Comments for large lists

## 9) Environment and build

See `docs/ENVIRONMENT_README.md` for full details.

Quick commands:

```bash
npm run env:local
npm run dev
npm run build:local
```

## 10) Migration cleanup process

Temporary archive location:

- `temp_migration/`

Script:

- `scripts/migration-cleanup-unused.mjs`

Report:

- `temp_migration/migration-report.json`

Important: cleanup moves files instead of deleting to keep rollback safe.

## 11) Developer workflow checklist

1. Implement changes in focused modules
2. Run `npm run build:local`
3. Smoke-check routes touched
4. If migration cleanup is involved, update `migration-report.json`
5. Commit in logical groups (feature vs migration/archive)
