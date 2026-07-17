Phase 12A-79 — Email Template Settings + Fax Template Selection

Upload only:
- api/index.ts
- public/phase6.js

Run the SQL in:
- supabase/phase12a79_email_templates.sql

What changed:
- Adds an Email Settings section to the Settings page.
- Allows multiple named fax/email templates.
- Each template has name, subject, body, and active/inactive status.
- Templates support placeholders:
  {{applicantName}}
  {{fileNumber}}
  {{previousEmployer}}
  {{recipientName}}
  {{faxNumber}}
  {{today}}
- Fax FMCSA modal now includes an Email Template dropdown.
- Selecting a template fills the subject and body for the eFax email.
- The server also renders placeholders before sending the fax email.

No new Vercel ENV variables beyond the Phase 12A-78 eFax settings.
