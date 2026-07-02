-- Phase 12A - TazWorks manual sync foundation
-- Run this in Supabase SQL editor before using the sync panel.

create table if not exists tazworks_sync_runs (
  id bigserial primary key,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running',
  triggered_by text,
  orders_pulled integer not null default 0,
  applicants_upserted integer not null default 0,
  safety_reports_updated integer not null default 0,
  errors_count integer not null default 0,
  message text,
  raw_summary jsonb not null default '{}'::jsonb
);

create table if not exists tazworks_order_cache (
  id bigserial primary key,
  company_id integer,
  order_guid text not null unique,
  file_number text,
  applicant_name text,
  order_status text,
  order_type text,
  ordered_date timestamptz,
  completed_date timestamptz,
  client_name text,
  client_code text,
  product_name text,
  requested_by text,
  search_flagged boolean not null default false,
  source_modified_date timestamptz,
  raw_order jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  last_sync_run_id bigint references tazworks_sync_runs(id) on delete set null
);

create index if not exists idx_tazworks_order_cache_file_number on tazworks_order_cache(file_number);
create index if not exists idx_tazworks_order_cache_company_id on tazworks_order_cache(company_id);
create index if not exists idx_tazworks_order_cache_last_seen_at on tazworks_order_cache(last_seen_at desc);
create index if not exists idx_tazworks_sync_runs_started_at on tazworks_sync_runs(started_at desc);
