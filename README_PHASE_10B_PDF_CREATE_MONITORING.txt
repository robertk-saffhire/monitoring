SAFFHIRE MONITORING - PHASE 10B PDF CREATE MONITORING RECORDS

What this phase adds:
- Creates new Monitoring records from uploaded PDFs.
- Extracts:
  - File Number
  - Applicant Name
  - Order Date
  - Medical Expiration Date
- Adds a new button in Settings:
  - Create/Update Monitoring from PDFs

What the two scan buttons do:
1. Update Existing Only
   - Finds existing Monitoring records.
   - Updates Med Expire.

2. Create/Update Monitoring from PDFs
   - Finds existing records and updates Med Expire.
   - If no existing record is found, creates a new Monitoring record when the PDF has enough info.

Best filename format:
5060-Julian-Ballesteros-medical-card.pdf

Created records use:
- Monitor Status: On
- MVR Status: blank
- Med Expire: extracted medical expiration date
- Order Date: extracted order date, or upload date if no order date is found

Files included:
- index.html
- package.json
- api/pdf-medical.ts
- public/phase10-medical-pdfs.js
- README_PHASE_10B_PDF_CREATE_MONITORING.txt

SQL needed:
No new SQL if Phase 10 table already exists.

Vercel ENV needed:
No new ENV.

Important:
- PDF must contain selectable text.
- If the PDF is scanned/image-only, OCR will be needed in Phase 10C.
- New record creation requires at least a file number and applicant name.

Install:
1. Upload these files over the project.
2. Redeploy Vercel.
3. Go to Settings.
4. Upload PDFs.
5. Click Create/Update Monitoring from PDFs.
6. Go to Monitoring.
7. Click Refresh.
8. Confirm new rows were created and Med Expire dates were filled.
