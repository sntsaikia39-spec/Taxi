create table if not exists app_settings (
  key   text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Seed default: conflict control ON
insert into app_settings (key, value)
values ('conflict_control_enabled', 'true')
on conflict (key) do nothing;

-- Seed default logs retention row cap (for free-tier optimization)
insert into app_settings (key, value)
values ('system_logs_max_rows', '2000')
on conflict (key) do nothing;
