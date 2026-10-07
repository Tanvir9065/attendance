create table workers (
  id uuid primary key default gen_random_uuid(),
  name text not null, phone text, daily_wage numeric default 0,
  face jsonb not null, consent_at timestamptz not null,
  active boolean default true, created_at timestamptz default now());
create table attendance (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid references workers(id) on delete cascade,
  work_date date not null, check_in timestamptz, check_out timestamptz,
  unique (worker_id, work_date));
alter table workers enable row level security;
alter table attendance enable row level security;
create policy "auth all" on workers for all to authenticated using (true) with check (true);
create policy "auth all" on attendance for all to authenticated using (true) with check (true);
