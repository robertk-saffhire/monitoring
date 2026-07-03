SAFFHIRE MONITORING - PHASE 12A-17 6328 MVR TEST PAGE

Requested change:
Create a test page showing everything pulled from the 6328 MVR search.

What changed:
- Adds a standalone test page:
  /mvr-test.html

- Adds a server-side API route inside existing api/index.ts:
  /api/index?path=tazworks-mvr-test&fileNumber=6328

- Adds a Settings link card:
  6328 MVR Test Page

What the test page shows:
- Order data
- Raw order payload
- Pages searched
- All searches pulled
- Each search row raw data
- Search GUIDs
- Whether each search is detected as MVR
- Search row displayValue/text
- Search row certificate preview
- Search row date diagnostics
- EDITOR result payload
- No-resultType payload
- Cleaned text previews
- Certificate/medical previews
- Date extraction diagnostics
- Full API response JSON

Security:
- Browser does not call TazWorks directly.
- Browser does not receive proxy secret.
- Test route is admin-only.
- All TazWorks calls happen server-side through the existing proxy.

Files included:
- api/index.ts
- index.html
- public/mvr-test.html
- public/phase12a17-mvr-test-link.js
- existing support files from Phase 12A-16

SQL needed:
No.

Vercel ENV needed:
No new ENV.

Still required:
- TAZWORKS_PROXY_BASE_URL
- TAZWORKS_PROXY_SECRET
- TAZWORKS_CLIENT_GUID

How to test:
1. Upload and redeploy.
2. Login as admin.
3. Go to:
   /mvr-test.html
4. It defaults to file 6328.
5. Click Pull MVR Test Data.
6. Review Search Row, Result Variants, Certificate Preview, and Date Diagnostics.
