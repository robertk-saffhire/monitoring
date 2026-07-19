# Phase 12A-127 — Client Terminated Access

Upload these files:

- `api/index.ts`
- `public/client-portal.html`
- `src/SettingsPage.jsx`

## What changed

- Added a new Client Access option named `Terminated`.
- Main admin Settings > Users now shows `Terminated` as a checkbox for client roles.
- Client Portal User Admin also shows `Terminated` as a checkbox.
- If `Terminated` is off for a client account:
  - terminated monitoring records are not returned to that client account,
  - the Terminated column is hidden,
  - the Terminated-only filter is hidden,
  - the account cannot edit Terminated status through the API.
- If `Terminated` is on and Edit Monitoring is on, the client can view and edit the Terminated checkbox.
- If `Terminated` is on but Edit Monitoring is off, the client can view Terminated but cannot edit it.

## Checks run

- `npm run build`
- `npx tsc --noEmit`
- `node --check` on the Client Portal script

## SQL

No SQL migration is required.

## Vercel ENV

No Vercel environment variable changes are required.
