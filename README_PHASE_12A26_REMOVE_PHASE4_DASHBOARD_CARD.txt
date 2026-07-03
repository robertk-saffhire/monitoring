SAFFHIRE MONITORING - PHASE 12A-26 REMOVE PHASE 4 DASHBOARD CARD

Requested change:
Remove the old Phase 4 Build card from the Dashboard.

Removed card:
- Phase 4 Build
- This build adds Safety Performance print/PDF output...
- S1 Complete
- Emp Sent
- Emp Complete
- Completed

What stays:
- Main Dashboard
- Monitoring
- Safety Performance
- Settings
- Client View
- Client Admin
- Existing data and sync logic

Files included:
- index.html
- public/phase12a26-remove-phase4-dashboard-card.js
- existing Phase 12A-25 files
- README_PHASE_12A26_REMOVE_PHASE4_DASHBOARD_CARD.txt

SQL needed:
No.

Vercel ENV needed:
No new ENV.

What to test:
1. Upload and redeploy.
2. Hard refresh.
3. Go to Dashboard.
4. Confirm the Phase 4 Build card is gone.
5. Confirm the rest of the Dashboard still loads.
