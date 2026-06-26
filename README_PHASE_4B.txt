SaffHire Monitoring - Phase 4B

Files included:
- index.html
- public/phase4b.js

What this phase adds:
1. When the Email button is clicked on a Safety Performance report, the app now:
   - opens/copies the existing email draft workflow
   - marks the report status as Emp Sent
   - sets a 5-day follow-up date if one is blank
   - appends a note showing that the employer email draft was opened
2. Follow-up rows are highlighted:
   - due today rows get a light orange background
   - overdue rows get a light red background
3. No automatic email is sent.
4. No Google Sheets are used.

SQL needed: No
Vercel ENV needed: No

After upload/redeploy:
1. Go to Safety Performance Reports.
2. Click Email on one report.
3. Confirm your email draft still opens/copies.
4. Confirm the row changes to Emp Sent.
5. Confirm Follow Up Date is filled if it was blank.
6. Refresh the page and confirm the status/follow-up stayed saved.
