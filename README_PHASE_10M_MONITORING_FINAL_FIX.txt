SAFFHIRE MONITORING - PHASE 10M MONITORING FINAL FIX

Problems fixed:
1. Monitoring Alerts card was not showing.
2. Sorting did not work.
3. Phase 9 Permissions card was flashing back in.

What this phase does:
- Creates a new stable Monitoring Alerts card independent of the old Phase 8 card.
- Hides/removes old conflicting panels only on the Monitoring page.
- Recalculates counts from actual Monitoring table values.
- Reads:
  - Monitoring select value
  - Med Expire input value
- Adds sort buttons for:
  - File #
  - Name
  - Order Date
  - Med Expire
- Makes table headers clickable for the same fields.
- Prevents Phase 9 Permissions from flashing on Monitoring.

Files included:
- index.html
- public/phase10m-monitoring-final-fix.js
- README_PHASE_10M_MONITORING_FINAL_FIX.txt

SQL needed:
No.

Vercel ENV needed:
No.

Install:
1. Upload these files over the project.
2. Redeploy Vercel.
3. Hard refresh the browser.
4. Go to Monitoring.
5. Confirm Monitoring Alerts card shows.
6. Confirm Phase 9 Permissions card does not flash.
7. Click Recalculate Alerts.
8. Test sorting by File #, Name, Order Date, and Med Expire.
