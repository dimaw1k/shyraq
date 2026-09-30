create table public.meet_participant_sessions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.meet_participants(id) on delete cascade,
  external_session_id text not null,
  start_time timestamptz,
  end_time timestamptz,
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(participant_id, external_session_id)
);

create index meet_participant_sessions_participant_idx
on public.meet_participant_sessions(participant_id, start_time desc);

alter table public.meet_participant_sessions enable row level security;

create policy meet_participant_sessions_select
on public.meet_participant_sessions for select
using (
  public.is_admin()
  or exists(
    select 1
    from public.meet_participants p
    join public.meet_conferences c on c.id=p.conference_id
    join public.teams t on t.id=c.team_id
    where p.id=meet_participant_sessions.participant_id
      and (
        t.mentor_id=auth.uid()
        or p.student_id=auth.uid()
      )
  )
);

create policy meet_participant_sessions_admin_all
on public.meet_participant_sessions for all
using (public.is_admin())
with check (public.is_admin());
