# Phase 12A-135 — Client Order MVR

Upload these files to the same paths in `robertk-saffhire/monitoring`:

- `api/index.ts`
- `public/client-portal.html`
- `supabase/migrations/20260719_phase12a135_mvr_order_requests.sql`

## Supabase

Run `supabase/migrations/20260719_phase12a135_mvr_order_requests.sql` in the Supabase SQL Editor before testing the button.

## What changed

- On the client Monitoring page, the `MVR Status` column is now labeled `Order MVR`.
- Eligible rows show the green `Order MVR` button.
- Clicking the button asks for confirmation, records a company-scoped request, and changes the master Monitoring MVR status to `Order Requested`.
- The client button changes to `Requested` while the request is pending.
- Terminated applicants cannot have an MVR ordered.
- Read-only client users see `View only` instead of an active order button.
- Notification emails go to active addresses in Settings > Notification Emails, using the existing Resend/SMTP setup.
- Every request is logged in `mvr_order_requests` with company, applicant, file number, user, date, and notification result.
- When a later TazWorks sync replaces `Order Requested` with a new MVR result, the button becomes available for a future order.

## Important workflow note

This button submits and logs an MVR order request for SaffHire to process. It does not invent or guess a direct TazWorks order-creation endpoint. The request is immediately visible in the master Monitoring table as `Order Requested`.

## SQL migration

Yes.

## Vercel environment variables

No new variables. It reuses the existing Monitoring notification email configuration.
