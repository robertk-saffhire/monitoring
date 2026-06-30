SAFFHIRE MONITORING - PHASE 11B BCRYPT + ES2021 BUILD FIX

Problem:
After the Node types fix, Vercel moved forward but found two remaining TypeScript/build issues:

1. bcryptjs is imported by api/index.ts and api/[...path].ts, but bcryptjs is missing from package.json.
2. replaceAll is being used in api/index.ts, but the TypeScript lib target was not high enough.

Fix:
- Adds bcryptjs to dependencies.
- Adds @types/bcryptjs to devDependencies.
- Updates tsconfig target/lib to ES2021 so replaceAll is recognized.
- Keeps Node types from Phase 11A.

Files included:
- package.json
- tsconfig.json
- README_PHASE_11B_BCRYPT_ES2021_BUILD_FIX.txt

SQL needed:
No.

Vercel ENV needed:
No new ENV for this fix.

Still needed for Phase 11 TazWorks connection test:
- TAZWORKS_PROXY_BASE_URL
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

Install:
1. Upload package.json and tsconfig.json over the project.
2. Redeploy Vercel.
3. Confirm the bcryptjs and replaceAll TypeScript errors are gone.
