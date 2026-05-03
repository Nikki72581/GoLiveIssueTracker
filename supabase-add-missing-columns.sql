-- Safe to run multiple times — adds any columns that are missing from the live table.

-- module_area: which part of the system the issue belongs to
alter table issues
  add column if not exists module_area text
    check (module_area in ('financials-banking','distribution','shopify','edi','other-unsure'));

-- resolved_at: timestamp set when an issue is marked resolved
alter table issues
  add column if not exists resolved_at timestamptz;

-- notes: internal team notes on an issue
alter table issues
  add column if not exists notes text;

-- The status column needs to allow 'post-go-live'. If the check constraint
-- was created without it, drop and recreate it.
alter table issues drop constraint if exists issues_status_check;
alter table issues
  add constraint issues_status_check
    check (status in ('open','in-progress','resolved','wont-fix','post-go-live'));
