create policy submission_storage_select_v2
on storage.objects for select to authenticated
using (
  bucket_id='submissions'
  and (
    (storage.foldername(name))[1]=auth.uid()::text
    or public.is_admin()
    or exists(
      select 1
      from public.submission_files sf
      join public.task_submissions s on s.id=sf.submission_id
      join public.tasks task on task.id=s.task_id
      join public.teams team on team.id=task.team_id
      where sf.storage_path=storage.objects.name
        and team.mentor_id=auth.uid()
    )
    or exists(
      select 1
      from public.report_files rf
      join public.daily_reports r on r.id=rf.report_id
      join public.team_members tm on tm.student_id=r.student_id and tm.status='ACTIVE'
      join public.teams team on team.id=tm.team_id
      where rf.storage_path=storage.objects.name
        and team.mentor_id=auth.uid()
    )
  )
);

drop policy if exists submission_storage_select on storage.objects;

create or replace function public.mentor_add_student_to_team(target_student_id uuid)
returns uuid
security definer set search_path=public language plpgsql
as $$
declare target_team uuid;
declare current_team uuid;
declare team_capacity int;
declare team_count int;
begin
  if (select role from public.profiles where id=auth.uid()) <> 'MENTOR' then
    raise exception 'mentor_only';
  end if;

  select t.id, t.capacity
    into target_team, team_capacity
  from public.teams t
  where t.mentor_id=auth.uid() and t.status='ACTIVE'
  order by t.created_at
  limit 1;

  if target_team is null then
    raise exception 'mentor_team_not_found';
  end if;

  if (select role from public.profiles where id=target_student_id) <> 'STUDENT' then
    raise exception 'student_required';
  end if;

  select tm.team_id
    into current_team
  from public.team_members tm
  where tm.student_id=target_student_id and tm.status='ACTIVE'
  limit 1;

  if current_team is not null then
    raise exception 'student_already_assigned';
  end if;

  if team_capacity is not null then
    select count(*) into team_count
    from public.team_members tm
    where tm.team_id=target_team and tm.status='ACTIVE';

    if team_count >= team_capacity then
      raise exception 'team_capacity_reached';
    end if;
  end if;

  insert into public.team_members(team_id,student_id,assigned_by)
  values(target_team,target_student_id,auth.uid());

  update public.profiles
  set status='ACTIVE'
  where id=target_student_id;

  insert into public.audit_logs(actor_id,actor_role,action,entity_type,entity_id,metadata)
  values(
    auth.uid(),
    'MENTOR',
    'STUDENT_ASSIGNED',
    'TEAM_MEMBER',
    target_student_id,
    jsonb_build_object('team_id',target_team)
  );

  return target_team;
end;
$$;
