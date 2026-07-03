SAFFHIRE MONITORING - PHASE 12A-21 REFRESH BUTTON FIX

Problem:
- Refresh Sync Log was not working.
- The top-right Refresh button was not working.

Fix:
- Adds public/phase12a21-refresh-button-fix.js
- Rebinds Refresh Sync Log to:
  /api/index?path=tazworks-sync/runs
- Re-renders the sync run table and latest raw summary.
- Adds a fallback for the top-right Refresh button.
- The fallback re-clicks the active sidebar page to reload the current view.
- On Monitoring, it also nudges Recalculate Alerts so the alert totals refresh.

Files included:
- index.html
- public/phase12a21-refresh-button-fix.js
- existing Phase 12A-20 files
- README_PHASE_12A21_REFRESH_BUTTON_FIX.txt

SQL needed:
No.

Vercel ENV needed:
No new ENV.

What to test:
1. Upload and redeploy.
2. Hard refresh.
3. Go to Settings.
4. Click Refresh Sync Log.
5. Confirm the sync table refreshes.
6. Go to Monitoring.
7. Click the top-right Refresh button.
8. Confirm the Monitoring view refreshes and alert totals stay correct.
