# features

## Purpose / ownership
Product modules (feature-MVC). Gold standard: `dashboard/` (`pages`, `layout`, `routes`, `context`, `hooks`, `config`, `utils`). New product flows belong here — not under `components/`.

## Key files
- `dashboard/`
- `landing/`
- `editor/`
- `auth/`
- `dashboard/activity/`
- `dashboard/config-manager/`
- `dashboard/doc-finder/`
- `dashboard/reports/`
- `editor/history/`
- `extras/ (quarantine)`

## Dependencies
Consumes `services/`, shared `components/`, and `core/router`.

## Status
**active (partial migration complete)**
