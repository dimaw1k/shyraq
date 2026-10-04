alter table public.marathon_settings
  add column if not exists morning_report_open_time time not null default '08:00',
  add column if not exists evening_report_open_time time not null default '19:00';

update public.marathon_settings
set
  morning_report_open_time = coalesce(morning_report_open_time, '08:00'::time),
  evening_report_open_time = coalesce(evening_report_open_time, '19:00'::time)
where id = true;
