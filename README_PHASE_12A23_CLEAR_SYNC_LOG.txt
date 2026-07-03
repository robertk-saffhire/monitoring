SAFFHIRE MONITORING - PHASE 12A-23 CLEAR SYNC LOG

Requested change:
The sync log table should be clearable so it does not grow into hundreds or thousands of rows.

What changed:
- Adds a server route inside existing api/index.ts:
  POST /api/index?path=tazworks-sync/clear

- Adds two Settings buttons:
  Clear Sync Log
  Clear Old, Keep Latest 5

Clear Sync Log:
- Deletes all rows from tazworks_sync_runs.
- Clears the table on the screen.
- Does not delete Monitoring records.
- Does not delete applicants.
- Does not delete Med Expire values.
- Does not delete TazWorks order cache records.

Clear Old, Keep Latest 5:
- Deletes older sync log rows.
- Keeps the 5 most recent sync runs.
- Refreshes the table after cleanup.

Files included:
- api/index.ts
- index.html
- public/phase12a23-clear-sync-log.js
- existing Phase 12A-22 files
- README_PHASE_12A23_CLEAR_SYNC_LOG.txt

SQL needed:
No.

Vercel ENV needed:
No new ENV.

What to test:
1. Upload and redeploy.
2. Hard refresh.
3. Go to Settings.
4. Confirm buttons appear:
   - Clear Sync Log
   - Clear Old, Keep Latest 5
5. Click Clear Sync Log.
6. Confirm the table clears.
7. Run TazWorks Sync Now.
8. Confirm a new row appears after the next sync.
