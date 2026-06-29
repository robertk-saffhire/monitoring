-- Phase 10 - Medical PDF uploads and scan results
-- Stores admin-uploaded medical PDFs in Postgres and tracks scan/update results.

create table if not exists medical_pdf_uploads (
  id bigserial primary key,
  "companyId" integer not null references companies(id) on delete cascade,
  "fileName" text not null,
  "mimeType" text not null default 'application/pdf',
  "fileSize" integer not null default 0,
  "pdfData" bytea not null,
  "uploadedBy" integer references local_users(id) on delete set null,
  "uploadedAt" timestamptz not null default now(),
  "extractedExpirationDate" text,
  "extractedFileNumber" text,
  "extractedApplicantName" text,
  "matchedApplicantId" bigint references applicants(id) on delete set null,
  "scanStatus" text not null default 'uploaded',
  "scanMessage" text,
  "scannedAt" timestamptz
);

create index if not exists medical_pdf_uploads_company_idx
  on medical_pdf_uploads ("companyId");

create index if not exists medical_pdf_uploads_status_idx
  on medical_pdf_uploads ("scanStatus");
