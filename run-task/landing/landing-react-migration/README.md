# Landing React Migration Docs

This folder describes how to migrate the existing IMPACT ValidateURL landing pages into a new React application while preserving multi-client branding and behavior.

## Files

- [01-overview.md](01-overview.md) - current landing design, goals, and migration boundaries.
- [02-config-model.md](02-config-model.md) - JSON structure for common defaults, shared sections, themes, and client overrides.
- [03-react-layout.md](03-react-layout.md) - recommended React component tree and data flow.
- [04-db-migration.md](04-db-migration.md) - database-backed configuration approach and API response model.
- [05-verification.md](05-verification.md) - migration checklist and testing strategy.

## Current Source References

- `snippet/validateurl.html`
- `src/clientconfig/landing-pages/common.json`
- `src/clientconfig/landing-pages/sections.json`
- `src/clientconfig/landing-pages/clients.json`
- `utils/gulp/landing-page-config.js`

