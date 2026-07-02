SAFFHIRE MONITORING - PHASE 12A MANUAL TAZWORKS SYNC FOUNDATION

Purpose:
Manual server-side TazWorks sync foundation.

This phase does NOT schedule automatic sync yet.
It adds a Settings button so we can verify the TazWorks data before running it several times per day.

What it adds:
- SQL sync tables:
  - tazworks_sync_runs
  - tazworks_order_cache
- Manual sync route inside existing api/index.ts:
  - /api/index?path=tazworks-sync/run
  - /api/index?path=tazworks-sync/runs
- Settings panel:
  - TazWorks Manual Sync
  - Run TazWorks Sync Now
  - Sync log table
- Keeps Vercel Hobby plan safe:
  - No new API function files
  - Uses existing api/index.ts only
  - .vercelignore keeps old experimental api/orders files out

How the api/index.ts update works:
- package.json adds a prebuild script:
  node scripts/apply-phase12a.mjs
- During Vercel build, the patch script injects the TazWorks sync route into api/index.ts.
- It is idempotent and will not duplicate the patch.

Security:
- Browser never calls TazWorks or the proxy directly.
- Proxy secret stays server-side.
- Client GUID comes from Vercel ENV only.
- Manual sync requires logged-in admin.
- Read-only GET calls to the proxy only.

Required Vercel ENV:
- TAZWORKS_PROXY_BASE_URL=https://tazworks-proxy.saffhire.com
- TAZWORKS_PROXY_SECRET=<proxy secret>
- TAZWORKS_CLIENT_GUID=<locked client GUID>

SQL needed:
Yes.
Run:
supabase/migrations/20260701_phase12a_tazworks_sync.sql

Vercel ENV needed:
Yes, if not already added:
- TAZWORKS_PROXY_BASE_URL
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

Install:
1. Upload all files.
2. Run the SQL migration in Supabase.
3. Make sure Vercel build command is:
   npm run build
4. Redeploy Vercel.
5. Login.
6. Go to Settings.
7. Find TazWorks Manual Sync.
8. Click Run TazWorks Sync Now.

What it updates:
- tazworks_order_cache
- applicants Monitoring records by file number
- existing safety_reports applicantName when fileNumber matches

What it does NOT overwrite:
- Monitoring notes
- Safety Performance notes
- Manual medical expiration overrides

Next phase:
Phase 12B should add scheduled GitHub Actions calls after manual sync is verified.
