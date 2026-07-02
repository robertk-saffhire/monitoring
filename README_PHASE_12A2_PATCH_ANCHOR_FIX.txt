SAFFHIRE MONITORING - PHASE 12A-2 PATCH ANCHOR FIX

Problem:
Phase 12A build failed:
Could not find async function auth anchor in api/index.ts

Cause:
The current api/index.ts no longer has that exact old function name.

Fix:
- Adds server/tazworksSync.ts with the sync logic.
- Replaces scripts/apply-phase12a.mjs with a flexible patch.
- The patch inserts an import into api/index.ts.
- The patch inserts routes using several possible route anchors.
- No new API function files are added.

SQL needed:
Yes, if not already run:
supabase/migrations/20260701_phase12a_tazworks_sync.sql

Vercel ENV needed:
- TAZWORKS_PROXY_BASE_URL=https://tazworks-proxy.saffhire.com
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

Files included:
- package.json
- .vercelignore
- index.html
- scripts/apply-phase12a.mjs
- server/tazworksSync.ts
- public/phase12a-tazworks-sync.js
- supabase/migrations/20260701_phase12a_tazworks_sync.sql
- README_PHASE_12A2_PATCH_ANCHOR_FIX.txt

Test:
1. Upload this package.
2. Run SQL if not already run.
3. Redeploy.
4. Login.
5. Go to Settings.
6. Click Run TazWorks Sync Now.
