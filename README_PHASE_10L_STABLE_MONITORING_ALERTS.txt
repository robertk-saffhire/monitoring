SAFFHIRE MONITORING - PHASE 10L STABLE MONITORING ALERTS

Problems fixed:
1. Monitoring Alerts card was present but not updating with current data.
2. Phase 9 Permissions card kept flashing back onto the Monitoring page.

Cause:
Several overlay scripts were fighting each other:
- Older Phase 8 script created/updated the alert card.
- Phase 9 script recreated the permissions card.
- Cleanup scripts removed those cards after they appeared.

Fix:
This phase creates one stable Monitoring Alerts card and removes/hides the older conflicting cards on the Monitoring page.

What this phase does:
- Replaces the old Phase 8 card with a stable Monitoring Alerts card.
- Recalculates from actual table values:
  - Monitoring select value
  - Med Expire input value
- Stops Phase 9 Permissions card from flashing on Monitoring.
- Keeps sorting by:
  - File #
  - Name
  - Order Date
  - Med Expire
- Keeps useful Med Expire badges:
  - Medical expired
  - Medical expires X days
- Does not show OK or Missing medical date badges in rows.

Files included:
- index.html
- public/phase10l-stable-monitoring-alerts.js
- README_PHASE_10L_STABLE_MONITORING_ALERTS.txt

SQL needed:
No.

Vercel ENV needed:
No.

Install:
1. Upload these files over the project.
2. Redeploy Vercel.
3. Hard refresh the browser.
4. Go to Monitoring.
5. Confirm Phase 9 Permissions does not flash.
6. Confirm Monitoring Alerts counts update.
7. Click Recalculate Alerts.
8. Test sorting by File #, Name, Order Date, and Med Expire.
