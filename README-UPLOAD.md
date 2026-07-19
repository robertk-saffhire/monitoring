# Phase 12A-131 — Data Sync Timeout Fix

Upload these files:

- `api/index.ts`
- `public/phase6.js`

## What changed

- Data Sync now runs in smaller safe batches instead of one long Vercel function call.
- Backend caps each TazWorks sync request so it returns before the Hobby timeout.
- TazWorks proxy fetches now have a timeout instead of hanging the function.
- MVR/medical-date scans are limited per batch so one slow order does not take down the whole sync.
- Monitoring page Data Sync now sends sequential safe batches from the browser.

## SQL

No SQL migration needed.

## Vercel ENV

No required ENV changes.

Optional tuning:

- `TAZWORKS_SYNC_BUDGET_MS` default 7500
- `TAZWORKS_FETCH_TIMEOUT_MS` default 4500

For Vercel Hobby, keep these under about 8500ms and 8000ms.
