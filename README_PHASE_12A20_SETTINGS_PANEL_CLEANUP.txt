SAFFHIRE MONITORING - PHASE 12A-20 SETTINGS PANEL CLEANUP

Problem:
After running TazWorks Sync Now and navigating to Monitoring, the TazWorks Manual Sync panel, raw sync summary, and 6328 MVR Test Page card were still showing above Monitoring.

Cause:
The app is a single-page app. The Settings-only panels were added to the DOM and were not removed when navigating to Monitoring.

Fix:
- Adds public/phase12a20-settings-panel-cleanup.js
- The cleanup removes Settings-only panels when the active page is not Settings.
- It removes:
  - TazWorks Manual Sync
  - Latest raw sync summary
  - 6328 MVR Test Page card
- It does not remove Monitoring Alerts or the Monitoring table.
- Also patches the TazWorks sync script and MVR test link script with a small safety cleanup tail.

Files included:
- index.html
- public/phase12a20-settings-panel-cleanup.js
- public/phase12a-tazworks-sync.js
- public/phase12a17-mvr-test-link.js
- existing Phase 12A-19 files
- README_PHASE_12A20_SETTINGS_PANEL_CLEANUP.txt

SQL needed:
No.

Vercel ENV needed:
No new ENV.

What to test:
1. Upload and redeploy.
2. Hard refresh.
3. Go to Settings.
4. Confirm TazWorks Manual Sync still appears.
5. Click Run TazWorks Sync Now.
6. Go to Monitoring.
7. Confirm the sync panel/raw summary/test card are gone.
8. Confirm Monitoring Alerts and Monitoring table still show normally.
