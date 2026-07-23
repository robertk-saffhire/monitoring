# Phase 12A-146 — Client Monitoring Search and Refresh Fix

Upload only:

- `public/client-portal.html`

## What changed

1. Monitoring search keeps keyboard focus and cursor position while filtering, so users can type a complete file number, name, status, or note without the cursor disappearing after one character.
2. The same focus-safe behavior is applied to Terminated and Safety search fields.
3. Automatic background refresh pauses while a portal input, textarea, or dropdown is actively being used.
4. The top-right Refresh button resets the current page view before loading fresh data:
   - Monitoring: clears search, returns to Active only, and clears column sorting.
   - Terminated: clears search and sorting.
   - Safety Reports: clears search and returns to All statuses.
5. After saving an individual Monitoring record, clicking Refresh now returns the Monitoring page to the full active-file list.

SQL migration: No
Vercel environment variables: No changes
