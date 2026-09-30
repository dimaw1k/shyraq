-- 0016 — move RLS helper privilege into a non-exposed schema

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

create or replace function private.current_role()
returns public.app_role
security definer
set search_path=public,pg_temp
stable
language sql
as $$
  select role from public.profiles where id=auth.uid();
$$;

create or replace function private.is_admin()
returns boolean
security definer
set search_path=public,pg_temp
stable
language sql
as $$
  select exists(
    select 1 from public.profiles where id=auth.uid() and role='ADMIN'
  );
$$;

create or replace function private.is_team_mentor(target_team_id uuid)
returns boolean
security definer
set search_path=public,pg_temp
stable
language sql
as $$
  select exists(
    select 1 from public.teams where id=target_team_id and mentor_id=auth.uid()
  );
$$;

revoke all privileges on function private.current_role() from public, anon;
revoke all privileges on function private.is_admin() from public, anon;
revoke all privileges on function private.is_team_mentor(uuid) from public, anon;

grant execute on function private.current_role() to authenticated, service_role;
grant execute on function private.is_admin() to authenticated, service_role;
grant execute on function private.is_team_mentor(uuid) to authenticated, service_role;

create or replace function public.current_role()
returns public.app_role
security invoker
set search_path=private,public,pg_temp
stable
language sql
as $$
  select private.current_role();
$$;

create or replace function public.is_admin()
returns boolean
security invoker
set search_path=private,public,pg_temp
stable
language sql
as $$
  select private.is_admin();
$$;

create or replace function public.is_team_mentor(target_team_id uuid)
returns boolean
security invoker
set search_path=private,public,pg_temp
stable
language sql
as $$
  select private.is_team_mentor(target_team_id);
$$;

revoke execute on function public.current_role() from PUBLIC, anon;
revoke execute on function public.is_admin() from PUBLIC, anon;
revoke execute on function public.is_team_mentor(uuid) from PUBLIC, anon;
grant execute on function public.current_role() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_team_mentor(uuid) to authenticated, service_role;
