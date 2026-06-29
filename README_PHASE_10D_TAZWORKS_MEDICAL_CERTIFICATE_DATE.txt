SAFFHIRE MONITORING - PHASE 10D TAZWORKS MEDICAL CERTIFICATE DATE FIX

Problem fixed:
TazWorks medical PDF sections show the medical expiration date like this:

Medical Certificate
Description: MEDICAL CERTIFICATE INFORMATION
Status: CERTIFIED
Issue Date: 2026/03/26
Expiration Date: 2028/03/26

The extractor needs the date on the exact Expiration Date line inside the Medical Certificate section.

What changed:
- Adds a direct TazWorks Medical Certificate parser.
- Finds the Medical Certificate section.
- Extracts the exact Expiration Date value.
- Supports YYYY/MM/DD format, such as 2028/03/26.
- Converts it to YYYY-MM-DD before saving to Monitoring.
- Still keeps the older fallback date search rules.

Files included:
- api/pdf-medical.ts
- package.json
- README_PHASE_10D_TAZWORKS_MEDICAL_CERTIFICATE_DATE.txt

SQL needed:
No.

Vercel ENV needed:
No.

Install:
1. Upload these files over the current project.
2. Redeploy Vercel.
3. Go to Settings.
4. Upload or rescan the TazWorks PDF.
5. Click Update Existing Only or Create/Update Monitoring from PDFs.
6. Confirm the scan extracts Expiration Date, not Issue Date.

Expected result from your screenshot:
Expiration Date: 2028/03/26
Saved as:
2028-03-26
