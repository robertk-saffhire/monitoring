# Phase 12A-133 — Dynamic Monitoring Totals

Upload these files to the same paths in the `robertk-saffhire/monitoring` repository:

- `public/client-portal.html`
- `public/phase6.js`

## What changed

- Client Monitoring totals now reload from the server immediately after a Monitoring record is saved.
- Monitoring On/Off changes update the totals automatically.
- Terminated changes update the totals automatically.
- Record edits reload fresh totals and table data after saving.
- Save All Changed saves each row, then performs one fresh totals reload.
- Monitoring Data Sync now broadcasts a completion signal to open client portal tabs.
- Open client portal tabs refresh immediately after Data Sync completes in another tab on the same browser.
- Dashboard, Monitoring, and Terminated pages check for new records every 30 seconds.
- Returning to the tab or focusing the window also checks for current totals.
- Dashboard requests use `cache: no-store` so an old browser response is not reused.
- Automatic refresh pauses while a Monitoring row has unsaved changes, including while notes are being typed.

## Database / Supabase

No SQL migration needed.

## Vercel environment variables

No ENV changes needed.

## Validation

- `public/phase6.js` passed `node --check`.
- The JavaScript extracted from `public/client-portal.html` passed `node --check`.
- The starting files match the current GitHub `main` versions used for Phase 12A-132 and Phase 12A-131.
