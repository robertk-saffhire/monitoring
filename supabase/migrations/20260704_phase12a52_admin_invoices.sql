-- Phase 12A-52 - Admin monthly invoices
create table if not exists invoices (
  id bigserial primary key,
  "companyId" integer not null default 1,
  "invoiceNumber" text not null,
  "invoiceMonth" date not null,
  "invoiceDate" date not null default current_date,
  "dueDate" date not null default ((current_date + interval '30 days')::date),
  description text not null default 'MVR Continuous Monitoring',
  "serviceMonthLabel" text,
  quantity integer not null default 0,
  "unitPrice" numeric(10,2) not null default 1.00,
  "salesTaxRate" numeric(9,6) not null default 0.0825,
  subtotal numeric(10,2) not null default 0.00,
  "salesTax" numeric(10,2) not null default 0.00,
  total numeric(10,2) not null default 0.00,
  status text not null default 'Draft',
  "billToName" text not null default 'Driver Pipeline Company',
  "billToAddress1" text not null default '1200 N Union Bower Rd.',
  "billToAddress2" text not null default 'Irving, TX 75061-5828',
  "billToPhone" text not null default '214-535-9174',
  notes text not null default '',
  "approvedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  constraint invoices_status_check check (status in ('Draft', 'Approved')),
  constraint invoices_quantity_check check (quantity >= 0),
  constraint invoices_company_month_unique unique ("companyId", "invoiceMonth")
);

create index if not exists idx_invoices_company_month
on invoices ("companyId", "invoiceMonth" desc);

create index if not exists idx_invoices_status
on invoices ("companyId", status);
