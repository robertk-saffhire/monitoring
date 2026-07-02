SAFFHIRE MONITORING - PHASE 12A-10 MVR MEDICAL EXPIRATION SYNC

Requested change:
When TazWorks sync runs, check MVR searches and update the Monitoring Med Expire field when a medical expiration date is found.

What changed:
- For each synced order, the app pulls searches from:
  /tazworks/orders/<ORDER_GUID>/searches
- It detects MVR / Motor Vehicle / driving record searches.
- It pulls the EDITOR result for each MVR search.
- It scans the result for medical certificate expiration dates.
- It updates applicants.medExpire when a date is found.
- New records still default to Monitoring Off.
- Notes are not overwritten.

Files included:
- api/index.ts
- package.json
- .vercelignore
- index.html
- public/phase12a-tazworks-sync.js
- supabase/migrations/20260701_phase12a_tazworks_sync.sql
- README_PHASE_12A10_MVR_MEDICAL_EXPIRATION_SYNC.txt

SQL needed:
No if Phase 12A SQL was already run.
Yes if not already run:
supabase/migrations/20260701_phase12a_tazworks_sync.sql

Vercel ENV needed:
No new ENV.

Still required:
- TAZWORKS_PROXY_BASE_URL=https://tazworks-proxy.saffhire.com
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

What to test:
1. Upload these files.
2. Redeploy.
3. Login.
4. Go to Settings.
5. Click Run TazWorks Sync Now.
6. Review Med Dates in the sync log.
7. Go to Monitoring.
8. Confirm Med Expire dates are filled where MVR results included a medical expiration date.
