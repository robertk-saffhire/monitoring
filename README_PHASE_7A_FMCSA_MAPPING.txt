SAFFHIRE MONITORING - PHASE 7A FMCSA PDF MAPPING

What this phase adds:
- FMCSA PDF button on Safety Performance rows
- Downloads a completed PDF mapped to the uploaded FMCSA Safety Performance History Records Request form
- Uses the fillable fields in the PDF template where possible
- Flattens the completed PDF after filling

Files included:
- index.html
- package.json
- api/fmcsa-packet.ts
- public/phase7a-fmcsa.js
- public/fmcsa-safety-performance-template.pdf
- README_PHASE_7A_FMCSA_MAPPING.txt

SQL needed:
No.

Vercel ENV needed:
No new ENV.
Uses existing:
- DATABASE_URL
- JWT_SECRET

Dependency added:
- pdf-lib

What is mapped:
Section 1:
- Applicant name
- Previous employer name, street, city/state/zip, email, phone, fax
- Prospective employer name, attention, street, city/state/zip, phone, confidential fax/email
- Application/request date

Section 2:
- Employed Yes
- Job title
- From/to dates
- Drove motor vehicle Yes/No
- Vehicle type checkboxes
- Completed by, company, address, phone, date
- No safety performance history checkbox when applicable

Section 3:
- Employee name/date
- Accident rows 1-3
- Other accident notes
- No accident register data checkbox when applicable

Section 4:
- DOT violation Yes checkbox when any drug/alcohol violation flag exists
- DOT testing from/to dates

Section 5a/5b:
- Emailed method
- Follow-up note
- Information received from
- Email method
- Recorded by/date

Important:
Some ambiguous NO checkboxes in the source PDF share duplicate field names, so Phase 7A avoids checking the generic NO fields to prevent the wrong boxes from being marked.

Install:
1. Upload these files over the existing project.
2. Redeploy Vercel.
3. Go to Safety Performance Reports.
4. Click FMCSA PDF on a report.
5. Confirm the PDF downloads.
6. Review the mapped fields in the downloaded PDF.
