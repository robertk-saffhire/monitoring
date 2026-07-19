-- Phase 12A-134
-- Separates users created by SaffHire master admin from users created by a client admin.

alter table public.local_users
  add column if not exists "createdInClientPortal" boolean not null default false;

create index if not exists local_users_client_portal_scope_idx
  on public.local_users ("companyId", "createdInClientPortal", id);

comment on column public.local_users."createdInClientPortal" is
  'True only when the user account was created from the client portal User Admin page.';
