-- Phase 12A-45 - Add terminated flag to Monitoring applicants
alter table applicants
add column if not exists "terminated" boolean not null default false;

create index if not exists idx_applicants_terminated
on applicants ("companyId", "terminated");
