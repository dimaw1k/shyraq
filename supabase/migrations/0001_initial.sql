create extension if not exists pgcrypto;

create type public.app_role as enum ('STUDENT','MENTOR','ADMIN');
create type public.profile_status as enum ('REGISTERED','WAITING_FOR_TEAM','ACTIVE','INACTIVE','COMPLETED');
create type public.education_type as enum ('SCHOOL','COLLEGE','UNIVERSITY','OTHER');
create type public.team_status as enum ('ACTIVE','INACTIVE');
create type public.assignment_status as enum ('ACTIVE','REMOVED');
create type public.submission_status as enum ('DRAFT','SUBMITTED','REVIEWED','REJECTED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'STUDENT',
  status public.profile_status not null default 'WAITING_FOR_TEAM',
  phone text not null,
  email text not null,
  full_name text not null,
  age int not null check (age between 10 and 100),
  education_type public.education_type not null,
  education_place text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_phone_unique on public.profiles(phone);
create unique index profiles_email_unique on public.profiles(lower(email));

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  mentor_id uuid references public.profiles(id) on delete set null,
  status public.team_status not null default 'ACTIVE',
  capacity int check (capacity is null or capacity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.assignment_status not null default 'ACTIVE',
  assigned_by uuid references public.profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  removed_at timestamptz
);

create unique index one_active_team_per_student on public.team_members(student_id) where status = 'ACTIVE';
create index team_members_team_idx on public.team_members(team_id, status);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  instructions text,
  team_id uuid references public.teams(id) on delete cascade,
  starts_at timestamptz,
  deadline timestamptz,
  points numeric(10,2) not null default 0 check (points >= 0),
  attachment_required boolean not null default false,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_team_deadline_idx on public.tasks(team_id, deadline);

create table public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.submission_status not null default 'DRAFT',
  text_answer text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(task_id, student_id)
);

create table public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.task_submissions(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  report_date date not null,
  study_minutes int check (study_minutes is null or study_minutes >= 0),
  completed_task_count int check (completed_task_count is null or completed_task_count >= 0),
  reflection text,
  difficulties text,
  next_day_goal text,
  status public.submission_status not null default 'DRAFT',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, report_date)
);

