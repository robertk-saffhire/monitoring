SAFFHIRE MONITORING - PHASE 12A-4 SAFE MANUAL TAZWORKS SYNC

This build uses the exact api/index.ts file you uploaded and adds the TazWorks sync directly into it.
No prebuild patch is used.

What changed:
- api/index.ts is directly updated with:
  - tazworks-sync/run
  - tazworks-sync/runs
- Settings shows:
  - TazWorks Manual Sync
  - Run TazWorks Sync Now
  - Refresh Sync Log
- No new API function files are added.
- api/[...path].ts and api/orders files remain ignored by Vercel.

Files included:
- api/index.ts
- package.json
- .vercelignore
- index.html
- public/phase12a-tazworks-sync.js
- supabase/migrations/20260701_phase12a_tazworks_sync.sql
- README_PHASE_12A4_SAFE_MANUAL_TAZWORKS_SYNC.txt

SQL needed:
Yes. Run:
supabase/migrations/20260701_phase12a_tazworks_sync.sql

Vercel ENV needed:
- TAZWORKS_PROXY_BASE_URL=https://tazworks-proxy.saffhire.com
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

What to test:
1. Upload these files.
2. Run SQL if not already run.
3. Redeploy Vercel.
4. Login.
5. Go to Settings.
6. Click Run TazWorks Sync Now.

Expected:
- Login stays working.
- Sync log loads.
- Manual sync pulls recent orders through the proxy.
- Monitoring applicants are upserted by file number.
- Existing Safety Performance records are updated by file number when matched.
