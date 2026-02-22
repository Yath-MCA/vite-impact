# GraphQL wrapper (testing)

This small wrapper exposes a GraphQL endpoint for quick testing by proxying your existing REST `shareandinvite` endpoint.

Environment variables (create a `.env` file in this folder):

- `BACKEND_URL` (default: `http://localhost:8080`)
- `API_PATH` (default: `/api/`)
- `APP_KEY` (appkey header)
- `API_KEY` (apikey header)
- `PORT` (default: `4000`)

Install and run:

```bash
cd graphql-wrapper
npm install
npm start
```

Sample GraphQL query:

```graphql
query {
  shareinvite(identifier: "10.1093/stcltm/szad014") {
    id
    identifier
    inviter
    invitee
    createdAt
    status
  }
}
```
