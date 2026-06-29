SAFFHIRE MONITORING - PHASE 10E CREATE REVIEW RECORDS

Problem:
The scan results show records like:

no_match
Expiration found but no Monitoring match and could not create because applicant name was not found in PDF text

That means the scanner found:
- File number
- Medical expiration date

But it did not find:
- Applicant name

Before this phase, it refused to create a Monitoring row without a name.

What this phase changes:
- If file number and medical expiration date are found, the app can create a Monitoring row even if applicant name is missing.
- The created row uses:
  REVIEW NAME NEEDED
- The row note explains that the applicant name was not found in the PDF text and needs review.

Example:
report_6340.pdf
Expiration Date: 2028/03/26

Creates:
File #: 6340
Name: REVIEW NAME NEEDED
Order Date: upload date or extracted order date
Monitoring: On
Med Expire: 2028-03-26
Notes: Applicant name was not found in PDF text and needs review.

Files included:
- api/pdf-medical.ts
- README_PHASE_10E_CREATE_REVIEW_RECORDS.txt

SQL needed:
No.

Vercel ENV needed:
No.

Install:
1. Upload these files over the project.
2. Redeploy Vercel.
3. Go to Settings.
4. Click Create/Update Monitoring from PDFs or Rescan All.
5. Go to Monitoring.
6. Click Refresh.
7. Search file number 6340.
8. Edit REVIEW NAME NEEDED to the correct name.

Important:
This is intentionally safer than guessing a name.
