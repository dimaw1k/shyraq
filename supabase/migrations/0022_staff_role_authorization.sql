-- 0022 — migrate authorization from ADMIN to the staff role hierarchy
--
-- Role hierarchy:
--   LEADER > CHIEF_MENTOR > MENTOR > STUDENT
--
-- LEADER:
--   platform-wide staff management, audit log, settings, and full staff access.
--
-- CHIEF_MENTOR:
--   mentor/team/content/report/meet/score management across the marathon.
--
-- MENTOR:
--   existing team-scoped access remains unchanged.
--
-- This migration removes the legacy is_admin/admin_* API surface and changes
-- policies to use the new role helpers.

create or replace function private.is_staff()
returns boolean
security definer
set search_path=public,pg_temp
stable
language sql
as $$
  select exists(
    select 1
    from public.profiles
    where id=auth.uid()
      and role in ('MENTOR','CHIEF_MENTOR','LEADER')
  );
$$;

create or replace function private.is_chief_mentor_or_above()
returns boolean
security definer
set search_path=public,pg_temp
stable
language sql
as $$
  select exists(
    select 1
    from public.profiles
    where id=auth.uid()
      and role in ('CHIEF_MENTOR','LEADER')
  );
$$;

create or replace function private.is_leader()
returns boolean
security definer
set search_path=public,pg_temp
stable
language sql
as $$
  select exists(
    select 1
    from public.profiles
    where id=auth.uid()
      and role='LEADER'
  );
$$;

revoke all privileges on function private.is_staff() from public,anon;
revoke all privileges on function private.is_chief_mentor_or_above() from public,anon;
revoke all privileges on function private.is_leader() from public,anon;

grant execute on function private.is_staff() to authenticated,service_role;
grant execute on function private.is_chief_mentor_or_above() to authenticated,service_role;
grant execute on function private.is_leader() to authenticated,service_role;

create or replace function public.is_staff()
returns boolean
security invoker
set search_path=private,public,pg_temp
stable
language sql
as $$
  select private.is_staff();
$$;

create or replace function public.is_chief_mentor_or_above()
returns boolean
security invoker
set search_path=private,public,pg_temp
stable
language sql
as $$
  select private.is_chief_mentor_or_above();
$$;

create or replace function public.is_leader()
returns boolean
security invoker
set search_path=private,public,pg_temp
stable
language sql
as $$
  select private.is_leader();
$$;

revoke execute on function public.is_staff() from PUBLIC,anon;
revoke execute on function public.is_chief_mentor_or_above() from PUBLIC,anon;
revoke execute on function public.is_leader() from PUBLIC,anon;

grant execute on function public.is_staff() to authenticated,service_role;
grant execute on function public.is_chief_mentor_or_above() to authenticated,service_role;
grant execute on function public.is_leader() to authenticated,service_role;

-- Move every existing policy away from the legacy helper and naming.
do $$
declare
  p record;
  new_policy_name text;
  using_expr text;
  check_expr text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname='public'
  loop
    if p.qual is not null and p.qual like '%is_admin%' then
      using_expr := replace(p.qual, 'is_admin', 'is_leader');
      execute format(
        'alter policy %I on %I.%I using (%s)',
        p.policyname, p.schemaname, p.tablename, using_expr
      );
    end if;

    if p.with_check is not null and p.with_check like '%is_admin%' then
      check_expr := replace(p.with_check, 'is_admin', 'is_leader');
      execute format(
        'alter policy %I on %I.%I with check (%s)',
        p.policyname, p.schemaname, p.tablename, check_expr
      );
    end if;

    if p.policyname ilike '%admin%' then
      new_policy_name := replace(lower(p.policyname), 'admin', 'staff');
      execute format(
        'alter policy %I on %I.%I rename to %I',
        p.policyname, p.schemaname, p.tablename, new_policy_name
      );
    end if;
  end loop;
end
$$;

-- Chief mentor and leader share marathon-wide operational access for these
-- domains. Leader-only domains (audit/settings) remain leader-only below.
do $$
declare
  p record;
  using_expr text;
  check_expr text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname='public'
      and tablename in (
        'attendance_records',
        'daily_reports',
        'lesson_tests',
        'lessons',
        'meet_conferences',
        'meet_participant_mappings',
        'meet_participant_sessions',
        'meet_participants',
        'meet_spaces',
        'report_files',
        'score_events',
        'score_rules',
        'submission_files',
        'task_submissions',
        'tasks',
        'team_members',
        'teams',
        'test_answers',
        'test_attempts',
        'test_options',
        'test_questions',
        'video_progress'
      )
  loop
    if p.qual is not null then
      using_expr := regexp_replace(
        p.qual,
        'is_leader[[:space:]]*[(][[:space:]]*[)]',
        'is_chief_mentor_or_above()',
        'g'
      );
      if using_expr <> p.qual then
        execute format(
          'alter policy %I on %I.%I using (%s)',
          p.policyname, p.schemaname, p.tablename, using_expr
        );
      end if;
    end if;

    if p.with_check is not null then
      check_expr := regexp_replace(
        p.with_check,
        'is_leader[[:space:]]*[(][[:space:]]*[)]',
        'is_chief_mentor_or_above()',
        'g'
      );
      if check_expr <> p.with_check then
        execute format(
          'alter policy %I on %I.%I with check (%s)',
          p.policyname, p.schemaname, p.tablename, check_expr
        );
      end if;
    end if;
  end loop;
