SAFFHIRE MONITORING - PHASE 10C TAZWORKS FILE MATCH FIX

Problem:
TazWorks PDFs are named like:
report_6340.pdf

The old matcher expected friendlier file names such as:
5060-Julian-Ballesteros-medical-card.pdf

So the scan could fail to match existing Monitoring records even when the file number was in the filename.

What this phase fixes:
- Extracts file number from report_6340.pdf
- Stores that extracted file number on upload
- Matches Monitoring records using normalized file number
- Handles file numbers with spaces, dashes, underscores, or other formatting
- Adds better messages:
  - no_text = PDF has no readable text and likely needs OCR
  - no_date = no medical expiration date found
  - no_match = expiration date found, but no Monitoring record matched
  - updated = existing Monitoring row updated
  - created = new Monitoring row created

Medical expiration extraction improved for labels like:
- Medical Expiration
- Medical Expires
- Medical Cert
- Medical Card
- DOT Physical
- Physical Expiration
- Certificate Expiration
- Valid Through
- Valid Until
- Qualified Until
- Med Expire

Files included:
- package.json
- api/pdf-medical.ts
- README_PHASE_10C_TAZWORKS_FILE_MATCH.txt

SQL needed:
No new SQL.

Vercel ENV needed:
No new ENV.

Install:
1. Upload these files over the project.
2. Redeploy Vercel.
3. Go to Settings.
4. Upload report_6340.pdf.
5. Click Update Existing Only first.
6. Go to Monitoring and click Refresh.
7. If not updated, look at the scan status/message:
   - no_text means the PDF needs OCR
   - no_date means the PDF text did not expose the medical expiration date in a way we can read
   - no_match means file number 6340 did not match any Monitoring row

Important:
If report_6340.pdf is image-only, Phase 10D should add OCR.
