create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 60),
  description text,
  icon text not null default 'Sparkles' check (icon in (
    'BookOpen',
    'ListTodo',
    'Smartphone',
    'Library',
    'PenLine',
    'Moon',
    'Dumbbell',
    'Sparkles'
  )),
  is_default boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (student_id, name)
);

create table if not exists public.habit_checkins (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  completed_date date not null,
  completed_at timestamptz not null default now(),
  unique (habit_id, completed_date)
);

create index if not exists habits_student_idx
  on public.habits(student_id, active, sort_order);

create index if not exists habit_checkins_student_date_idx
  on public.habit_checkins(student_id, completed_date desc);

create index if not exists habit_checkins_habit_date_idx
  on public.habit_checkins(habit_id, completed_date desc);

alter table public.habits enable row level security;
alter table public.habit_checkins enable row level security;

revoke all on public.habits from anon, authenticated;
revoke all on public.habit_checkins from anon, authenticated;

grant select on public.habits to authenticated;
grant select on public.habit_checkins to authenticated;
grant all on public.habits to service_role;
grant all on public.habit_checkins to service_role;

drop policy if exists habits_select_own on public.habits;
create policy habits_select_own
  on public.habits
  for select
  to authenticated
  using ((select auth.uid()) = student_id);

drop policy if exists habit_checkins_select_own on public.habit_checkins;
create policy habit_checkins_select_own
  on public.habit_checkins
  for select
  to authenticated
  using ((select auth.uid()) = student_id);
