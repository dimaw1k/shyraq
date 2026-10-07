-- 2026-10-08 — application security lockdown
--
-- Keep anonymous callers out of application data and storage metadata.
-- Client-side authorization remains protected by authenticated RLS policies;
-- privileged server writes continue through service_role/admin clients.

revoke all privileges on all tables in schema public from anon;
revoke all privileges on all sequences in schema public from anon;
revoke all privileges on all functions in schema public from anon;

alter default privileges for role postgres in schema public
  revoke all on tables from anon;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon;

revoke all privileges on all tables in schema storage from anon;
revoke all privileges on all sequences in schema storage from anon;
revoke all privileges on all functions in schema storage from anon;

do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and roles @> array['public']::name[]
  loop
    execute format(
      'alter policy %I on %I.%I to authenticated',
      p.policyname,
      p.schemaname,
      p.tablename
    );
  end loop;
end
$$;

drop policy if exists profiles_update_self_or_leader on public.profiles;
drop policy if exists profiles_update_self on public.profiles;

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create or replace function public.protect_profile_privileged_fields()
returns trigger
set search_path = public, pg_temp
language plpgsql
as $function$
declare
  jwt_role text := coalesce(current_setting('request.jwt.claim.role', true), '');
  privileged_update text := coalesce(
    current_setting('shyraq.allow_privileged_profile_update', true),
    '0'
  );
begin
  if jwt_role not in ('service_role', 'supabase_admin')
     and privileged_update <> '1'
  then
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
$function$;

revoke all privileges
on function public.normalize_kz_phone(text)
from anon;

revoke all privileges
on function public.normalize_profile_before_write()
from anon;

revoke all privileges
on function public.set_updated_at()
from anon;

drop policy if exists security_rate_limit_buckets_public_access
on public.security_rate_limit_buckets;
