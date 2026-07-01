SAFFHIRE MONITORING - PHASE 11G REMOVE CATCH-ALL LOGIN FIX

Problem:
Login still fails with FUNCTION_INVOCATION_FAILED.

Cause:
The catch-all file api/[...path].ts is still being deployed and is still interfering with login.

Fix:
This phase tells Vercel to exclude:
- api/[...path].ts
- api/orders.ts
- api/orders/**

The app goes back to the working API pattern:
- Browser calls /api/auth/login
- index.html rewrites it to /api/index?path=auth/login
- api/index.ts handles login

Files included:
- .vercelignore
- index.html
- public/phase11-tazworks-connection.js
- README_PHASE_11G_REMOVE_CATCHALL_LOGIN_FIX.txt

SQL needed:
No.

Vercel ENV needed:
No.

What to test:
1. Upload these files.
2. Redeploy Vercel.
3. Hard refresh.
4. Login.

Important:
If login still fails, check Vercel Function Logs for api/index. The catch-all will no longer be deployed after this phase.
