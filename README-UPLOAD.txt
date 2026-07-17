Phase 12A-94 — Fax Through Gmail SMTP

Upload only these files:
- api/index.ts
- package.json

Then add these Vercel ENV variables:
- FAX_SMTP_HOST=smtp.gmail.com
- FAX_SMTP_PORT=465
- FAX_SMTP_SECURE=true
- FAX_SMTP_USER=robertk@saffhire.com
- FAX_SMTP_PASS=<Google app password>
- FAX_FROM=robertk@saffhire.com
- EFAX_SEND_DOMAIN=efaxsend.com

No SQL changes are required.
