# services

## Purpose / ownership
Shared Model layer: HTTP transport, session gateway, editor init/storage, bridges, optional supabase/ollama.

## Key files
- `api/`
- `session/`
- `landing/`
- `download/`
- `core/`
- `bridge/`
- `ollama/`
- `supabase/`
- `docsApi.js`

## Dependencies
Called by features/hooks/contexts. Prefer domain folders over new root mega-files.

## Status
**active**
