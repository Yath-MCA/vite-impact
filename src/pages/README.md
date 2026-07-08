# pages

## Purpose / ownership
Deprecated route-level entrypoints. Prefer canonical files under `src/features/`. Several files are thin re-exports; some legacy pages remain unused by AppRouter.

## Key files
- `Landing.jsx → features/landing/pages/ValidateUrlPage`
- `ValidateUrlLanding.jsx → features/landing/pages/LandingUI`
- `Login.jsx → features/auth/pages/Login`
- `EditorPage.jsx → features/editor/pages/EditorPage`
- `ReportsPage.jsx / SettingsPage.jsx / SupabasePage.jsx (legacy / unused by main router)`

## Dependencies
AppRouter should lazy-load features directly. Do not grow this folder.

## Status
**thin re-export / deprecated**
