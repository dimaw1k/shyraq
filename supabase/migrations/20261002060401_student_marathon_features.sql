-- 0024 — student marathon experience, profile media, support and banner publishing

alter table public.profiles
  add column if not exists avatar_path text;

alter table public.tasks
  add column if not exists marathon_day smallint,
  add column if not exists task_order integer not null default 0,
  add column if not exists max_files integer not null default 5;

alter table public.tasks
  drop constraint if exists tasks_marathon_day_check,
  drop constraint if exists tasks_max_files_check;

alter table public.tasks
  add constraint tasks_marathon_day_check
    check (marathon_day is null or (marathon_day between 1 and 21)),
  add constraint tasks_max_files_check
    check (max_files between 1 and 10);

alter table public.task_submissions
  add column if not exists submitted_late boolean not null default false,
  add column if not exists review_comment text,
  add column if not exists resubmission_deadline timestamptz;

alter table public.lessons
  add column if not exists marathon_day smallint,
  add column if not exists lesson_order integer not null default 0;

alter table public.lessons
  drop constraint if exists lessons_marathon_day_check;

alter table public.lessons
  add constraint lessons_marathon_day_check
    check (marathon_day is null or (marathon_day between 1 and 21));

alter table public.daily_reports
  add column if not exists marathon_day smallint;

alter table public.daily_reports
  drop constraint if exists daily_reports_marathon_day_check;

alter table public.daily_reports
  add constraint daily_reports_marathon_day_check
    check (marathon_day is null or (marathon_day between 1 and 21));

create index if not exists tasks_marathon_day_idx
  on public.tasks(marathon_day, task_order, starts_at);

create index if not exists lessons_marathon_day_idx
  on public.lessons(marathon_day, lesson_order, starts_at);

create index if not exists daily_reports_student_marathon_day_idx
  on public.daily_reports(student_id, marathon_day, report_date desc);

create table if not exists public.marathon_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_path text not null,
  href text,
  published boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  sort_order integer not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists marathon_banners_active_idx
  on public.marathon_banners(published, sort_order, starts_at, ends_at);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  category text not null default 'OTHER',
  subject text not null,
  message text not null,
  status text not null default 'NEW',
  staff_note text,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint support_tickets_status_check
    check (status in ('NEW','IN_PROGRESS','RESOLVED'))
);

create index if not exists support_tickets_student_idx
  on public.support_tickets(student_id, created_at desc);

alter table public.marathon_banners enable row level security;
alter table public.support_tickets enable row level security;

drop policy if exists marathon_banners_student_select on public.marathon_banners;
create policy marathon_banners_student_select
on public.marathon_banners
for select
to authenticated
using (
  (
    published = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at >= now())
  )
  or public.is_chief_mentor_or_above()
);

drop policy if exists marathon_banners_staff_insert on public.marathon_banners;
create policy marathon_banners_staff_insert
on public.marathon_banners
for insert
to authenticated
with check (public.is_chief_mentor_or_above());

drop policy if exists marathon_banners_staff_update on public.marathon_banners;
create policy marathon_banners_staff_update
on public.marathon_banners
for update
to authenticated
using (public.is_chief_mentor_or_above())
with check (public.is_chief_mentor_or_above());

drop policy if exists marathon_banners_staff_delete on public.marathon_banners;
create policy marathon_banners_staff_delete
on public.marathon_banners
for delete
to authenticated
using (public.is_chief_mentor_or_above());

drop policy if exists support_tickets_student_select on public.support_tickets;
create policy support_tickets_student_select
on public.support_tickets
for select
to authenticated
using (student_id = (select auth.uid()) or public.is_chief_mentor_or_above());

drop policy if exists support_tickets_student_insert on public.support_tickets;
create policy support_tickets_student_insert
on public.support_tickets
for insert
to authenticated
with check (student_id = (select auth.uid()));

drop policy if exists support_tickets_staff_update on public.support_tickets;
create policy support_tickets_staff_update
on public.support_tickets
for update
to authenticated
using (public.is_chief_mentor_or_above())
with check (public.is_chief_mentor_or_above());

insert into storage.buckets(id, name, public)
values
  ('avatars', 'avatars', true),
  ('banners', 'banners', true)
on conflict(id) do update set public = excluded.public;

drop policy if exists avatars_insert_own on storage.objects;
create policy avatars_insert_own
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists avatars_update_own on storage.objects;
create policy avatars_update_own
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists avatars_delete_own on storage.objects;
create policy avatars_delete_own
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists banners_insert_staff on storage.objects;
create policy banners_insert_staff
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'banners'
  and public.is_chief_mentor_or_above()
);

drop policy if exists banners_update_staff on storage.objects;
create policy banners_update_staff
on storage.objects
for update
to authenticated
using (
  bucket_id = 'banners'
  and public.is_chief_mentor_or_above()
)
with check (
  bucket_id = 'banners'
  and public.is_chief_mentor_or_above()
);

drop policy if exists banners_delete_staff on storage.objects;
create policy banners_delete_staff
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'banners'
  and public.is_chief_mentor_or_above()
);

create trigger marathon_banners_updated_at
before update on public.marathon_banners
for each row execute function public.set_updated_at();

create trigger support_tickets_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();
