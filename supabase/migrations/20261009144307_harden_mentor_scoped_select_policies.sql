drop policy if exists daily_reports_select on public.daily_reports;
create policy daily_reports_select on public.daily_reports
for select to authenticated
using (
  student_id = (select auth.uid())
  or (select public.is_chief_mentor_or_above())
  or exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.student_id = daily_reports.student_id
      and tm.status = 'ACTIVE'
      and public.is_team_mentor(t.id)
  )
);

drop policy if exists meet_conferences_select on public.meet_conferences;
create policy meet_conferences_select on public.meet_conferences
for select to authenticated
using (
  (select public.is_chief_mentor_or_above())
  or public.is_team_mentor(meet_conferences.team_id)
  or exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.team_id = meet_conferences.team_id
      and tm.student_id = (select auth.uid())
      and tm.status = 'ACTIVE'
      and t.status = 'ACTIVE'
  )
);

drop policy if exists meet_participant_sessions_select on public.meet_participant_sessions;
create policy meet_participant_sessions_select on public.meet_participant_sessions
for select to authenticated
using (
  (select public.is_chief_mentor_or_above())
  or exists (
    select 1
    from public.meet_participants p
    join public.meet_conferences c on c.id = p.conference_id
    where p.id = meet_participant_sessions.participant_id
      and (
        public.is_team_mentor(c.team_id)
        or p.student_id = (select auth.uid())
      )
  )
);

drop policy if exists meet_participants_select on public.meet_participants;
create policy meet_participants_select on public.meet_participants
for select to authenticated
using (
  (select public.is_chief_mentor_or_above())
  or student_id = (select auth.uid())
  or exists (
    select 1
    from public.meet_conferences c
    where c.id = meet_participants.conference_id
      and public.is_team_mentor(c.team_id)
  )
);

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to authenticated
using (
  id = (select auth.uid())
  or (select public.is_chief_mentor_or_above())
  or exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.student_id = profiles.id
      and tm.status = 'ACTIVE'
      and public.is_team_mentor(t.id)
  )
);

drop policy if exists report_files_student_select on public.report_files;
create policy report_files_student_select on public.report_files
for select to authenticated
using (
  (select public.is_chief_mentor_or_above())
  or exists (
    select 1
    from public.daily_reports r
    where r.id = report_files.report_id
      and r.student_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.daily_reports r
    join public.team_members tm on tm.student_id = r.student_id and tm.status = 'ACTIVE'
    join public.teams t on t.id = tm.team_id
    where r.id = report_files.report_id
      and public.is_team_mentor(t.id)
  )
);

drop policy if exists teams_select on public.teams;
create policy teams_select on public.teams
for select to authenticated
using (
  (select public.is_chief_mentor_or_above())
  or public.is_team_mentor(teams.id)
  or exists (
    select 1
    from public.team_members tm
    where tm.team_id = teams.id
      and tm.student_id = (select auth.uid())
      and tm.status = 'ACTIVE'
  )
);

drop policy if exists video_progress_select on public.video_progress;
create policy video_progress_select on public.video_progress
for select to authenticated
using (
  student_id = (select auth.uid())
  or (select public.is_chief_mentor_or_above())
  or exists (
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.student_id = video_progress.student_id
      and tm.status = 'ACTIVE'
      and t.status = 'ACTIVE'
      and public.is_team_mentor(t.id)
  )
);

drop policy if exists submission_storage_select_v2 on storage.objects;
create policy submission_storage_select_v2 on storage.objects
for select to authenticated
using (
  bucket_id = 'submissions'
  and (
    (storage.foldername(name))[1] = (select auth.uid())::text
    or (select public.is_chief_mentor_or_above())
    or exists (
      select 1
      from public.submission_files sf
      join public.task_submissions s on s.id = sf.submission_id
      join public.tasks task on task.id = s.task_id
      join public.teams team on team.id = task.team_id
      where sf.storage_path = objects.name
        and public.is_team_mentor(team.id)
    )
    or exists (
      select 1
      from public.report_files rf
      join public.daily_reports r on r.id = rf.report_id
      join public.team_members tm on tm.student_id = r.student_id and tm.status = 'ACTIVE'
      join public.teams team on team.id = tm.team_id
      where rf.storage_path = objects.name
        and public.is_team_mentor(team.id)
    )
  )
);