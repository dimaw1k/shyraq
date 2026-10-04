alter table public.habits
  add column if not exists frequency text not null default 'DAILY',
  add column if not exists weekdays smallint[] not null default ARRAY[1,2,3,4,5,6,7]::smallint[],
  add column if not exists goal text,
  add column if not exists start_date date not null default current_date,
  add column if not exists goal_days integer,
  add column if not exists section text not null default 'Күндіз',
  add column if not exists reminder_time time,
  add column if not exists repeat_interval integer not null default 1,
  add column if not exists repeat_unit text not null default 'DAY';

update public.habits
set
  frequency = coalesce(nullif(frequency, ''), 'DAILY'),
  weekdays = case
    when weekdays is null or cardinality(weekdays) = 0 then ARRAY[1,2,3,4,5,6,7]::smallint[]
    else weekdays
  end,
  section = coalesce(nullif(trim(section), ''), 'Күндіз'),
  repeat_interval = case
    when repeat_interval < 1 or repeat_interval > 365 then 1
    else repeat_interval
  end,
  repeat_unit = case
    when repeat_unit in ('DAY','WEEK') then repeat_unit
    else 'DAY'
  end;

alter table public.habits
  drop constraint if exists habits_frequency_check,
  drop constraint if exists habits_weekdays_check,
  drop constraint if exists habits_goal_check,
  drop constraint if exists habits_goal_days_check,
  drop constraint if exists habits_section_check,
  drop constraint if exists habits_repeat_interval_check,
  drop constraint if exists habits_repeat_unit_check;

alter table public.habits
  add constraint habits_frequency_check
    check (frequency in ('DAILY','WEEKLY','REPEAT')),
  add constraint habits_weekdays_check
    check (
      cardinality(weekdays) between 1 and 7
      and weekdays <@ ARRAY[1,2,3,4,5,6,7]::smallint[]
    ),
  add constraint habits_goal_check
    check (goal is null or char_length(trim(goal)) <= 100),
  add constraint habits_goal_days_check
    check (goal_days is null or goal_days between 1 and 999),
  add constraint habits_section_check
    check (char_length(trim(section)) between 1 and 40),
  add constraint habits_repeat_interval_check
    check (repeat_interval between 1 and 365),
  add constraint habits_repeat_unit_check
    check (repeat_unit in ('DAY','WEEK'));

create index if not exists habits_student_schedule_idx
  on public.habits(student_id, active, start_date);

grant select on public.habits to authenticated;
grant all on public.habits to service_role;
