SAFFHIRE MONITORING - PHASE 6 EMPLOYER RESPONSE FORM

What this phase adds:
- Response Link button on Safety Performance rows
- Secure employer response form link
- Public employer form: /employer-response.html?token=...
- Employer can submit:
  - Employment dates
  - Job title
  - Motor vehicle driven
  - Vehicle types
  - Accident history
  - DOT drug/alcohol answers
  - Completed by/date
- Submission saves back to the existing safety_reports row
- Status changes to Emp Complete
- Follow-up date is cleared
- Notes are updated with submission details

Files included:
- index.html
- public/phase6.js
- public/employer-response.html
- api/safety-response-link.ts
- api/safety-response.ts
- README_PHASE_6.txt

SQL needed:
No.

Vercel ENV needed:
No new ENV.

Uses existing:
- DATABASE_URL
- JWT_SECRET

Install:
1. Upload these files over the existing project.
2. Redeploy Vercel.
3. Go to Safety Performance Reports.
4. Click Response Link on a report.
5. Copy the link or open Gmail from the modal.
6. Test the employer form in a private/incognito window.
7. Submit the form.
8. Return to Safety Performance Reports and refresh.
9. Confirm status changed to Emp Complete and the submitted fields saved.

Important:
The secure form link expires after 14 days.
The employer does not need to log in.
