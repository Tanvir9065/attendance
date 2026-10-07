alter table sites alter column lat drop not null, alter column lng drop not null;

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','manager')),
  name text, email text, created_at timestamptz default now());
create table user_sites (
  user_id uuid references profiles(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  primary key (user_id, site_id));

insert into profiles (id, role, name, email)
select id, 'admin', coalesce(email, 'Admin'), email from auth.users on conflict do nothing;

create function is_admin() returns boolean language sql security definer stable set search_path = public as
$$ select exists (select 1 from profiles where id = auth.uid() and role = 'admin') $$;
create function my_sites() returns setof uuid language sql security definer stable set search_path = public as
$$ select site_id from user_sites where user_id = auth.uid() $$;

alter table profiles enable row level security;
alter table user_sites enable row level security;

drop policy if exists "auth all" on workers;
drop policy if exists "auth all" on attendance;
drop policy if exists "auth all" on sites;

create policy "profiles read" on profiles for select to authenticated using (id = auth.uid() or is_admin());
create policy "profiles admin" on profiles for all to authenticated using (is_admin()) with check (is_admin());
create policy "user_sites read" on user_sites for select to authenticated using (user_id = auth.uid() or is_admin());
create policy "user_sites admin" on user_sites for all to authenticated using (is_admin()) with check (is_admin());

create policy "sites read" on sites for select to authenticated using (is_admin() or id in (select my_sites()));
create policy "sites update" on sites for update to authenticated using (is_admin() or id in (select my_sites())) with check (is_admin() or id in (select my_sites()));
create policy "sites insert" on sites for insert to authenticated with check (is_admin());
create policy "sites delete" on sites for delete to authenticated using (is_admin());

create policy "workers read" on workers for select to authenticated using (is_admin() or site_id in (select my_sites()));
create policy "workers insert" on workers for insert to authenticated with check (is_admin() or site_id in (select my_sites()));
create policy "workers update" on workers for update to authenticated using (is_admin() or site_id in (select my_sites())) with check (is_admin() or site_id in (select my_sites()));
create policy "workers delete" on workers for delete to authenticated using (is_admin());

create policy "att read" on attendance for select to authenticated using (is_admin() or exists (select 1 from workers w where w.id = attendance.worker_id and w.site_id in (select my_sites())));
create policy "att insert" on attendance for insert to authenticated with check (is_admin() or exists (select 1 from workers w where w.id = attendance.worker_id and w.site_id in (select my_sites())));
create policy "att update" on attendance for update to authenticated using (is_admin() or exists (select 1 from workers w where w.id = attendance.worker_id and w.site_id in (select my_sites()))) with check (is_admin() or exists (select 1 from workers w where w.id = attendance.worker_id and w.site_id in (select my_sites())));
create policy "att delete" on attendance for delete to authenticated using (is_admin());

notify pgrst, 'reload schema';
