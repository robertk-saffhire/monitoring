SAFFHIRE MONITORING - PHASE 12A-7 DROPDOWN ONLY GREEN

Requested change:
Only the Monitoring dropdown should turn green when set to On.
The full row should not turn green.
Off should have no color.

What changed:
- Adds public/phase12a7-dropdown-only-green.js
- Loads it after phase12a6-monitoring-alerts-fix.js
- Overrides the previous row-level green styling
- Keeps the Monitoring Alerts counts working
- Keeps On dropdown highlighted green
- Keeps Off dropdown plain white

Files included:
- index.html
- public/phase12a7-dropdown-only-green.js
- README_PHASE_12A7_DROPDOWN_ONLY_GREEN.txt

SQL needed:
No.

Vercel ENV needed:
No.

What to test:
1. Upload these files.
2. Redeploy.
3. Hard refresh.
4. Go to Monitoring.
5. Set a record to Monitoring On.
6. Confirm only the dropdown is green.
7. Confirm the row stays white.
8. Set the record to Off.
9. Confirm the dropdown goes back to plain white.
