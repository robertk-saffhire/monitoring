SaffHire Monitoring - Safety Performance Import Fix

What this fixes:
- Safety Performance import now accepts copied spreadsheet cells with tab-separated columns.
- It maps these backup headers:
  File Number -> fileNumber
  Applicant Name -> applicantName
  Created Date -> created
  Status -> status
  Follow Up Date -> followUpDate
  Employer 1 Name -> previous employer name
  Employer 1 Phone -> previous employer phone
  Employer 1 Fax -> previous employer fax
  Employer 1 Email -> previous employer email
  Employer 1 Street -> previous employer street
  Employer 1 City/State/Zip -> previous employer city/state/zip

Files included:
- src/SettingsPage.jsx

How to use:
1. Upload this ZIP over the existing project.
2. Replace the existing src/SettingsPage.jsx with this one.
3. Redeploy Vercel.
4. Go to Settings -> Import Safety Performance CSV.
5. Paste the copied spreadsheet cells including the header row.
6. Click Import Safety Reports.

SQL needed: No
Vercel ENV needed: No
