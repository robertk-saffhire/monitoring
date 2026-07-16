Phase 12A-70 - Applicant + Employer response links

Changed files:
- api/index.ts
- public/employer-response.html
- public/phase6.js

What changed:
- Safety Performance now supports two secure response link types: Applicant Link and Employer Link.
- Applicant Link lets the applicant edit/verify Section 1 and type an electronic signature.
- Employer Link shows Section 1 read-only, including the applicant signature if completed, and lets the previous employer complete Sections 2-5.
- Applicant signatures are stored in the existing notes field using an internal marker, so no SQL migration is required.

Upload only the three changed files above unless replacing the full project.
