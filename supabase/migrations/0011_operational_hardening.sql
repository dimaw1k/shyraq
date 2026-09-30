-- 0011 operational data-integrity hardening
-- Enforce one active team per mentor and one correct option per single-choice question.

create unique index if not exists one_active_team_per_mentor
on public.teams(mentor_id)
where mentor_id is not null and status = 'ACTIVE';

create unique index if not exists one_correct_option_per_question
on public.test_options(question_id)
where is_correct = true;

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare
  metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  normalized_phone text := public.normalize_kz_phone(coalesce(metadata->>'phone', ''));
  raw_age text := trim(coalesce(metadata->>'age', ''));
  parsed_age int;
  education text := upper(trim(coalesce(metadata->>'education_type', 'OTHER')));
  full_name text := trim(coalesce(metadata->>'full_name', ''));
  education_place text := trim(coalesce(metadata->>'education_place', ''));
begin
  if new.email is null or trim(new.email) = '' then
    raise exception 'email_required';
  end if;

  if normalized_phone !~ '^\\+7[0-9]{10}$' then
    raise exception 'invalid_kz_phone';
  end if;

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
