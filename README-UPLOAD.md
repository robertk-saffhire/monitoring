# Phase 12A-142 — Native Email Settings Navigation Fix

Upload these files to the same paths in `robertk-saffhire/monitoring`:

- `src/main.jsx`
- `index.html`
- `public/phase12a142-native-email-settings.js`

## What changed

- Rebuilt Email Settings as a native React page.
- Added Email Settings directly to the React sidebar for the main Admin and SaffHire Users assigned Safety Performance Reports.
- Dashboard, Safety Performance, and Email Settings now change through the same React page state.
- Added a guard that removes the older Phase 12A-80 Email Settings button before it can replace the React main panel.
- If a cached legacy button is clicked before removal, the click is redirected to the native Email Settings page.
- Existing email templates, template fields, active/inactive setting, save, create, and delete actions remain available.

## Expected result

A Safety Admin can open Email Settings, then click Dashboard or Safety Performance without a white screen or page refresh.

## SQL migration

No.

## Vercel environment variables

No changes.