end
$$;

-- Profiles are visible to the whole management layer, while direct role
-- assignment remains leader-only.
alter policy profiles_select
on public.profiles
using (
  id=(select auth.uid())
  or (select public.is_chief_mentor_or_above())
  or exists(
    select 1
    from public.team_members tm
    join public.teams t on t.id=tm.team_id
    where tm.student_id=profiles.id
      and tm.status='ACTIVE'
      and t.mentor_id=(select auth.uid())
  )
);

drop policy if exists profiles_update_self_or_staff on public.profiles;
drop policy if exists profiles_update_self_or_leader on public.profiles;

create policy profiles_update_self_or_leader
on public.profiles
for update
using (
  id=(select auth.uid())
  or (select public.is_leader())
);

-- Replace the legacy admin RPCs with explicit role-aware operations.
drop function if exists public.admin_set_profile_role(uuid,public.app_role);
drop function if exists public.admin_set_profile_status(uuid,public.profile_status);

create or replace function public.leader_set_profile_role(
  target_user_id uuid,
  target_role public.app_role
)
returns void
security definer
set search_path=public,pg_temp
language plpgsql
as $$
begin
  if not public.is_leader() then
    raise exception 'leader_only';
  end if;

  perform set_config('shyraq.allow_privileged_profile_update','1',true);

  update public.profiles
  set role=target_role
  where id=target_user_id;

  if not found then
    raise exception 'profile_not_found';
  end if;

  insert into public.audit_logs(
    actor_id, actor_role, action, entity_type, entity_id, metadata
  )
  values(
    auth.uid(),
    'LEADER',
    'PROFILE_ROLE_CHANGED',
    'PROFILE',
    target_user_id,
    jsonb_build_object('new_role',target_role)
  );
end;
$$;

create or replace function public.staff_set_profile_status(
  target_student_id uuid,
  target_status public.profile_status
)
returns void
security definer
set search_path=public,pg_temp
language plpgsql
as $$
declare
  actor_role_value public.app_role;
begin
  select role into actor_role_value
  from public.profiles
  where id=auth.uid();

  if actor_role_value not in ('CHIEF_MENTOR','LEADER') then
    raise exception 'chief_mentor_or_leader_only';
  end if;

  if not exists(
    select 1
    from public.profiles
    where id=target_student_id
      and role='STUDENT'
  ) then
    raise exception 'student_required';
  end if;

  perform set_config('shyraq.allow_privileged_profile_update','1',true);

  update public.profiles
  set status=target_status
  where id=target_student_id;

  insert into public.audit_logs(
    actor_id, actor_role, action, entity_type, entity_id, metadata
  )
  values(
    auth.uid(),
    actor_role_value,
    'PROFILE_STATUS_CHANGED',
    'PROFILE',
    target_student_id,
    jsonb_build_object('new_status',target_status)
  );
end;
$$;

revoke all privileges on function public.leader_set_profile_role(uuid,public.app_role) from public,anon,authenticated;
revoke all privileges on function public.staff_set_profile_status(uuid,public.profile_status) from public,anon,authenticated;

grant execute on function public.leader_set_profile_role(uuid,public.app_role) to service_role;
grant execute on function public.staff_set_profile_status(uuid,public.profile_status) to service_role;

create or replace function public.protect_profile_privileged_fields()
returns trigger
set search_path=public,pg_temp
language plpgsql
as $$
begin
  if auth.uid() is not null
     and not public.is_leader()
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

drop function if exists public.record_score_event(uuid,uuid,text,uuid,numeric,jsonb);

create or replace function public.record_score_event(
  target_student uuid,
  target_team uuid,
  target_source_code text,
  target_source_id uuid,
  target_points numeric,
  target_metadata jsonb
)
returns uuid
security definer
set search_path=public,pg_temp
language plpgsql
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authenticated_caller_required';
  end if;

  if auth.uid() <> target_student
     and not public.is_chief_mentor_or_above()
     and not public.is_team_mentor(target_team) then
    raise exception 'score_event_forbidden';
  end if;

  if target_points < 0 then
    raise exception 'negative_score_forbidden';
  end if;

  insert into public.score_events(
    student_id, team_id, source_code, source_id, points, metadata
  )
  values(
    target_student,
    target_team,
    target_source_code,
    target_source_id,
    target_points,
    coalesce(target_metadata,'{}'::jsonb)
  )
  on conflict(student_id,source_code,source_id) do nothing
  returning id into new_id;

  return new_id;
end;
$$;

-- Legacy public/private helpers are no longer part of authorization.
revoke all privileges on function public.is_admin() from public,anon,authenticated;
revoke all privileges on function private.is_admin() from public,anon,authenticated;

drop function public.is_admin();
drop function private.is_admin();

revoke all privileges on function public.leader_set_profile_role(uuid,public.app_role) from public,anon,authenticated;
revoke all privileges on function public.staff_set_profile_status(uuid,public.profile_status) from public,anon,authenticated;

-- Keep the server-only role-management RPC surface available only to service_role.
grant execute on function public.leader_set_profile_role(uuid,public.app_role) to service_role;
grant execute on function public.staff_set_profile_status(uuid,public.profile_status) to service_role;
