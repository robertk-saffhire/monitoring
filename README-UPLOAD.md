# Phase 12A-125 — Monitoring On/Off Email Notifications

Upload this file:

- `api/index.ts`

What changed:

- When a Monitoring record changes from Off to On, or On to Off, the server now sends an email notification.
- Recipients come from active rows in Settings > Notification Emails.
- Also supports optional comma/semicolon separated ENV fallback: `MONITORING_NOTIFY_EMAILS`.
- The notification includes company, applicant, file number, previous/new monitoring status, MVR status, med cert date, changed by, and timestamp.
- The status change still succeeds even if email sending fails; the failure is logged into the monitoring on/off export row raw details.

Email provider:

Use either Resend:

- `RESEND_API_KEY`
- `EMAIL_FROM` or `SAFETY_FROM_EMAIL`

Or SMTP:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Optional SMTP overrides:

- `MONITORING_SMTP_HOST`
- `MONITORING_SMTP_PORT`
- `MONITORING_SMTP_USER`
- `MONITORING_SMTP_PASS`
- `MONITORING_SMTP_SECURE`
- `MONITORING_FROM_EMAIL`
- `MONITORING_REPLY_TO_EMAIL`

No SQL migration required.
