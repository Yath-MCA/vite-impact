# Feature-MVC Structure (target)

React does not use classic Rails-style `models/views/controllers` trees. This project uses a **feature-MVC hybrid**:

| MVC role | Location inside a feature |
|----------|---------------------------|
| Model | `services/` (shared) or `features/<name>/services/` |
| View | `features/<name>/pages/` + `features/<name>/components/` + reusable `components/` |
| Controller | `features/<name>/hooks/` + `routes/` + thin page containers |

## Current feature layout

```
src/
  core/                 # app shell (router, providers facade, layout)
  features/
    landing/
      pages/            # ValidateUrlPage, MarketingLandingPage, LandingUI
      hooks/            # useLandingSessionFlow
      routes/
    dashboard/          # reference module plus dashboard-owned workflows
      activity/
      config-manager/
      doc-finder/
      reports/
    editor/
      pages/EditorPage.jsx
      components/
      history/
      routes/
    auth/pages/Login.jsx
  components/           # shared View primitives only
  services/             # shared Model — api, session, landing, download, error,
                         # user-action, upload, core, bridge, ollama, supabase
                         # (see docs/SKILLS_AND_WORKFLOWS.md for the full index)
  error/                # overlay error tracker: ErrorTrackerProvider, ErrorBoundary, ErrorPanel
```

## Stable routes (email links)

- `/` and `/validateurl`, `/validateurl/:client` → landing feature
- `/editor` → `features/editor` (not `features_old`)
- `/login` → `features/auth`
- `/config-manager/*` → `features/dashboard/config-manager`

## Migration notes

- Top-level `src/pages/` and feature-owned top-level component folders are retired.
- `src/features_old` is retired for routing; see `src/features_old/README.md`.
- Preferred shared providers entry: `src/core/providers`.
