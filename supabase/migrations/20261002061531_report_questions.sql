-- 0025 — configurable daily report questions
alter table public.daily_reports
  add column if not exists answers jsonb not null default '{}'::jsonb;

create table if not exists public.daily_report_questions (
  id uuid primary key default gen_random_uuid(),
  marathon_day smallint,
  question text not null,
  field_key text not null,
  field_type text not null default 'LONG_TEXT',
  required boolean not null default true,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_report_questions_day_check check (marathon_day is null or (marathon_day between 1 and 21)),
  constraint daily_report_questions_type_check check (field_type in ('SHORT_TEXT','LONG_TEXT','NUMBER'))
);

create unique index if not exists daily_report_questions_field_key_idx
  on public.daily_report_questions(coalesce(marathon_day,0), field_key);

create index if not exists daily_report_questions_lookup_idx
  on public.daily_report_questions(marathon_day, active, sort_order);

alter table public.daily_report_questions enable row level security;

drop policy if exists daily_report_questions_student_select on public.daily_report_questions;
create policy daily_report_questions_student_select
on public.daily_report_questions
for select
to authenticated
using (active = true or public.is_chief_mentor_or_above());

drop policy if exists daily_report_questions_staff_insert on public.daily_report_questions;
create policy daily_report_questions_staff_insert
on public.daily_report_questions
for insert
to authenticated
with check (public.is_chief_mentor_or_above());

drop policy if exists daily_report_questions_staff_update on public.daily_report_questions;
create policy daily_report_questions_staff_update
on public.daily_report_questions
for update
to authenticated
using (public.is_chief_mentor_or_above())
with check (public.is_chief_mentor_or_above());

drop policy if exists daily_report_questions_staff_delete on public.daily_report_questions;
create policy daily_report_questions_staff_delete
on public.daily_report_questions
for delete
to authenticated
using (public.is_chief_mentor_or_above());

create trigger daily_report_questions_updated_at
before update on public.daily_report_questions
for each row execute function public.set_updated_at();
