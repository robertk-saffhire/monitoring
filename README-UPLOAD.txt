Phase 12A-93 — Fax Debug Details

Upload only these files:
- api/index.ts
- public/phase6.js

What changed:
- Fax FMCSA now returns a debug object after the email is handed to the eFax email gateway.
- The Fax popup now stays open after sending and shows Fax Debug details.
- You can copy the debug details.
- Debug details include eFax destination email, From email, Reply-To, eFax domain, fax number digits, template used, subject, PDF attachment status, filename, and Resend message ID.

SQL: No SQL needed.
Vercel ENV: No ENV changes needed.
