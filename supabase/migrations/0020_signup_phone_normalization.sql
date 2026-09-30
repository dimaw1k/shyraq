-- 0020 — make signup phone normalization tolerant of formatted input

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path=public
language plpgsql
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  raw_phone text := coalesce(metadata->>'phone', '');
  phone_digits text := regexp_replace(raw_phone, '[^0-9]', '', 'g');
  normalized_phone text;
  raw_age text := trim(coalesce(metadata->>'age', ''));
  parsed_age int;
  education text := upper(trim(coalesce(metadata->>'education_type', 'OTHER')));
  full_name text := trim(coalesce(metadata->>'full_name', ''));
  education_place text := trim(coalesce(metadata->>'education_place', ''));
begin
  if new.email is null or trim(new.email) = '' then
    raise exception 'email_required';
  end if;

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

  if length(full_name) < 2 then
    raise exception 'full_name_required';
  end if;

  if raw_age !~ '^[0-9]+$' then
    raise exception 'invalid_age';
  end if;

  parsed_age := raw_age::int;
  if parsed_age < 10 or parsed_age > 100 then
    raise exception 'invalid_age';
  end if;

  if education not in ('SCHOOL','COLLEGE','UNIVERSITY','OTHER') then
    raise exception 'invalid_education_type';
  end if;

  if length(education_place) < 2 then
    raise exception 'education_place_required';
  end if;

  insert into public.profiles(
    id,
    role,
    status,
    phone,
    email,
    full_name,
    age,
    education_type,
    education_place
  )
  values(
    new.id,
    'STUDENT',
    'WAITING_FOR_TEAM',
    normalized_phone,
    lower(trim(new.email)),
    full_name,
    parsed_age,
    education::public.education_type,
    education_place
  );

  return new;
end;
$$;
