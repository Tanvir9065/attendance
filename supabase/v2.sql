create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null, lat double precision not null, lng double precision not null,
  radius_m int not null default 100, created_at timestamptz default now());
alter table sites enable row level security;
create policy "auth all" on sites for all to authenticated using (true) with check (true);
create sequence emp_seq start 1;
alter table workers
  add column site_id uuid references sites(id),
  add column emp_code text unique default ('SITE-' || lpad(nextval('emp_seq')::text, 4, '0')),
  add column trade text, add column blood_group text,
  add column emergency_name text, add column emergency_phone text,
  add column photo_path text;
alter table attendance add column site_id uuid references sites(id), add column lat double precision, add column lng double precision;
insert into storage.buckets (id, name, public) values ('worker-photos', 'worker-photos', false) on conflict do nothing;
create policy "photos auth all" on storage.objects for all to authenticated
  using (bucket_id = 'worker-photos') with check (bucket_id = 'worker-photos');
