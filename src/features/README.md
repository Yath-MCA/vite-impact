# features

## Purpose / ownership
Product modules (feature-MVC). Gold standard: `dashboard/` (`pages`, `layout`, `routes`, `context`, `hooks`, `config`, `utils`). New product flows belong here — not under `components/`.

## Key files
- `dashboard/`
- `landing/`
- `editor/`
- `auth/`
- `config-manager/`
- `doc-finder/`
- `extras/ (quarantine)`

## Dependencies
Consumes `services/`, shared `components/`, and `core/router`. Overlay screens still mainly in `modules/`.

## Status
**active (partial migration complete)**
