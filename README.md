# SaffHire Monitoring Dashboard

This repository will hold the separate SaffHire Monitoring Dashboard migration from Google Sheets + Manus/MySQL to Supabase + GitHub + Vercel.

Current planned build sequence:

1. Phase 1A — Supabase/Postgres foundation
2. Phase 1B — Vercel-compatible API/tRPC server conversion
3. Phase 1C — Current-data migration scripts
4. Phase 2A — Monitoring reads from Supabase applicants table
5. Phase 2B — Monitoring writes, audit logs, notes, and med expire overrides

Do not commit private Manus runtime folders or local environment files.
