Phase 12A-87 — Safety Report Notes Manager

Upload only:
- api/index.ts
- public/phase6.js

Run the SQL in Supabase before using the note manager:

create table if not exists public.safety_report_notes (
  id bigserial primary key,
  "companyId" integer not null,
  "safetyReportId" bigint not null references public.safety_reports(id) on delete cascade,
  note text not null,
  "showToClient" boolean not null default false,
  "createdBy" text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists safety_report_notes_report_idx
  on public.safety_report_notes ("companyId", "safetyReportId", "createdAt" desc);

create index if not exists safety_report_notes_client_idx
  on public.safety_report_notes ("companyId", "safetyReportId", "showToClient");
