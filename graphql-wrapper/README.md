# GraphQL wrapper (DocDashboard sync server)

This lightweight Node server is dedicated to `DocDashboard` snapshot sync.
It executes `scripts/sync-doc.js` and exposes only health + sync endpoints.

Environment variables (optional `.env` in this folder):

- `PORT` (default: `4444`)
- `MONGO_URI` (used by `sync-doc.js`, default: `mongodb://localhost:27017`)
- `MONGO_DB` (used by `sync-doc.js`, default: `impact`)
- `MONGOEXPORT_BIN` (optional explicit path to `mongoexport`)

Run from main project root:

```bash
npm run dev:backend
```

Generate backend `.env` from existing `env/` configs:

```bash
npm run env:backend:local
npm run env:backend:dev
npm run env:backend:uat
npm run env:backend:stage
npm run env:backend:prod
```

Or run frontend + backend together:

```bash
npm run dev:fullstack
```

Available endpoints:

- `GET /health`
- `POST /sync-doc`

Sample sync request:

```bash
curl -X POST http://localhost:4444/sync-doc \
  -H "Content-Type: application/json" \
  -d '{"key":"docid","value":"N181a1ffd-6769-4b36-ac3b-1b23a2806bc2"}'
```

Successful response includes:

- `ok: true`
- `docid`
- `output` (sync summary log)
