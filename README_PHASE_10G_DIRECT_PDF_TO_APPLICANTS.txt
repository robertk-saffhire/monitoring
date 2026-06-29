SAFFHIRE MONITORING - PHASE 10G DIRECT PDF TO APPLICANTS

Requested change:
Do not use a separate table to store PDF scan information.

New workflow:
1. Admin uploads PDFs.
2. The app scans each PDF immediately.
3. The app extracts:
   - File number
   - Applicant name
   - Order date
   - Medical expiration date when present
4. The app creates/updates the applicants table directly.
5. The Monitoring page pulls from the applicants table as it already does.
6. PDFs are not saved in the database.

What changed:
- Replaces the previous Medical PDF Upload & Scan panel with PDF Import to Applicant Database.
- No medical_pdf_uploads table is used by this new endpoint.
- No scan notes are written to the applicant Notes field.
- Records are created for each PDF with a file number.
- Med Expire is only filled if the Medical Certificate Expiration Date is found.
- If no medical expiration is found, Med Expire stays blank.
- If applicant name is not found, name is REVIEW NAME NEEDED.

Files included:
- index.html
- package.json
- api/pdf-medical.ts
- public/phase10-medical-pdfs.js
- README_PHASE_10G_DIRECT_PDF_TO_APPLICANTS.txt

SQL needed:
No new SQL.

Optional cleanup later:
If you want to remove the old PDF upload table after confirming this new workflow works:
drop table if exists medical_pdf_uploads;

Do not run that until you are sure you do not need old scan history.

Vercel ENV needed:
No new ENV.

Install:
1. Upload these files over the current project.
2. Redeploy Vercel.
3. Go to Settings.
4. Find PDF Import to Applicant Database.
5. Choose the TazWorks PDFs.
6. Click Scan PDFs into Applicant Database.
7. Go to Monitoring.
8. Click Refresh.
9. Confirm new applicant records are present.
