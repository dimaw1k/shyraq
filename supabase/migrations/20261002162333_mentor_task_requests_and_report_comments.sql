alter table public.daily_reports
  add column if not exists review_comment text;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'mentor_task_request_status') then
    create type public.mentor_task_request_status as enum ('REQUESTED','APPROVED','REJECTED');
  end if;
end $$;

create table if not exists public.mentor_task_requests (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  description text not null,
  instructions text,
  starts_at timestamptz,
  deadline timestamptz,
  points numeric not null default 0 check (points >= 0),
  attachment_required boolean not null default false,
  max_files integer not null default 5 check (max_files between 1 and 10),
  late_points_percent smallint not null default 100 check (late_points_percent between 0 and 100),
  marathon_day smallint check (marathon_day is null or (marathon_day between 1 and 21)),
  task_order integer not null default 0,
  status public.mentor_task_request_status not null default 'REQUESTED',
  review_comment text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mentor_task_requests_status_created
  on public.mentor_task_requests (status, created_at desc);

create index if not exists idx_mentor_task_requests_mentor
  on public.mentor_task_requests (mentor_id, created_at desc);

create index if not exists idx_mentor_task_requests_team
  on public.mentor_task_requests (team_id, created_at desc);

alter table public.mentor_task_requests enable row level security;

revoke all on table public.mentor_task_requests from anon, authenticated;
grant all on table public.mentor_task_requests to service_role;
