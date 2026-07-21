# Phase 12A-143 — Safety Performance Sync Stabilization

Upload only:

- `api/index.ts`
- `public/phase6.js`

No SQL migration is required.
No new Vercel environment variables are required.

The deployment must retain the existing TazWorks variables:

- `TAZWORKS_PROXY_BASE_URL`
- `TAZWORKS_PROXY_SECRET`
- `TAZWORKS_CLIENT_GUID`

`TAZWORKS_HOST` is optional. When present it is used server-side; the browser no longer asks users to enter it.
