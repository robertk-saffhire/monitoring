SAFFHIRE MONITORING - PHASE 12A-13 CERTIFICATE SECTION EXPIRATION FIX

Problem:
After Phase 12A-12, no dates were being pulled. File 6328 has a medical expiration date, but the log showed:
- fileNumber 6328
- searchesPulled: 1
- mvrSearches: 0
- resultPulls: 0

That means the app never pulled the result because TazWorks did not label that search as MVR.

Fixes:
1. If no MVR-labeled search is found, the sync now scans all searches for that order as a fallback.
2. The date extractor now scans the Medical Certificate / Certificate Information section first.
3. It only accepts dates tied to:
   - Expiration Date
   - Expires
   - Expiry
   - Expire
4. It ignores Issue Date.
5. The sync summary now shows fallbackAllSearches and fallbackCandidate so we can see when the fallback was used.

Expected for file 6328:
- searchesPulled should still be 1.
- fallbackAllSearches should be true.
- resultPulls should be 1.
- If the result contains Certificate Information + Expiration Date, medExpire should populate.

Files included:
- api/index.ts
- package.json
- .vercelignore
- index.html
- public/phase12a-tazworks-sync.js
- supabase/migrations/20260701_phase12a_tazworks_sync.sql
- README_PHASE_12A13_CERTIFICATE_SECTION_EXPIRATION.txt

SQL needed:
No if Phase 12A SQL already ran.

Vercel ENV needed:
No new ENV.

What to test:
1. Upload and redeploy.
2. Settings -> Run TazWorks Sync Now.
3. Check file 6328 in the raw summary.
4. Confirm fallbackAllSearches is true and resultPulls is 1.
5. Confirm rawMatch contains Expiration Date, not Issue Date.
6. Go to Monitoring and confirm Med Expire populated.
