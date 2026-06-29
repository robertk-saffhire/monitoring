SAFFHIRE MONITORING - PHASE 10J STOP PHASE 9 FLASH

Problem:
The Phase 9 Permissions card keeps flashing in and out on the Monitoring page.

Cause:
One script keeps recreating the Phase 9 panel.
Another script removes it.
That creates a visible flash.

Fix:
This phase hides the Phase 9 panel immediately on the Monitoring page before removing it.
It also watches for the panel being recreated and hides it instantly.

Files included:
- index.html
- public/phase10j-stop-phase9-flash.js
- README_PHASE_10J_STOP_PHASE9_FLASH.txt

SQL needed:
No.

Vercel ENV needed:
No.

Install:
1. Upload these files over the project.
2. Redeploy Vercel.
3. Hard refresh the browser.
4. Go to Monitoring.
5. Confirm the Phase 9 Permissions card no longer flashes.
