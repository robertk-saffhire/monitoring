# Phase 12A-118 — Applicant Link Editable Form Fix

Upload these files:

- api/index.ts
- api/safety-response-link.ts
- api/safety-response.ts
- src/main.jsx
- public/employer-response.html

What changed:

- Fixes Applicant Link opening as an employer-only/locked form.
- Removes stale direct API route behavior by forwarding direct public response endpoints into the current consolidated api/index.ts route handler.
- Updates React to call the consolidated route directly when creating Safety response links.
- Keeps the public response form file included so applicant/employer role locking is current.

No SQL or Vercel ENV changes needed.
