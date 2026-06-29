SAFFHIRE MONITORING - PHASE 10I MONITORING CLEANUP + SORTING

Requested changes:
1. Remove Phase 9 Permissions card from Monitoring.
2. Rename Phase 8 Monitoring Alerts to Monitoring Alerts.
3. Add sorting by:
   - File #
   - Name
   - Order Date
   - Med Expire

What this phase does:
- Removes Phase 9 Permissions panel only on the Monitoring page.
- Changes Phase 8 Monitoring Alerts title to Monitoring Alerts.
- Adds sort buttons above the Monitoring table.
- Makes table headers clickable for:
  - File #
  - Name
  - Order Date
  - Med Expire
- Supports ascending/descending toggle.

Files included:
- index.html
- public/phase10i-monitoring-clean-sort.js
- README_PHASE_10I_MONITORING_CLEAN_SORT.txt

SQL needed:
No.

Vercel ENV needed:
No.

Install:
1. Upload these files over the project.
2. Redeploy Vercel.
3. Hard refresh browser.
4. Go to Monitoring.
5. Confirm Phase 9 card is gone.
6. Confirm title says Monitoring Alerts.
7. Click File #, Name, Order Date, and Med Expire sort buttons or table headers.
