-- 0012 — server-only writes for integrity-sensitive records

drop policy if exists team_members_insert on public.team_members;
create policy team_members_admin_insert
on public.team_members for insert
with check (public.is_admin());

drop policy if exists submissions_insert on public.task_submissions;
drop policy if exists submissions_update on public.task_submissions;

create policy submissions_admin_write
on public.task_submissions for insert
with check (public.is_admin());

create policy submissions_admin_update
on public.task_submissions for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists daily_reports_insert on public.daily_reports;
drop policy if exists daily_reports_update on public.daily_reports;

create policy daily_reports_admin_insert
on public.daily_reports for insert
with check (public.is_admin());

create policy daily_reports_admin_update
on public.daily_reports for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists video_progress_insert on public.video_progress;
drop policy if exists video_progress_update on public.video_progress;

create policy video_progress_admin_insert
on public.video_progress for insert
with check (public.is_admin());

create policy video_progress_admin_update
on public.video_progress for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists test_attempts_insert on public.test_attempts;

create policy test_attempts_admin_insert
on public.test_attempts for insert
with check (public.is_admin());

drop policy if exists test_answers_insert on public.test_answers;

create policy test_answers_admin_insert
on public.test_answers for insert
with check (public.is_admin());

create or replace function public.record_score_event(
  target_student uuid,
  target_team uuid,
  target_source_code text,
  target_source_id uuid,
  target_points numeric,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
security definer
set search_path=public
language plpgsql
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authenticated_caller_required';
  end if;

  if auth.uid() <> target_student and not public.is_admin() then
    raise exception 'score_event_forbidden';
  end if;

  if target_points < 0 then
    raise exception 'negative_score_forbidden';
  end if;

  insert into public.score_events(
    student_id,
    team_id,
    source_code,
    source_id,
    points,
    metadata
  )
  values(
    target_student,
    target_team,
    target_source_code,
    target_source_id,
    target_points,
    coalesce(target_metadata, '{}'::jsonb)
  )
  on conflict(student_id,source_code,source_id) do nothing
  returning id into new_id;

  return new_id;
end;
$$;
