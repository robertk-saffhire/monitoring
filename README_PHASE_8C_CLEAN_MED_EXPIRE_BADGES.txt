SAFFHIRE MONITORING - PHASE 8C CLEAN MED EXPIRE BADGES

Change requested:
In the Monitoring page Med Expire column, do not show:
- Missing medical date
- OK

Keep:
- Medical expired
- Medical expires X days

What this phase changes:
- Removes row badges for blank Med Expire.
- Removes row badges for OK records.
- Removes warning stripe for blank Med Expire.
- Keeps Medical expired badge.
- Keeps Medical expires X days badge.
- Keeps the alert panel count/filter, but renames Missing Medical to Blank Med Expire.

Files included:
- public/phase8.js
- README_PHASE_8C_CLEAN_MED_EXPIRE_BADGES.txt

SQL needed:
No.

Vercel ENV needed:
No.

Install:
1. Upload this over the project.
2. Redeploy Vercel.
3. Go to Monitoring.
4. Click Refresh.
5. Confirm blank Med Expire rows no longer show Missing medical date in the row.
6. Confirm valid rows no longer show OK.
7. Confirm expiring rows still show Medical expires X days.
