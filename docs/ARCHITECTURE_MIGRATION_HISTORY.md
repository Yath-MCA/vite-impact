# Architecture Migration History

Archival record of the feature-first migration. For the **current** structure, see [`FOLDER_STRUCTURE.md`](./FOLDER_STRUCTURE.md) and [`FEATURE_MVC_STRUCTURE.md`](./FEATURE_MVC_STRUCTURE.md); for routes, see [`ROUTES_README.md`](./ROUTES_README.md). This document only explains *how* the codebase got here — treat any path mentioned below as historical, not current.

Consolidates three prior point-in-time reports (`IMPACT_ARCHITECTURE_REFACTOR_COMPLETE.md`, `ROUTER_CONFIGURATION_SUMMARY.md`, `DASHBOARD_REFACTOR_SUMMARY.md`), all dated 2026-03-23, into one file.

## 1. Feature-first architecture refactor

Moved from a mixed structure (`src/pages/`, `src/modules/`, a single `src/routes/AppRouter.jsx`) to feature-owned modules under `src/features/<name>/{pages,components,services,hooks,routes,index.js}`.

- New core infrastructure: `src/core/layout/` (AppLayout, Header, Footer), `src/core/router/AppRouter.jsx`, `src/core/router/ProtectedRoute.jsx`.
- `src/modules/` → `src/features/` (complete migration).
- `src/routes/AppRouter.jsx` → `src/core/router/AppRouter.jsx`.
- Features created at the time: `reports/`, `history/`, `activity/`, `editor/` (plus the already-existing `dashboard/`, `config-manager/`).
- All features lazy-loaded; legacy URLs preserved via redirects.

**Since superseded:** `reports/`, `history/`, and `activity/` were later folded into `src/features/dashboard/` (reports, activity) and `src/features/editor/history/` (history) — they are no longer top-level `src/features/` entries. See `FOLDER_STRUCTURE.md` for the current layout.

## 2. Router configuration

Centralized routing: `src/core/router/AppRouter.jsx` imports each feature's route module and wraps protected routes in `ProtectedRoute.jsx`. Feature route files at the time: `dashboardRoutes.js`, `reportsRoutes.js`, `historyRoutes.js`, `activityRoutes.js`, `editorRoutes.js`. Authentication was token-based (`localStorage.getItem('authToken')`) with role-based authorization for admin-only routes.

**Since superseded:** route file locations and the exact route list have moved on — see `docs/ROUTES_README.md` for the current, verified route table (kept accurate independently of this history doc) and `src/shared/providers/AuthProvider.jsx` for the current auth mechanism.

## 3. Dashboard refactor

Moved dashboard components/pages from scattered locations (`src/components/dashboard/`, `src/pages/{AdminDashboard,DocDashboard,DashboardPage}.jsx`) into `src/features/dashboard/`, adding:

- `DashboardLayout.jsx` / `DashboardSidebar.jsx` — responsive layout + role-filtered sidebar
- `DashboardContext.jsx` / `useDashboard()` — dashboard type detection, permissions, sidebar state
- `dashboardMenuConfig.js` — role-based menu config (Admin/Developer/Document)
- `dashboardRoutes.js` — protected, lazily-loaded dashboard routes
- `DashboardPage.jsx` renamed to `DevDashboard.jsx`

**Still current:** this refactor's outcome is largely still the shape of `src/features/dashboard/` today (see `FOLDER_STRUCTURE.md`), though `activity/`, `reports/`, `config-manager/`, `doc-dashboard/`, and `doc-finder/` were added as dashboard-owned subdirectories after this report was written.

---

*Consolidated 2026-08-24 from three separate 2026-03-23 completion reports.*
