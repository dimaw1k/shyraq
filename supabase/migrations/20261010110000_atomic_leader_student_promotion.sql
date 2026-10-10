-- Make Leader promotions from STUDENT to staff transactional.
-- Removing active team memberships and changing profile role/status must succeed
-- together, or neither change should be visible.
create or replace function public.leader_promote_student_to_staff(
  p_target_user_id uuid,
  p_requesting_actor_id uuid,
  p_new_role text,
  p_new_status text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  actor_profile public.profiles%rowtype;
  target_profile public.profiles%rowtype;
  membership_row record;
  next_status public.profile_status;
  removed_memberships integer := 0;
begin
  if p_target_user_id is null
     or p_requesting_actor_id is null
     or p_new_role is null
     or p_new_role not in ('MENTOR', 'CHIEF_MENTOR', 'LEADER') then
    raise exception 'Invalid staff promotion request'
      using errcode = '22023';
  end if;

  if p_new_status is not null
     and p_new_status not in ('REGISTERED', 'WAITING_FOR_TEAM', 'ACTIVE', 'INACTIVE', 'COMPLETED') then
    raise exception 'Invalid target profile status'
      using errcode = '22023';
  end if;

  if p_target_user_id = p_requesting_actor_id then
    raise exception 'A Leader cannot change their own role'
      using errcode = '22023';
  end if;

  select *
  into actor_profile
  from public.profiles
  where id = p_requesting_actor_id
  for share;

  if not found
     or actor_profile.role <> 'LEADER'::public.app_role
     or actor_profile.status <> 'ACTIVE'::public.profile_status then
    raise exception 'Active Leader authorization required'
      using errcode = '42501';
  end if;

  select *
  into target_profile
  from public.profiles
  where id = p_target_user_id
  for update;

  if not found then
    raise exception 'Profile not found'
      using errcode = 'P0002';
  end if;

  if target_profile.role <> 'STUDENT'::public.app_role then
    raise exception 'Only a student can be promoted through this operation'
      using errcode = '22023';
  end if;

  next_status := coalesce(p_new_status, 'ACTIVE')::public.profile_status;

  for membership_row in
    update public.team_members
    set
      status = 'REMOVED'::public.assignment_status,
      removed_at = clock_timestamp()
    where student_id = p_target_user_id
      and status = 'ACTIVE'::public.assignment_status
    returning id, team_id
  loop
    removed_memberships := removed_memberships + 1;

    insert into public.audit_logs (
      actor_id, actor_role, action, entity_type, entity_id, metadata
    )
    values (
      actor_profile.id,
      actor_profile.role,
      'TEAM_MEMBERSHIP_REMOVED',
      'TEAM_MEMBER',
      membership_row.id,
      jsonb_build_object(
        'student_id', p_target_user_id,
        'team_id', membership_row.team_id,
        'reason', 'PROFILE_PROMOTED_TO_STAFF'
      )
    );
  end loop;

  update public.profiles
  set
    role = p_new_role::public.app_role,
    status = next_status,
    updated_at = clock_timestamp()
  where id = p_target_user_id;

  insert into public.audit_logs (
    actor_id, actor_role, action, entity_type, entity_id, metadata
  )
  values (
    actor_profile.id,
    actor_profile.role,
    'PROFILE_ROLE_CHANGED',
    'PROFILE',
    p_target_user_id,
    jsonb_build_object(
      'from_role', target_profile.role::text,
      'to_role', p_new_role,
      'from_status', target_profile.status::text,
      'to_status', next_status::text,
      'removed_active_memberships', removed_memberships
    )
  );

  return p_target_user_id;
end;
$function$;

revoke all on function public.leader_promote_student_to_staff(uuid, uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.leader_promote_student_to_staff(uuid, uuid, text, text)
  to service_role;
