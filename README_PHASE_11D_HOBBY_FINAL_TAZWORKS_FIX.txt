SAFFHIRE MONITORING - PHASE 11D HOBBY FINAL TAZWORKS FIX

Problem:
Vercel Hobby is still blocking deployment:
“No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan.”

Why:
The files under api/orders still exist in the repo. Even a file that says “DELETE THIS FILE” still counts as a Serverless Function.

Fix in this phase:
- Adds .vercelignore to exclude:
  - api/orders.ts
  - api/orders/**
- Moves TazWorks proxy handling into existing api/[...path].ts catch-all function.
- index.html excludes /api/orders from the fetch wrapper so Vercel routes it to api/[...path].ts.
- public/phase11-tazworks-connection.js calls internal /api/orders routes.
- No new Serverless Functions are added.

Files included:
- .vercelignore
- index.html
- api/[...path].ts
- public/phase11-tazworks-connection.js
- README_PHASE_11D_HOBBY_FINAL_TAZWORKS_FIX.txt

Important:
This should deploy even if the old api/orders files remain in GitHub because .vercelignore excludes them from Vercel deployment.

Even better:
Delete these files from GitHub when convenient:
- api/orders.ts
- api/orders/[orderGuid]/searches.ts
- api/orders/[orderGuid]/searches/[searchGuid]/results.ts

SQL needed:
No.

Vercel ENV needed:
No new ENV.

Still needed for TazWorks:
- TAZWORKS_PROXY_BASE_URL=https://tazworks-proxy.saffhire.com
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

What to expect:
- Hobby serverless function limit error should go away.
- Settings should still show TazWorks Proxy Connection Test.
- Browser calls /api/orders only.
- /api/orders is handled by the existing catch-all function.
- Proxy secret and client GUID stay server-side.
