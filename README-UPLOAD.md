# Phase 12A-136 — Permanent Safety Button Deduplication

Upload these files to the same paths in `robertk-saffhire/monitoring`:

- `public/phase6.js`
- `public/phase7.js`
- `public/phase7a-fmcsa.js`

## Root cause

The native React `SafetyLinks` component already renders one working set of Safety Report actions. Two older scripts were still running on timers:

- `public/phase7.js` inserted another `Client Gmail` and `Mark Completed` group.
- `public/phase7a-fmcsa.js` inserted another `FMCSA PDF` button.

The older cleanup skipped the Links cell whenever it found the native React group, so legacy buttons inserted into that same cell survived.

## What changed

- Retired the Phase 7 and Phase 7A row-button injectors.
- Removed their old informational panels.
- Made the Phase 6 cleanup treat the React `.safety-links-native` group as the only allowed content in the Links cell.
- Removed duplicate Safety action buttons from every other cell in the same row.
- Added a MutationObserver so a stale/cached legacy insertion is removed immediately.
- Kept one working button for each action:
  - Applicant Link
  - Employer Link
  - FMCSA PDF
  - Fax FMCSA
  - Client Gmail
  - Mark Completed

## SQL migration

No.

## Vercel environment variables

No changes.
