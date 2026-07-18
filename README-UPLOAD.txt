Phase 12A-99 - Stop Sidebar Reload Monitoring Blink

Upload this file:
public/phase6.js

What changed:
- Removes the old Reload Monitoring sidebar button.
- Adds a MutationObserver cleanup so older scripts cannot reinsert it and make it blink.
- Keeps Monitoring page Page Refresh and Data Sync buttons.
