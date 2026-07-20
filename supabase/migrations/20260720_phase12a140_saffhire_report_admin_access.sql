-- Phase 12A-140
-- Adds report-specific administrative access for internal SaffHire Users.

alter table public.local_users
  add column if not exists "internalAccess" jsonb not null
  default '{"monitoring":true,"safetyReports":true}'::jsonb;

-- Existing internal users keep their current full report access unless an admin changes it.
update public.local_users
set "internalAccess" = '{"monitoring":true,"safetyReports":true}'::jsonb
where "internalAccess" is null
   or jsonb_typeof("internalAccess") <> 'object';

create index if not exists local_users_internal_access_idx
  on public.local_users using gin ("internalAccess");

comment on column public.local_users."internalAccess" is
  'Report areas where a role=user SaffHire account has full administrative rights. Admin accounts always retain full system access.';
