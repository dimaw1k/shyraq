create or replace function public.protect_profile_privileged_fields()
returns trigger
security definer
set search_path=public
language plpgsql
as $$
begin
  if auth.uid() is not null
     and not public.is_admin()
     and coalesce(current_setting('shyraq.allow_privileged_profile_update', true), '0') <> '1' then
    if new.role is distinct from old.role then
      raise exception 'role_change_forbidden';
    end if;
    if new.status is distinct from old.status then
      raise exception 'status_change_forbidden';
    end if;
    if new.email is distinct from old.email then
      raise exception 'email_change_forbidden';
    end if;
  end if;
  return new;
end;
$$;

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

  if target_team is null then raise exception 'mentor_team_not_found'; end if;
  if (select role from public.profiles where id=target_student_id) <> 'STUDENT' then raise exception 'student_required'; end if;

  select tm.team_id into current_team
  from public.team_members tm
  where tm.student_id=target_student_id and tm.status='ACTIVE'
  limit 1;

  if current_team is not null then raise exception 'student_already_assigned'; end if;

  if team_capacity is not null then
    select count(*) into team_count
    from public.team_members tm
    where tm.team_id=target_team and tm.status='ACTIVE';

    if team_count >= team_capacity then raise exception 'team_capacity_reached'; end if;
  end if;

  insert into public.team_members(team_id,student_id,assigned_by)
  values(target_team,target_student_id,auth.uid());

  perform set_config('shyraq.allow_privileged_profile_update','1',true);
  update public.profiles set status='ACTIVE' where id=target_student_id;

  insert into public.audit_logs(actor_id,actor_role,action,entity_type,entity_id,metadata)
  values(auth.uid(),'MENTOR','STUDENT_ASSIGNED','TEAM_MEMBER',target_student_id,jsonb_build_object('team_id',target_team));

  return target_team;
end;
$$;
