# Phase 12A-126 — Monitoring Email Diagnostics + Resend Fallback Fix

Upload these files:

- api/index.ts
- public/client-portal.html

No SQL migration is required.

Vercel ENV:
- Uses the existing Resend API key if `RESEND_API_KEY` is already set.
- Also checks `MONITORING_RESEND_API_KEY`, `SAFETY_RESEND_API_KEY`, `FAX_RESEND_API_KEY`, and `EFAX_RESEND_API_KEY`.
- Requires a valid from email from one of: `MONITORING_FROM_EMAIL`, `SAFETY_FROM_EMAIL`, `EMAIL_FROM`, `SMTP_FROM`, `SMTP_USER`, `FAX_FROM`, `FAX_SMTP_USER`.

What changed:
- Client Monitoring On/Off saves now return the email notification result.
- The client portal toast now says whether the notification email sent or failed.
- Monitoring emails now support display-name from addresses like `SaffHire <name@domain.com>`.
- Monitoring emails can reuse the same Resend key/env family used by eFax.
- Client Monitoring update now includes MVR status and Med Cert expiration in the notification body.
