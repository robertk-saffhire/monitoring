-- Phase 12A-139 — Automatic Monitoring and Safety Report sync audit/lock table

create table if not exists public.auto_sync_runs (
  id bigserial primary key,
  slot_key text not null unique,
  scheduled_local_time text not null default '',
  company_id integer not null default 1,
  status text not null default 'running',
  attempts integer not null default 1,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  monitoring_summary jsonb not null default '{}'::jsonb,
  safety_summary jsonb not null default '{}'::jsonb,
  error_message text not null default ''
);

create index if not exists auto_sync_runs_started_at_idx
  on public.auto_sync_runs (started_at desc);

create index if not exists auto_sync_runs_status_idx
  on public.auto_sync_runs (status, started_at desc);

comment on table public.auto_sync_runs is
  'Tracks the four daily automatic TazWorks Monitoring and Safety Report synchronization runs.';
