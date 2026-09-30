create table public.google_connections (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  google_subject text,
  google_email text,
  refresh_token_encrypted text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger google_connections_updated_at
before update on public.google_connections
for each row execute function public.set_updated_at();

alter table public.google_connections enable row level security;

create policy google_connections_self_select
on public.google_connections for select
using (user_id = auth.uid() or public.is_admin());

create table public.meet_conferences (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  external_conference_id text not null unique,
  space_name text not null,
  start_time timestamptz,
  end_time timestamptz,
  raw jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);

create index meet_conferences_team_time_idx
on public.meet_conferences(team_id, start_time desc);

create table public.meet_participants (
  id uuid primary key default gen_random_uuid(),
  conference_id uuid not null references public.meet_conferences(id) on delete cascade,
  external_participant_id text not null,
  google_user_id text,
  display_name text,
  student_id uuid references public.profiles(id) on delete set null,
  match_status text not null default 'UNMATCHED'
    check (match_status in ('MATCHED','UNMATCHED','MANUALLY_MATCHED','IGNORED')),
  earliest_start_time timestamptz,
  latest_end_time timestamptz,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(conference_id, external_participant_id)
);

create index meet_participants_student_idx
on public.meet_participants(student_id, created_at desc);

create index meet_participants_google_idx
on public.meet_participants(google_user_id);

create table public.meet_participant_mappings (
  google_user_id text primary key,
  student_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger meet_participant_mappings_updated_at
before update on public.meet_participant_mappings
for each row execute function public.set_updated_at();

alter table public.meet_conferences enable row level security;
alter table public.meet_participants enable row level security;
alter table public.meet_participant_mappings enable row level security;

create policy meet_conferences_select
on public.meet_conferences for select
using (
  public.is_admin()
  or exists(select 1 from public.teams t where t.id = meet_conferences.team_id and t.mentor_id = auth.uid())
  or exists(select 1 from public.team_members tm where tm.team_id = meet_conferences.team_id and tm.student_id = auth.uid() and tm.status = 'ACTIVE')
);

create policy meet_conferences_admin_all
on public.meet_conferences for all
using (public.is_admin())
with check (public.is_admin());

create policy meet_participants_select
on public.meet_participants for select
using (
  public.is_admin()
  or student_id = auth.uid()
  or exists(
    select 1 from public.meet_conferences c
    join public.teams t on t.id=c.team_id
    where c.id=meet_participants.conference_id and t.mentor_id=auth.uid()
  )
);

create policy meet_participants_admin_all
on public.meet_participants for all
using (public.is_admin())
with check (public.is_admin());

create policy meet_participant_mappings_select
on public.meet_participant_mappings for select
using (public.is_admin() or student_id = auth.uid());

create policy meet_participant_mappings_admin_all
on public.meet_participant_mappings for all
using (public.is_admin())
with check (public.is_admin());
