# Phase 12A-141 — Remove Client Controls from SaffHire User Sidebar

Upload:

- `public/phase9b-role-sync.js`

## What changed

- SaffHire Users no longer see the legacy CLIENT section.
- Removes Client View and Client Admin for all non-admin internal accounts.
- Removes Invoices for all non-admin internal accounts.
- Safety-only SaffHire Users no longer see Terminated or Monitoring On/Off.
- A SaffHire User assigned Monitoring keeps the Monitoring administrative tools.
- Main SaffHire Admin retains the existing client-management controls.
- A MutationObserver removes controls immediately if an older script attempts to recreate them.

## SQL

No migration required.

## Vercel ENV

No changes required.
