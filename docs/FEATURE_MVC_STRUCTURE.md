# Feature-MVC Structure (target)

React does not use classic Rails-style `models/views/controllers` trees. This project uses a **feature-MVC hybrid**:

| MVC role | Location inside a feature |
|----------|---------------------------|
| Model | `services/` (shared) or `features/<name>/services/` |
| View | `features/<name>/pages/` + `components/` |
| Controller | `features/<name>/hooks/` + `routes/` + thin page containers |

## Current feature layout

```
src/
  core/                 # app shell (router, providers facade, layout)
  features/
    landing/
      pages/            # ValidateUrlPage (controller+routing), LandingUI (view)
      hooks/            # useLandingSessionFlow
      routes/
    dashboard/          # reference module (pages, layout, routes, context)
    editor/
      pages/EditorPage.jsx
      routes/
    auth/pages/Login.jsx
    config-manager/
    doc-finder/
  components/           # shared View primitives + deprecated re-exports
  services/             # shared Model (api, session, supabase)
```

## Stable routes (email links)

- `/` and `/validateurl`, `/validateurl/:client` → landing feature
- `/editor` → `features/editor` (not `features_old`)
- `/login` → `features/auth`
- `/config-manager/*` → `features/config-manager`

## Migration notes

- `src/pages/*` and some `src/components/ConfigManager|DocFinder` files are thin re-exports.
- `src/features_old` is retired for routing; see `src/features_old/README.md`.
- Preferred shared providers entry: `src/core/providers`.
