# landing services

## Purpose / ownership
Landing-page model helpers: browser compatibility, per-client branding overrides, and the scheduled-maintenance toast service (`maintenanceGuard.js`). Maintenance is informational only — it does not gate urlvalidity.

## Key files
- `browserCompatibility.js`
- `landingConfigService.js`
- `maintenanceGuard.js`

## Dependencies
Used by `features/landing`. Session handshake stays in `services/session`.

## Status
**active**
