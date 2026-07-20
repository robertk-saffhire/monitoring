# Phase 12A-140 — SaffHire User Report Admin Rights

Upload these files to `robertk-saffhire/monitoring`:

- `api/index.ts`
- `src/main.jsx`
- `src/SettingsPage.jsx`
- `public/phase9.js`
- `public/phase9b-role-sync.js`
- `supabase/migrations/20260720_phase12a140_saffhire_report_admin_access.sql`

Run the SQL migration before deploying the application files.

## Result

When an Admin creates or edits a role **SaffHire User**, the Admin selects:

- Monitoring Reports
- Safety Performance Reports
- or both

The SaffHire User receives full administrative rights inside every assigned report area, including create, edit, delete, sync, PDF, email, notes, status, and workflow actions. Unassigned report pages are removed from the sidebar and blocked by the API.

The main Admin account always retains full system access. Client permissions remain separate and unchanged. Existing SaffHire Users retain access to both report areas until the Admin edits their access.

## SQL

Required: Yes.

## Vercel environment variables

No changes.
