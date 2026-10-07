alter table attendance
  add column status text not null default 'present'
  check (status in ('present','absent','half','leave','holiday','weekoff'));