create table public.report_files (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.daily_reports(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  kinescope_video_id text not null,
  duration_seconds int not null check (duration_seconds > 0),
  required_watch_percent numeric(5,2) not null default 85 check (required_watch_percent between 0 and 100),
  sort_order int not null default 0,
  published boolean not null default false,
  starts_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lessons_published_sort_idx on public.lessons(published, sort_order);

create table public.lesson_tests (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null unique references public.lessons(id) on delete cascade,
  title text not null,
  instructions text,
  passing_score numeric(5,2),
  max_attempts int not null default 1 check (max_attempts > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.test_questions (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.lesson_tests(id) on delete cascade,
  question_text text not null,
  points numeric(10,2) not null default 1 check (points >= 0),
  sort_order int not null default 0
);

create table public.test_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.test_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  sort_order int not null default 0
);

create table public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  test_id uuid not null references public.lesson_tests(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  attempt_number int not null check (attempt_number > 0),
  score numeric(10,2) not null default 0 check (score >= 0),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(test_id, student_id, attempt_number)
);

create table public.video_progress (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  watched_seconds int not null default 0 check (watched_seconds >= 0),
  watched_percent numeric(5,2) not null default 0 check (watched_percent between 0 and 100),
  maximum_position_seconds int not null default 0 check (maximum_position_seconds >= 0),
  watched_ranges jsonb not null default '[]'::jsonb,
  completed boolean not null default false,
  test_unlocked boolean not null default false,
  first_started_at timestamptz,
  last_watched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(lesson_id, student_id)
);

create table public.meet_spaces (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.teams(id) on delete cascade,
  external_space_id text not null unique,
  meeting_url text,
  display_name text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  external_conference_id text not null,
  session_count int not null default 0 check (session_count >= 0),
  attended_seconds int not null default 0 check (attended_seconds >= 0),
  meeting_duration_seconds int not null default 0 check (meeting_duration_seconds >= 0),
  attendance_percent numeric(6,2) not null default 0 check (attendance_percent between 0 and 100),
  status text not null default 'ABSENT',
  started_at timestamptz,
  ended_at timestamptz,
  imported_at timestamptz not null default now(),
  unique(external_conference_id, student_id)
);

create table public.score_rules (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  weight numeric(10,2) not null default 0,
  active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.score_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  source_code text not null,
  source_id uuid,
  points numeric(10,2) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index score_events_student_idx on public.score_events(student_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  actor_role public.app_role,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.marathon_settings (
  id boolean primary key default true,
  name text not null default 'Shyraq',
  default_video_watch_percent numeric(5,2) not null default 85 check (default_video_watch_percent between 0 and 100),
  default_team_capacity int not null default 70 check (default_team_capacity > 0),
  updated_at timestamptz not null default now()
);

insert into public.marathon_settings(id) values (true) on conflict (id) do nothing;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','teams','tasks','task_submissions','daily_reports','lessons','lesson_tests','video_progress','meet_spaces','marathon_settings'] loop
    execute format('create trigger %I_updated_at before update on public.%I for each row execute function public.set_updated_at()',t,t);
  end loop;
end $$;

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles(id,role,status,phone,email,full_name,age,education_type,education_place)
  values(
    new.id,
    'STUDENT',
    'WAITING_FOR_TEAM',
    coalesce(m->>'phone',''),
    lower(coalesce(new.email,'')),
    coalesce(m->>'full_name',''),
    greatest(10,least(100,coalesce((m->>'age')::int,18))),
    coalesce((m->>'education_type')::public.education_type,'OTHER'),
    coalesce(m->>'education_place','')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.current_role()
returns public.app_role
security definer set search_path=public stable language sql
as $$ select role from public.profiles where id=auth.uid(); $$;

create or replace function public.is_admin()
returns boolean security definer set search_path=public stable language sql
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='ADMIN'); $$;

create or replace function public.is_team_mentor(target_team_id uuid)
returns boolean security definer set search_path=public stable language sql
as $$ select exists(select 1 from public.teams where id=target_team_id and mentor_id=auth.uid()); $$;

create or replace function public.mentor_find_student_by_phone(target_phone text)
returns table(id uuid, full_name text, email text, phone text, age int, education_type public.education_type, education_place text, status public.profile_status, assigned_team_id uuid)
security definer set search_path=public stable language plpgsql
as $$
declare normalized text := regexp_replace(trim(target_phone),'[^0-9+]','','g');
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='MENTOR') then
    raise exception 'mentor_only';
  end if;
  return query
  select p.id,p.full_name,p.email,p.phone,p.age,p.education_type,p.education_place,p.status,
         (select tm.team_id from public.team_members tm where tm.student_id=p.id and tm.status='ACTIVE' limit 1)
  from public.profiles p
  where p.phone=normalized
  limit 1;
end;
$$;

create or replace function public.mentor_add_student_to_team(target_student_id uuid)
returns uuid
security definer set search_path=public language plpgsql
as $$
declare target_team uuid;
declare current_team uuid;
begin
  select t.id into target_team from public.teams t where t.mentor_id=auth.uid() and t.status='ACTIVE' order by t.created_at limit 1;
  if target_team is null then raise exception 'mentor_team_not_found'; end if;
  if (select role from public.profiles where id=auth.uid()) <> 'MENTOR' then raise exception 'mentor_only'; end if;
  if (select role from public.profiles where id=target_student_id) <> 'STUDENT' then raise exception 'student_required'; end if;
  select tm.team_id into current_team from public.team_members tm where tm.student_id=target_student_id and tm.status='ACTIVE' limit 1;
  if current_team is not null then raise exception 'student_already_assigned'; end if;
  insert into public.team_members(team_id,student_id,assigned_by) values(target_team,target_student_id,auth.uid());
  update public.profiles set status='ACTIVE' where id=target_student_id;
  insert into public.audit_logs(actor_id,actor_role,action,entity_type,entity_id,metadata)
  values(auth.uid(),'MENTOR','STUDENT_ASSIGNED','TEAM_MEMBER',target_student_id,jsonb_build_object('team_id',target_team));
  return target_team;
end;
$$;

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.tasks enable row level security;
alter table public.task_submissions enable row level security;
alter table public.submission_files enable row level security;
alter table public.daily_reports enable row level security;
alter table public.report_files enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_tests enable row level security;
alter table public.test_questions enable row level security;
alter table public.test_options enable row level security;
alter table public.test_attempts enable row level security;
alter table public.video_progress enable row level security;
alter table public.meet_spaces enable row level security;
alter table public.attendance_records enable row level security;
alter table public.score_rules enable row level security;
alter table public.score_events enable row level security;
alter table public.audit_logs enable row level security;
alter table public.marathon_settings enable row level security;

create policy profiles_select on public.profiles for select using(
  id=auth.uid() or public.is_admin() or exists(
    select 1 from public.team_members tm join public.teams t on t.id=tm.team_id
    where tm.student_id=profiles.id and tm.status='ACTIVE' and t.mentor_id=auth.uid()
  )
);
create policy profiles_update_self_or_admin on public.profiles for update using(id=auth.uid() or public.is_admin());

create policy teams_select on public.teams for select using(public.is_admin() or mentor_id=auth.uid() or exists(select 1 from public.team_members tm where tm.team_id=teams.id and tm.student_id=auth.uid() and tm.status='ACTIVE'));
create policy teams_admin_insert on public.teams for insert with check(public.is_admin());
create policy teams_admin_update on public.teams for update using(public.is_admin());

create policy team_members_select on public.team_members for select using(public.is_admin() or student_id=auth.uid() or public.is_team_mentor(team_id));
create policy team_members_insert on public.team_members for insert with check(public.is_admin() or public.is_team_mentor(team_id));
create policy team_members_admin_update on public.team_members for update using(public.is_admin());

create policy tasks_select on public.tasks for select using(
  public.is_admin() or team_id is null or public.is_team_mentor(team_id) or exists(select 1 from public.team_members tm where tm.team_id=tasks.team_id and tm.student_id=auth.uid() and tm.status='ACTIVE')
);
create policy tasks_admin_all on public.tasks for all using(public.is_admin()) with check(public.is_admin());

create policy submissions_select on public.task_submissions for select using(
  student_id=auth.uid() or public.is_admin() or exists(select 1 from public.tasks t where t.id=task_submissions.task_id and t.team_id is not null and public.is_team_mentor(t.team_id))
);
create policy submissions_insert on public.task_submissions for insert with check(student_id=auth.uid());
create policy submissions_update on public.task_submissions for update using(student_id=auth.uid() or public.is_admin());

create policy daily_reports_select on public.daily_reports for select using(
  student_id=auth.uid() or public.is_admin() or exists(
    select 1 from public.team_members tm join public.teams t on t.id=tm.team_id
    where tm.student_id=daily_reports.student_id and tm.status='ACTIVE' and t.mentor_id=auth.uid()
  )
);
create policy daily_reports_insert on public.daily_reports for insert with check(student_id=auth.uid());
create policy daily_reports_update on public.daily_reports for update using(student_id=auth.uid() or public.is_admin());

create policy lessons_select on public.lessons for select using(published=true or public.is_admin());
create policy lessons_admin_all on public.lessons for all using(public.is_admin()) with check(public.is_admin());
create policy lesson_tests_select on public.lesson_tests for select using(active=true or public.is_admin());
create policy lesson_tests_admin_all on public.lesson_tests for all using(public.is_admin()) with check(public.is_admin());
create policy test_questions_select on public.test_questions for select using(public.is_admin() or exists(select 1 from public.lesson_tests lt join public.lessons l on l.id=lt.lesson_id where lt.id=test_questions.test_id and lt.active=true and l.published=true));
create policy test_options_select on public.test_options for select using(public.is_admin() or exists(select 1 from public.test_questions q join public.lesson_tests lt on lt.id=q.test_id join public.lessons l on l.id=lt.lesson_id where q.id=test_options.question_id and lt.active=true and l.published=true));
create policy test_attempts_select on public.test_attempts for select using(student_id=auth.uid() or public.is_admin());
create policy test_attempts_insert on public.test_attempts for insert with check(student_id=auth.uid());

create policy video_progress_select on public.video_progress for select using(student_id=auth.uid() or public.is_admin());
create policy video_progress_insert on public.video_progress for insert with check(student_id=auth.uid());
create policy video_progress_update on public.video_progress for update using(student_id=auth.uid() or public.is_admin());

create policy meet_spaces_select on public.meet_spaces for select using(public.is_admin() or public.is_team_mentor(team_id) or exists(select 1 from public.team_members tm where tm.team_id=meet_spaces.team_id and tm.student_id=auth.uid() and tm.status='ACTIVE'));
create policy meet_spaces_admin_all on public.meet_spaces for all using(public.is_admin()) with check(public.is_admin());

create policy attendance_select on public.attendance_records for select using(student_id=auth.uid() or public.is_admin() or public.is_team_mentor(team_id));
create policy attendance_admin_all on public.attendance_records for all using(public.is_admin()) with check(public.is_admin());

create policy score_rules_select on public.score_rules for select using(auth.uid() is not null);
create policy score_rules_admin_all on public.score_rules for all using(public.is_admin()) with check(public.is_admin());
create policy score_events_select on public.score_events for select using(student_id=auth.uid() or public.is_admin() or (team_id is not null and public.is_team_mentor(team_id)));
create policy score_events_admin_insert on public.score_events for insert with check(public.is_admin());

create policy audit_logs_admin_select on public.audit_logs for select using(public.is_admin());

create policy marathon_settings_select on public.marathon_settings for select using(auth.uid() is not null);
create policy marathon_settings_admin_all on public.marathon_settings for all using(public.is_admin()) with check(public.is_admin());

insert into public.marathon_settings(id) values(true) on conflict(id) do nothing;
insert into public.score_rules(code,label) values
('TASKS','Task completion'),('REPORTS','Daily reports'),('ATTENDANCE','Google Meet attendance'),
('VIDEO','Video completion'),('TESTS','Lesson tests'),('STREAK','Streak bonus')
on conflict(code) do nothing;
