# Phase 12A-134 — Client-Created User Scope

Upload:

- `api/index.ts`
- `public/client-portal.html`

Run in Supabase SQL Editor:

- `supabase/migrations/20260719_phase12a134_client_created_user_scope.sql`

Run the SQL before testing the Client User Admin page.

## Expected result

- Users created in the SaffHire master admin remain able to log in but do not appear in the client portal User Admin list.
- Users created from the client portal are marked as client-created and appear in that client's User Admin list.
- Client admins can edit, reset, deactivate, or delete only client-created users.
- Master-admin-created users remain managed only from the SaffHire master admin.
