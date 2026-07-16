Phase 12A-66 - Safety Response Link Fix

Files:
- api/index.ts
- public/phase6.js
- public/employer-response.html

Fix:
- Moves old /api/safety-response-link into consolidated /api/index?path=safety-response-link
- Moves old /api/safety-response into consolidated /api/index?path=safety-response
- Updates the Safety Performance page button to use consolidated API
- Updates employer response form to load/save through consolidated API

SQL needed:
- No

Vercel ENV needed:
- No new ENV
