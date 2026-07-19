# Phase 12A-123 — Enforce Client Access Controls

Upload these files:

- api/index.ts
- src/main.jsx
- public/client-portal.html

SQL:
- supabase/migrations/20260718_phase12a121_client_access_options.sql

Run the SQL only if it has not already been run.

This phase fixes client access enforcement. Client Admin and Client User accounts are redirected from the main SaffHire admin app into the client portal, and the API now enforces Monitoring/Safety access on the server side.
