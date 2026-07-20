# Phase 12A-139 — Four Daily Automatic Syncs

Upload these files to `robertk-saffhire/monitoring`:

- `api/index.ts`
- `vercel.json`
- `.github/workflows/monitoring-auto-sync.yml`
- `supabase/migrations/20260720_phase12a139_auto_sync_runs.sql`

## Schedule

The GitHub Actions workflow runs at these America/Chicago times every day:

- 8:00 AM
- 10:00 AM
- 2:00 PM
- 4:00 PM

The workflow uses a timezone-aware schedule, so daylight saving time is handled automatically.

## Why GitHub Actions schedules the four runs

Vercel Hobby projects cannot deploy cron expressions that run more than once per day. The app keeps its existing once-daily Vercel database keepalive, while GitHub Actions securely calls the new auto-sync endpoint four times per day.

## Required setup

1. Run `supabase/migrations/20260720_phase12a139_auto_sync_runs.sql` in Supabase SQL Editor.
2. Confirm Vercel has `CRON_SECRET` set to a random value of at least 16 characters.
3. In GitHub repository Settings > Secrets and variables > Actions, create:
   - `AUTO_SYNC_URL` = the production app base URL, such as `https://monitoring-beta-one.vercel.app`
   - `CRON_SECRET` = exactly the same value used in Vercel
4. Deploy the repository to Vercel.
5. Open GitHub > Actions > SaffHire Monitoring Auto Sync and use **Run workflow** once to test it.

## What each scheduled run does

- Pulls up to two safe recent-order batches into Monitoring during each scheduled run.
- Creates or updates Monitoring records and checks recent MVR medical expiration information.
- Scans recent TazWorks orders for missing Safety Performance reports.
- Creates missing Safety Reports without overwriting client-completed Safety workflow data.
- Records each scheduled slot in `auto_sync_runs`.
- Prevents concurrent or duplicate runs for the same scheduled slot.
- Allows up to three retries when a run is failed or partial.

## Optional Vercel environment tuning

- `AUTO_SYNC_COMPANY_ID=1`
- `AUTO_SYNC_SAFETY_MIN_FILE_NUMBER=6184`
- `AUTO_SYNC_SAFETY_MAX_PAGES=10`
- `AUTO_SYNC_SAFETY_MAX_CANDIDATES=25`
- `AUTO_SYNC_SAFETY_BUDGET_MS=25000`
- `TAZWORKS_HOST` only if the proxy requires the host to be passed explicitly

The existing TazWorks variables remain required:

- `TAZWORKS_PROXY_BASE_URL`
- `TAZWORKS_PROXY_SECRET`
- `TAZWORKS_CLIENT_GUID`

## Database / environment

- SQL migration: Yes
- New required Vercel ENV: No, assuming `CRON_SECRET` already exists
- New required GitHub Actions secrets: `AUTO_SYNC_URL` and `CRON_SECRET`
