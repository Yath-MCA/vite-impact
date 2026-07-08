# Routes and Their Destinations

This document summarizes the main application routes and the pages or components they resolve to.

## Router entry points

- Main router setup: [src/core/router/AppRouter.jsx](../src/core/router/AppRouter.jsx)
- Dashboard nested routes: [src/features/dashboard/routes/dashboardRoutes.jsx](../src/features/dashboard/routes/dashboardRoutes.jsx)

## Top-level routes

| Route | Destination | Notes |
| --- | --- | --- |
| `/` | Landing page | Loads [src/pages/Landing.jsx](../src/pages/Landing.jsx) |
| `/login` | Login page | Loads [src/pages/Login.jsx](../src/pages/Login.jsx) |
| `/dashboard/*` | Dashboard router | Renders the dashboard feature with provider context |
| `/doc-dashboard/*` | Dashboard router (doc dashboard mode) | Uses the same dashboard router but shows the doc dashboard experience |
| `/docdashboard` | Redirect to `/doc-dashboard` | Alias redirect |
| `/doc-finder` | Redirect to `/devboard` | Legacy alias |
| `/admindashboard` | Redirect to `/dashboard/admin` | Legacy alias |
| `/client` | Client dashboard | Loads [src/features/extras/ClientDashboard.jsx](../src/features/extras/ClientDashboard.jsx) |
| `/validateurl` | Landing page | Same component as `/` |
| `/validateurl/:client` | Landing page with client param | Same component as `/` |
| `/editor` | Editor page | Loads [src/features_old/editor/pages/EditorPage.jsx](../src/features_old/editor/pages/EditorPage.jsx) |
| `/editor-readyonly` | Editor page in read-only mode | Same editor page with `readOnly` enabled |
| `/config-manager/*` | Config manager page | Protected admin route via [src/components/ConfigManager/ConfigManagerPage.jsx](../src/components/ConfigManager/ConfigManagerPage.jsx) |
| `*` | Redirect to `/` | Fallback route |

## Dashboard nested routes

These routes are mounted under the dashboard router and are handled in [src/features/dashboard/routes/dashboardRoutes.jsx](../src/features/dashboard/routes/dashboardRoutes.jsx).

| Route pattern | Destination | Notes |
| --- | --- | --- |
| `/dashboard` | Redirect to `/dashboard/dev` | Default dashboard landing |
| `/dashboard/dev` | Dev dashboard | Loads [src/features/dashboard/pages/DevDashboard.jsx](../src/features/dashboard/pages/DevDashboard.jsx) |
| `/dashboard/admin` | Admin dashboard | Loads [src/features/dashboard/pages/AdminDashboard.jsx](../src/features/dashboard/pages/AdminDashboard.jsx) |
| `/dashboard/config-manager/*` | Config manager page | Protected admin route |
| `/dashboard/admin-dashboard` | Redirect to `/admin` | Legacy redirect |
| `/dashboard/dashboard` | Redirect to `/dashboard` | Alias redirect |
| `/doc-dashboard` | Doc dashboard | Loads [src/features/dashboard/pages/DocDashboard.jsx](../src/features/dashboard/pages/DocDashboard.jsx) |
| `/doc-dashboard/*` | Doc dashboard landing | Uses the same layout and doc dashboard entry |
