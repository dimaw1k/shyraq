create or replace function public.protect_profile_privileged_fields()
returns trigger
security definer
set search_path=public
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
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

drop trigger if exists profiles_protect_privileged_fields on public.profiles;
create trigger profiles_protect_privileged_fields
before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

create or replace function public.admin_set_profile_status(
  target_student_id uuid,
  target_status public.profile_status
)
returns void
security definer
set search_path=public
language plpgsql
as $$
begin
  if not public.is_admin() then
    raise exception 'admin_only';
  end if;
  update public.profiles set status=target_status where id=target_student_id;
end;
$$;

create or replace function public.admin_set_profile_role(
  target_user_id uuid,
  target_role public.app_role
)
returns void
security definer
set search_path=public
language plpgsql
as $$
begin
  if not public.is_admin() then
    raise exception 'admin_only';
  end if;
  update public.profiles set role=target_role where id=target_user_id;
end;
$$;
