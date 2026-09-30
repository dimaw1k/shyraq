-- 0015 — security hardening for public RPC surface and mutable search paths

create or replace function public.normalize_kz_phone(input_phone text)
returns text
immutable
set search_path=public
language plpgsql
as $$
declare digits text := regexp_replace(coalesce(input_phone,''),'[^0-9]','','g');
begin
  if digits like '8%' and length(digits)=11 then return '+7'||substring(digits from 2); end if;
  if digits like '7%' and length(digits)=11 then return '+'||digits; end if;
  if length(digits)=10 then return '+7'||digits; end if;
  return trim(input_phone);
end;
$$;

create or replace function public.normalize_profile_before_write()
returns trigger
set search_path=public
language plpgsql
as $$
begin
  new.phone := public.normalize_kz_phone(new.phone);
  new.email := lower(trim(new.email));
  new.full_name := trim(new.full_name);
  new.education_place := trim(new.education_place);
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger
set search_path=public
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger-only functions never need to be callable through PostgREST.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileged_fields() from public, anon, authenticated;

-- Admin role/status changes are now performed by the server through the existing
-- admin RLS policy, so these SECURITY DEFINER RPCs no longer need an API surface.
revoke execute on function public.admin_set_profile_role(uuid, public.app_role) from public, anon, authenticated;
revoke execute on function public.admin_set_profile_status(uuid, public.profile_status) from public, anon, authenticated;

-- Mentor RPCs are server-route operations. Keep them available to signed-in
-- users because the route uses the user's Supabase session, but remove anonymous access.
revoke execute on function public.mentor_find_student_by_phone(text) from anon;
revoke execute on function public.mentor_add_student_to_team(uuid) from anon;

-- Authorization helpers are used from RLS policies but never need anonymous API access.
revoke execute on function public.current_role() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_team_mentor(uuid) from anon;
