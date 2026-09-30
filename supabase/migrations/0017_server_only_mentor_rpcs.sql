-- 0017 — make mentor SECURITY DEFINER RPCs server-only

drop function if exists public.mentor_find_student_by_phone(text);
drop function if exists public.mentor_add_student_to_team(uuid);

create or replace function public.mentor_find_student_by_phone(
  target_phone text,
  requesting_mentor_id uuid
)
returns table(
  id uuid,
  full_name text,
  email text,
  phone text,
  age int,
  education_type public.education_type,
  education_place text,
  status public.profile_status,
  assigned_team_id uuid
)
security definer
set search_path=public,pg_temp
stable
language plpgsql
as $$
declare
  normalized text := public.normalize_kz_phone(target_phone);
begin
  if not exists(
    select 1 from public.profiles
    where id=requesting_mentor_id and role='MENTOR'
  ) then
    raise exception 'mentor_only';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    p.phone,
    p.age,
    p.education_type,
    p.education_place,
    p.status,
    (
      select tm.team_id
      from public.team_members tm
      where tm.student_id=p.id
        and tm.status='ACTIVE'
      limit 1
    )
  from public.profiles p
  where p.phone=normalized
  limit 1;
end;
$$;

create or replace function public.mentor_add_student_to_team(
  target_student_id uuid,
  requesting_mentor_id uuid
)
returns uuid
security definer
set search_path=public,pg_temp
language plpgsql
as $$
declare
  target_team uuid;
  current_team uuid;
  team_capacity int;
  team_count int;
begin
  if (select role from public.profiles where id=requesting_mentor_id) <> 'MENTOR' then
    raise exception 'mentor_only';
  end if;

  select t.id, t.capacity
    into target_team, team_capacity
  from public.teams t
  where t.mentor_id=requesting_mentor_id
    and t.status='ACTIVE'
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
  where tm.student_id=target_student_id
    and tm.status='ACTIVE'
  limit 1;

  if current_team is not null then
    raise exception 'student_already_assigned';
  end if;

  if team_capacity is not null then
    select count(*) into team_count
    from public.team_members tm
    where tm.team_id=target_team
      and tm.status='ACTIVE';

    if team_count >= team_capacity then
      raise exception 'team_capacity_reached';
    end if;
  end if;

  insert into public.team_members(team_id,student_id,assigned_by)
  values(target_team,target_student_id,requesting_mentor_id);

  perform set_config('shyraq.allow_privileged_profile_update','1',true);
  update public.profiles
  set status='ACTIVE'
  where id=target_student_id;

  insert into public.audit_logs(
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    metadata
  )
  values(
    requesting_mentor_id,
    'MENTOR',
    'STUDENT_ASSIGNED',
    'TEAM_MEMBER',
    target_student_id,
    jsonb_build_object('team_id',target_team)
  );

  return target_team;
end;
$$;

revoke all privileges on function public.mentor_find_student_by_phone(text, uuid) from public, anon, authenticated;
revoke all privileges on function public.mentor_add_student_to_team(uuid, uuid) from public, anon, authenticated;

grant execute on function public.mentor_find_student_by_phone(text, uuid) to service_role;
grant execute on function public.mentor_add_student_to_team(uuid, uuid) to service_role;
