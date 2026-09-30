-- 0013 — mentor visibility for student video progress

drop policy if exists video_progress_select on public.video_progress;

create policy video_progress_select
on public.video_progress for select
using (
  student_id = auth.uid()
  or public.is_admin()
  or exists(
    select 1
    from public.team_members tm
    join public.teams t on t.id = tm.team_id
    where tm.student_id = video_progress.student_id
      and tm.status = 'ACTIVE'
      and t.status = 'ACTIVE'
      and t.mentor_id = auth.uid()
  )
);
