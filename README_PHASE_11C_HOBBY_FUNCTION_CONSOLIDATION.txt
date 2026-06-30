SAFFHIRE MONITORING - PHASE 11C HOBBY PLAN FUNCTION CONSOLIDATION

Problem:
Vercel Hobby allows no more than 12 Serverless Functions per deployment.
Phase 11 added 3 new function files:
- api/orders.ts
- api/orders/[orderGuid]/searches.ts
- api/orders/[orderGuid]/searches/[searchGuid]/results.ts

Fix:
Do not add separate API functions.
Use the existing /api/index?path=... function.

What changed in this ZIP:
- index.html no longer excludes /api/orders from the fetch wrapper.
- Browser TazWorks test panel calls /api/index?path=orders...
- Added marker files showing which Phase 11 API files should be deleted.
- Included API_INDEX_PATCH_NOTES_PHASE_11C.txt with the code that must be added into api/index.ts.

IMPORTANT:
For the Hobby plan, delete these files from the repo:
- api/orders.ts
- api/orders/[orderGuid]/searches.ts
- api/orders/[orderGuid]/searches/[searchGuid]/results.ts

Then move the TazWorks route logic into api/index.ts.

Files included:
- index.html
- public/phase11-tazworks-connection.js
- API_INDEX_PATCH_NOTES_PHASE_11C.txt
- marker files for API files to delete
- README_PHASE_11C_HOBBY_FUNCTION_CONSOLIDATION.txt

SQL needed:
No.

Vercel ENV needed:
No new ENV.

Still needed for the TazWorks connection:
- TAZWORKS_PROXY_BASE_URL
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

What you should expect:
- Deployment should stay under the Hobby serverless function limit.
- Settings still shows TazWorks Proxy Connection Test.
- The browser only calls /api/index.
- Proxy secret and client GUID stay server-side.
