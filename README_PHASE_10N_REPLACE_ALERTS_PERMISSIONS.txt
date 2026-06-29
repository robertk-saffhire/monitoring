SAFFHIRE MONITORING - PHASE 10N REPLACE ALERTS + PERMISSIONS

This is a cleanup/replacement build.

Problems fixed:
1. Monitoring Alerts card was not showing.
2. Sorting did not work.
3. Phase 9 Permissions card kept showing/flashing.

What changed:
- Replaces public/phase8.js with a stable Monitoring Alerts + sorting script.
- Replaces public/phase9.js with a cleaner permission script that does NOT create the Phase 9 Permissions panel.
- Replaces index.html to stop loading the extra cleanup scripts that were fighting each other.
- Adds no-op files for older conflict scripts in case an old index still references them.

Monitoring page should show:
- Monitoring Alerts card
- Search/filter bar
- Monitoring table

Monitoring Alerts reads:
- Monitoring select value
- Med Expire input value

Sorting:
- File #
- Name
- Order Date
- Med Expire

Files included:
- index.html
- public/phase8.js
- public/phase9.js
- disabled no-op cleanup scripts
- README_PHASE_10N_REPLACE_ALERTS_PERMISSIONS.txt

SQL needed:
No.

Vercel ENV needed:
No.

Install:
1. Upload these files over the project.
2. Redeploy Vercel.
3. Hard refresh the browser.
4. Go to Monitoring.
5. Confirm Monitoring Alerts shows.
6. Confirm Phase 9 Permissions does not show or flash.
7. Test sorting by File #, Name, Order Date, and Med Expire.
