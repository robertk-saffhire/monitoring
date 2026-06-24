# Phase 1C Data Migration Guide

Phase 1C adds local scripts for moving current data into Supabase.

Run these scripts from your computer, not inside Vercel. Do not commit exported applicant data to GitHub.

## Required local environment variables

Create a local `.env` file or export these in your terminal:

```bash
DATABASE_URL="your Supabase PostgreSQL connection string"
JWT_SECRET="same value used in Vercel"
MIGRATION_COMPANY_SLUG="driver-pipeline"
MIGRATION_COMPANY_NAME="Driver Pipeline"
```

For direct Google Apps Script export/import, also set any of these URLs you have:

```bash
GOOGLE_APPLICANTS_URL="current monitoring applicants Apps Script URL"
GOOGLE_NOTES_URL="current notes Apps Script URL"
GOOGLE_MED_EXPIRE_URL="current med expire override Apps Script URL"
GOOGLE_MED_CERTS_URL="current med cert expiration Apps Script URL"
```

## Step 1: Export current Google monitoring data

```bash
npm run migrate:export-google
```

This creates a timestamped JSON file in:

```text
migration/data/
```

The export can include:

- applicants / monitoring status
- notes
- med expire overrides
- med cert expiration dates

## Step 2: Dry run the monitoring import

```bash
npm run migrate:monitoring -- --source migration/data/google-monitoring-export-YOUR-FILE.json --dry-run
```

Check the counts and the first few normalized rows.

## Step 3: Import monitoring data into Supabase

```bash
npm run migrate:monitoring -- --source migration/data/google-monitoring-export-YOUR-FILE.json
```

This upserts into the `applicants` table using this unique key:

```text
fileNumber + companyId
```

The script merges by file number:

- monitoring rows become applicant rows
- notes become `applicants.notes`
- med expire override rows become `applicants.medExpire`
- med cert dates are used when no override exists
- `medExpireOverridden` is true when the med expire came from the override source

## Step 4: Import Safety Performance reports

Export safety reports from the old system as JSON and place the file in:

```text
migration/data/safety-reports.json
```

Then dry run:

```bash
npm run migrate:safety -- --source migration/data/safety-reports.json --dry-run
```

Then import:

```bash
npm run migrate:safety -- --source migration/data/safety-reports.json
```

This upserts into `safety_reports` using:

```text
fileNumber + companyId
```

## Notes

- `applicant_audit_log` starts fresh. We are not creating fake audit history during import.
- Run imports after the Phase 1A Supabase SQL has been applied.
- If a row has no file number, it is skipped.
- Duplicate file numbers are removed during import; the first row wins.
