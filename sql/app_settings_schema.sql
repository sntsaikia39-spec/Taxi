create table if not exists app_settings (
  key   text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Seed default: conflict control ON
insert into app_settings (key, value)
values ('conflict_control_enabled', 'true')
on conflict (key) do nothing;
