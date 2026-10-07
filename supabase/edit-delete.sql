drop policy if exists "att delete" on attendance;
create policy "att delete" on attendance for delete to authenticated
  using (is_admin() or exists (select 1 from workers w where w.id = attendance.worker_id and w.site_id in (select my_sites())));
notify pgrst, 'reload schema';
