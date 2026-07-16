SAFFHIRE MONITORING - PHASE 12A-71 LIVE SAFETY PERFORMANCE PULL

Purpose:
Pull Safety Performance and DOT Verification information from TazWorks All Search Results and save it into the matching Safety Performance report.

New admin workflow:
1. Go to Safety Performance.
2. Click Pull Live Info on a report row.
3. Enter host, client GUID, and order GUID from Postman.
   - Client GUID can be left blank if Vercel ENV TAZWORKS_CLIENT_GUID is already set.
   - Order GUID can be left blank only if TazWorks sync already cached the order for that file number.
4. The app pulls All Search Results through the server/proxy.
5. If a search named Safety Performance and DOT Verification exists, the app fills:
   - Applicant Name
   - Previous Employer Name
   - Previous Employer Email
   - Previous Employer Street
   - Previous Employer Phone
   - Previous Employer City/State/Zip
   - Job Title
   - From Date / Hire Date
   - Live sync metadata
6. If no Safety Performance and DOT Verification search exists, the app saves a no_safety_search status and does not overwrite report fields.

Security:
- Browser does not call TazWorks directly.
- Browser calls /api/index?path=safety-reports/live-pull.
- Server calls the existing TazWorks proxy with the proxy secret.

Files changed:
- api/index.ts
- public/phase6.js

SQL needed:
- supabase/phase12a71_live_safety_pull.sql

Vercel ENV needed:
No new ENV if these already exist:
- TAZWORKS_PROXY_BASE_URL
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

Notes:
- Not every order has Safety Performance and DOT Verification.
- The route checks for type EMPLOYMENT_VERIFICATION and displayName/displayValue matching Safety Performance / DOT Verification.
- The route stores the raw matched Safety search in liveSafetyRaw for troubleshooting.
