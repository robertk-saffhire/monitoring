Phase 12A-67 - Safety Response Link Hard Fix

Files:
- api/index.ts
- public/phase6.js
- public/employer-response.html
- vercel.json

Fixes:
- Makes Response Link button detect the Safety Performance table by headers instead of fixed column numbers.
- Adds the Response Link button even if the Actions column is missing.
- Keeps the consolidated API route /api/index?path=safety-response-link.
- Adds rewrites so old /api/safety-response-link and /api/safety-response calls still work.
- Makes the employer response form try both new and old API paths.
- Adds diagnostic route:
  /api/index?path=safety-response-diagnostics&fileNumber=FILE_NUMBER

SQL needed:
- No

ENV needed:
- CRON_SECRET stays required for keepalive cron.
