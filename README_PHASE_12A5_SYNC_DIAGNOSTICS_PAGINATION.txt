SAFFHIRE MONITORING - PHASE 12A-5 SYNC DIAGNOSTICS + PAGINATION

Problem:
Manual sync is not pulling in new orders.

Likely causes:
- The proxy response shape is different than expected.
- Only one page was being pulled.
- We did not have enough raw sync diagnostics.

What changed:
- Pulls pages 0 through 4.
- Uses size=10 to match the proxy spec.
- Detects order arrays in several response shapes:
  - root
  - content
  - orders
  - items
  - data
  - results
  - response.content
  - response.orders
  - _embedded.orders
  - nested arrays up to depth 3
- Saves diagnostics to tazworks_sync_runs.raw_summary:
  - page
  - arrayPath
  - arrayCount
  - topLevelKeys
  - errors
- Settings panel shows raw sync summary.

Files included:
- api/index.ts
- package.json
- .vercelignore
- index.html
- public/phase12a-tazworks-sync.js
- supabase/migrations/20260701_phase12a_tazworks_sync.sql
- README_PHASE_12A5_SYNC_DIAGNOSTICS_PAGINATION.txt

SQL needed:
No if Phase 12A SQL was already run.
Yes if not already run:
supabase/migrations/20260701_phase12a_tazworks_sync.sql

Vercel ENV needed:
- TAZWORKS_PROXY_BASE_URL=https://tazworks-proxy.saffhire.com
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

What to test:
1. Upload these files.
2. Redeploy.
3. Login.
4. Go to Settings.
5. Click Run TazWorks Sync Now.
6. Look at the raw sync summary.
7. If Orders is 0, send me the raw sync summary shown in the panel.

Expected:
- If the proxy returns orders, they should now be detected and saved.
- If orders are still 0, the raw summary will show what the proxy returned structurally.
