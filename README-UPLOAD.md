# Phase 12A-138 — Clickable Client Monitoring Cards

Upload this file to the same path in `robertk-saffhire/monitoring`:

- `public/client-portal.html`

## What changed

The total cards at the top of the client Monitoring page are now clickable detail filters:

- Total Monitoring — shows all records available to that client user.
- On Monitoring — shows records with Monitoring On.
- Off Monitoring — shows records with Monitoring Off.
- Med Cert Expired — shows On Monitoring records with a medical certificate date before today.
- Med Cert 30 Days — shows On Monitoring records expiring today through the next 30 days.
- Terminated — shows terminated records when that user has Terminated Records access.

Additional behavior:

- The selected card is highlighted in green.
- Clicking a card clears the search box so the full detail count is shown.
- The dropdown changes to the matching filter and includes the two medical-certificate filters.
- Existing column sorting remains active.
- Automatic data refreshes preserve the selected card/filter.
- Card changes are blocked while a Monitoring row has unsaved edits, preventing data loss.

## Database / Supabase

No SQL migration is required.

## Vercel environment variables

No ENV changes are required.

## Validation

- Started from the current GitHub `main` Phase 12A-137 client portal file.
- The extracted client portal JavaScript passed `node --check`.
