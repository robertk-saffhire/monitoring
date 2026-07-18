Phase 12A-97 — Monitoring Page Refresh + Data Sync

Upload only these files:
- api/index.ts
- public/phase6.js

No SQL migration needed.
No Vercel ENV changes needed, assuming the existing TazWorks ENV variables are already set.

After upload and redeploy:
1. Go to Monitoring.
2. You should see Page Refresh and Data Sync in the header.
3. Page Refresh reloads the page/current Supabase data.
4. Data Sync pulls recent TazWorks orders, updates/creates Monitoring records, then reloads the page.
