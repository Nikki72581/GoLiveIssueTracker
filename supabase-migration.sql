create table issues (
  id bigint generated always as identity primary key,
  created_at timestamptz default now() not null,
  title text not null,
  description text,
  category text not null check (category in ('data','workflow','configuration','training','integration','other')),
  priority text not null check (priority in ('low','medium','high','critical')),
  status text not null default 'open' check (status in ('open','in-progress','resolved','wont-fix')),
  submitted_by text not null,
  assigned_to text,
  notes text,
  resolved_at timestamptz
);

alter table issues enable row level security;
create policy "Public read"   on issues for select using (true);
create policy "Public insert" on issues for insert with check (true);
create policy "Public update" on issues for update using (true);
