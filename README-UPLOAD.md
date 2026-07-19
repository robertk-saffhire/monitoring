# Phase 12A-130 — Client Portal Terminated Left Menu

Upload these files:

- `api/index.ts`
- `public/client-portal.html`

## What changed

- Adds a separate **Terminated** button to the left client portal menu.
- The button only appears when the logged-in client user has both Monitoring access and Terminated Records access.
- Clicking **Terminated** opens a dedicated Terminated page showing terminated monitoring records.
- The Terminated page uses the same Monitoring table controls, so users with Edit Monitoring + Terminated Records can edit/save terminated status and notes.
- Adds a dedicated server-side terminated applicants list so the Terminated page is not dependent on the normal Monitoring page filter.

## SQL

No SQL changes.

## ENV

No ENV changes.
