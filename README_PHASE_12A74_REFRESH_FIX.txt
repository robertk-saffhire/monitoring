Phase 12A-74 — Safety Performance Refresh Fix

Upload only:
- api/index.ts
- public/phase6.js

What changed:
- Safety Performance page Refresh now scans live TazWorks for file numbers greater than 6184.
- It does not stop just because it sees a single 6184 row in a mixed page.
- It only stops when a whole page is at/below 6184.
- Refresh prompts for the TazWorks host if it has not been saved yet.
- It uses the exact All Search Results style endpoint first and falls back to the per-search results route.
- It shows a more useful first error in the red toast if TazWorks returns errors.

SQL: no new SQL if prior Phase 12A-72 SQL has already been run.
ENV: no new ENV.
Build test: npm run build passed.
