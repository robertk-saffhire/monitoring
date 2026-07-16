Phase 12A-73 — Safety Performance Refresh Live TazWorks Pull

Upload only:
- api/index.ts
- public/phase6.js

What changed:
- The live Safety Performance scan no longer appears in the PDF Import card.
- The Safety Performance page Refresh button now triggers the live TazWorks scan.
- The scan checks new orders and stops when it reaches file/order 6184.
- New Safety Performance reports are auto-created when a matching Safety Performance and DOT Verification search is found.
- Existing reports are updated rather than duplicated.
- Each created/updated report keeps the Applicant Link, Employer Link, and Pull Live Info row actions.

SQL:
- No new SQL if Phase 12A-72 SQL has already been run.
