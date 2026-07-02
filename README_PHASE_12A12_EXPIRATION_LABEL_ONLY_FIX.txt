SAFFHIRE MONITORING - PHASE 12A-12 EXPIRATION LABEL ONLY FIX

Problem:
The MVR medical expiration sync was pulling the Medical Certificate Issue Date instead of the Expiration Date.

Example from sync log:
- Issue Date: 2026/03/26 was saved as Med Expire.
- That is wrong.

Fix:
The extractor now only accepts dates tied to:
- Expiration Date
- Expires
- Expiry
- Expire

It explicitly ignores:
- Issue Date

What changed:
- Updated api/index.ts only.
- No prebuild patch.
- No new API functions.
- No database schema change.

Files included:
- api/index.ts
- package.json
- .vercelignore
- index.html
- public/phase12a-tazworks-sync.js
- supabase/migrations/20260701_phase12a_tazworks_sync.sql
- README_PHASE_12A12_EXPIRATION_LABEL_ONLY_FIX.txt

SQL needed:
No if Phase 12A SQL already ran.

Vercel ENV needed:
No new ENV.

What to test:
1. Upload and redeploy.
2. Go to Settings.
3. Click Run TazWorks Sync Now.
4. Check the raw summary.
5. Confirm rawMatch says Expiration Date / Expires, not Issue Date.
6. Go to Monitoring.
7. Confirm Med Expire is the expiration date.

Important:
If a record already has the wrong issue date saved, rerunning sync should overwrite it when the true expiration date is found.
If no expiration label exists in the result, the sync will not update Med Expire.
