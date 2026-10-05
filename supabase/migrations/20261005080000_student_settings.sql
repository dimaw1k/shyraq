create table if not exists public.student_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'kk' check (language in ('kk','ru','en')),
  theme text not null default 'light' check (theme in ('light','dark','system')),
  reminders jsonb not null default '{}'::jsonb,
  notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_settings enable row level security;

drop policy if exists "student_settings_select_own" on public.student_settings;
create policy "student_settings_select_own"
  on public.student_settings for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "student_settings_insert_own" on public.student_settings;
create policy "student_settings_insert_own"
  on public.student_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "student_settings_update_own" on public.student_settings;
create policy "student_settings_update_own"
  on public.student_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
