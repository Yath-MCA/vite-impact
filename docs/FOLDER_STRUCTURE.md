# IMPACT Vite Project Folder Structure

> **Architecture model:** see [`FEATURE_MVC_STRUCTURE.md`](./FEATURE_MVC_STRUCTURE.md) for the feature-MVC hybrid this structure implements.
> **Skills & folder workflows:** see [`SKILLS_AND_WORKFLOWS.md`](./SKILLS_AND_WORKFLOWS.md) for the per-folder `README.md` / `skills.md` index.
> **Routes:** see [`ROUTES_README.md`](./ROUTES_README.md) for the full route table.
> **History:** see [`ARCHITECTURE_MIGRATION_HISTORY.md`](./ARCHITECTURE_MIGRATION_HISTORY.md) for how this structure was reached (feature-first refactor, dashboard refactor, router refactor).

This document reflects the actual current tree — regenerate/re-verify against the filesystem before trusting it long after the date below.

## Root directory

```
impact_react_vite/
├── .env.example / .env.local.example  # Environment variable templates
├── docker-db.md                     # Local DB via Docker notes
├── docs/                            # Project documentation (this folder)
├── e2e/                             # Playwright end-to-end test specs
├── env/                             # Per-environment config (env.dev/local/prod/stage/uat.js, schema.js)
├── graphql-wrapper/                  # GraphQL wrapper backend service
├── public/                          # Static public assets (ckeditor4, data_cache, legacy-editor, env.js)
├── scripts/                         # Build/env-generation/codegen scripts
├── src/                             # Application source
├── tests/                           # Vitest unit tests + test docs/fixtures/helpers
├── index.html                       # Vite entry HTML
├── package.json / package-lock.json
├── playwright.config.ts
├── postcss.config.js / tailwind.config.js
├── vite.config.js
└── README.md
```

## Source directory (`src/`)

```
src/
├── App.jsx                  # Root React component
├── main.jsx                 # Application entry point
├── index.css                # Global styles
├── assets/                  # Static assets (images, fonts)
├── collection-config/       # Client/journal collection config (registry, resolver, presets)
├── components/              # Shared View primitives only (not feature-owned UI)
├── config/                  # App-wide configuration (clientConfig, etc.)
├── context/                 # Global React contexts (EditorContext, LayoutContext, ModuleContext)
├── core/                    # App shell: router, layout, providers
├── error/                   # Overlay error tracker: ErrorTrackerProvider, ErrorBoundary, ErrorPanel
├── events/                  # Event bus / event management
├── features/                # Feature-owned Model+View+Controller (see below)
├── legacy/                  # Legacy-bridge code kept for compatibility
├── overlay-system/          # Overlay barrel (dialog/sidebar/popout exports)
├── services/                # Shared Model layer (see below)
└── shared/                  # Cross-feature constants, hooks, plugins, providers, utils
```

### `src/core/`

```
core/
├── router/
│   ├── AppRouter.jsx              # Main router — see docs/ROUTES_README.md for the full route table
│   ├── ProtectedRoute.jsx         # Auth/role route guard
│   └── BrowserCompatibilityGate.jsx
├── layout/                        # App shell layout (Header/Footer/AppLayout)
└── providers/                     # App-wide provider composition
```

### `src/features/`

Each feature owns its own `pages/`, `components/`, `hooks/`, `routes/` (feature-MVC — see `FEATURE_MVC_STRUCTURE.md`).

```
features/
├── auth/pages/                    # Login
├── landing/pages/                 # MarketingLandingPage, ValidateUrlPage, LandingUI
├── editor/
│   ├── pages/EditorPage.jsx
│   ├── components/, hooks/, routes/, modules/, messages/
│   └── history/                   # DocumentHistory.jsx (moved here from a former top-level features/history)
├── settings/
├── supabase/
└── dashboard/                     # Reference module plus dashboard-owned workflows
    ├── pages/                     # AdminDashboard, DevDashboard, DocDashboard, ClientDashboard
    ├── routes/dashboardRoutes.jsx
    ├── layout/, context/, config/, hooks/, components/, utils/
    ├── activity/                  # UserActivity (moved here from a former top-level features/activity)
    ├── reports/                   # CompareReports, CorrectionCount, PackagePdfFailure, SaveFailureItems, XmlFailure (moved here from a former top-level features/reports)
    ├── config-manager/            # ConfigManagerPage, ConfigList, ConfigEditor, ConfigHistory
    ├── doc-dashboard/
    └── doc-finder/
```

