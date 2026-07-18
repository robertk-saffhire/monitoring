-- Phase 12A-120 Client Portal Roles
-- Makes sure client_admin and client_user can be saved in local_users.role.
-- Safe to run more than once.

alter table if exists public.local_users
  alter column role drop default;

alter table if exists public.local_users
  alter column role type text using role::text;

alter table if exists public.local_users
  alter column role set default 'user';

update public.local_users
set role = 'user'
where role is null or trim(role) = '';

-- Optional guardrail. If this constraint already exists with the same name, replace it.
alter table if exists public.local_users
  drop constraint if exists local_users_role_allowed;

alter table if exists public.local_users
  add constraint local_users_role_allowed
  check (role in ('admin', 'user', 'viewer', 'client_admin', 'client_user'));
