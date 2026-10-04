-- Remove age from the active profile schema and keep the auth trigger compatible with OAuth users.
alter table public.profiles
  drop column if exists age;

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $function$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw_phone text := trim(coalesce(metadata->>'phone', ''));
  phone_digits text := regexp_replace(raw_phone, '[^0-9]', '', 'g');
  normalized_phone text;
  education text := upper(trim(coalesce(metadata->>'education_type', 'OTHER')));
  full_name text := trim(coalesce(metadata->>'full_name', ''));
begin
  if new.email is null or trim(new.email) = '' then
    raise exception 'email_required';
  end if;

  if phone_digits <> '' then
    if phone_digits like '8%' and length(phone_digits) = 11 then
      phone_digits := '7' || substring(phone_digits from 2);
    elsif phone_digits like '7%' and length(phone_digits) = 11 then
      null;
    elsif length(phone_digits) = 10 then
      phone_digits := '7' || phone_digits;
    else
      raise exception 'invalid_kz_phone';
    end if;

    if phone_digits !~ '^7[0-9]{10}$' then
      raise exception 'invalid_kz_phone';
    end if;

    normalized_phone := '+' || phone_digits;
  else
    normalized_phone := '+7' || translate(substr(md5(new.id::text), 1, 10), 'abcdef', '012345');
  end if;

  if length(full_name) < 2 then
    full_name := split_part(lower(trim(new.email)), '@', 1);
  end if;

  if length(full_name) < 2 then
    full_name := 'Shyraq user';
  end if;

  if education not in ('SCHOOL','COLLEGE','UNIVERSITY','OTHER') then
    education := 'OTHER';
  end if;

  insert into public.profiles(
    id, role, status, phone, email, full_name, education_type
  )
  values(
    new.id,
    'STUDENT',
    'WAITING_FOR_TEAM',
    normalized_phone,
    lower(trim(new.email)),
    full_name,
    education::public.education_type
  );

  return new;
end;
$function$;

drop function if exists public.mentor_find_student_by_phone(text, uuid);

create or replace function public.mentor_find_student_by_phone(
  target_phone text,
  requesting_mentor_id uuid
)
returns table(
  id uuid,
  full_name text,
  email text,
  phone text,
  education_type public.education_type,
  status public.profile_status,
  assigned_team_id uuid
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
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
    p.education_type,
    p.status,
    (
      select tm.team_id
      from public.team_members tm
      where tm.student_id=p.id and tm.status='ACTIVE'
      limit 1
    )
  from public.profiles p
  where p.phone=normalized
  limit 1;
end;
$function$;
