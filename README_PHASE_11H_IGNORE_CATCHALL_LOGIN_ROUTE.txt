SAFFHIRE MONITORING - PHASE 11H IGNORE CATCHALL + LOGIN ROUTE FIX

Problem:
Login still fails with FUNCTION_INVOCATION_FAILED.

Likely cause:
The catch-all file api/[...path].ts is still being deployed.
The previous .vercelignore pattern likely did not match because brackets have special meaning.

Fix:
1. Strengthens .vercelignore with escaped and fallback patterns:
   - api/\[...path\].ts
   - api/\[\.\.\.path\].ts
   - api/*path*.ts
   - api/orders.ts
   - api/orders/**

2. Adds vercel.json rewrites so login and main app API routes go to:
   - /api/index?path=...

3. Keeps TazWorks panel disabled until login is stable.

Files included:
- .vercelignore
- vercel.json
- index.html
- public/phase11-tazworks-connection.js
- README_PHASE_11H_IGNORE_CATCHALL_LOGIN_ROUTE.txt

SQL needed:
No.

Vercel ENV needed:
No.

What to test:
1. Upload these files.
2. Redeploy Vercel.
3. Hard refresh.
4. Login.

If login still fails:
Send the Vercel Function Logs for api/index. At that point the catch-all should be excluded.