### `src/services/`

Shared Model-layer services — each folder carries its own `README.md`/`skills.md`; the full index lives in [`SKILLS_AND_WORKFLOWS.md`](./SKILLS_AND_WORKFLOWS.md).

```
services/
├── api/            # apiService.js — API_ENDPOINTS, FetchService (all REST calls)
├── session/        # Session storage/constants
├── landing/        # Landing-page-specific services
├── download/       # WorkflowDownloadService (legacy download parity)
├── error/          # ErrorLogs mail/insert, subject Map, window.ErrorLogTrace bridge, initErrorOps()
├── user-action/    # UserPreference history sync (dialog/tour/find/replace/attachment tracking)
├── upload/         # Multipart file upload (100/500MB gates, legacy FileUploadModule parity)
├── core/            # Core service utilities
├── bridge/         # Legacy/React bridge helpers
├── ollama/         # Ollama AI integration
├── alerts/         # Alert/toast service
└── supabase/       # Supabase integration
```

## Key top-level directories

### `docs/`

Documentation index. See [`SKILLS_AND_WORKFLOWS.md`](./SKILLS_AND_WORKFLOWS.md) for per-folder skills, [`ROUTES_README.md`](./ROUTES_README.md) for routes, [`FEATURE_MVC_STRUCTURE.md`](./FEATURE_MVC_STRUCTURE.md) for the architecture model, [`ARCHITECTURE_MIGRATION_HISTORY.md`](./ARCHITECTURE_MIGRATION_HISTORY.md) for how the codebase got here. Setup guides: `DEVELOPER_GUIDE.md`, `ENVIRONMENT_README.md`, `AUTH_API_GUIDE.md`, `CKEDITOR4_SETUP.md`, `OVERLAY_SYSTEM_README.md`, `SUPABASE_SETUP.md`.

### `env/`

```
env/
├── env.dev.js / env.local.js / env.local.secrets.js / env.prod.js / env.stage.js / env.uat.js
├── env.secrets.example.js
└── schema.js
```

### `scripts/`

Build, environment-generation, and codegen utilities (`generate-env.js`, `generate-backend-env.js`, `post-build-env.js`, `validate-env.js`, `generate-folder-skills.mjs`, `generate-major-folder-skills.mjs`, `generate-editor-message-keys.mjs`, `sync-doc.js`, `capture_qc_stack.mjs`, `find_qc_error.mjs`, `run-main.js`).

### `tests/`

```
tests/
├── unit/            # Vitest unit tests (mirrors src/ layout)
├── accessibility/, auth/, error/, landing/, modules/, overlay/, pages/  # Playwright e2e specs
├── fixtures/, helpers/, setup/, utils/
├── GETTING_STARTED.md, README.md, SUMMARY.md, TEST_IDS.md
```

### `public/`

```
public/
├── assets/            # Static assets
├── ckeditor4/         # CKEditor 4 runtime files
├── data_cache/        # Data cache storage
├── legacy-editor/      # Legacy editor bridge files
├── snapshots/
└── env.js             # Runtime env values injected into window.ENV
```

## Technology stack

- **Frontend**: React 18 with Vite
- **Styling**: Tailwind CSS + custom CSS
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Editor**: CKEditor 4 integration
- **Backend wrapper**: GraphQL (`graphql-wrapper/`)
- **AI Integration**: Ollama
- **Database**: Supabase integration

## Notes

- Feature-first architecture: domain UI lives under `src/features/<name>/`, not scattered `src/pages/`/`src/components/`.
- `src/pages/`, `src/routes/`, `src/modules/`, and top-level `src/features/{reports,history,activity}/` are retired — folded into `src/features/dashboard/` and `src/features/editor/history/` respectively.
- Legacy files preserved in `src/legacy/` where still needed for bridging.
- Comprehensive per-folder skills/README workflow — see `SKILLS_AND_WORKFLOWS.md`.

---

*Last verified against the filesystem: 2026-08-24.*
