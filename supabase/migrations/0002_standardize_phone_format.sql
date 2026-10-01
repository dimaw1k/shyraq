create or replace function public.format_kz_phone(input text)
returns text
immutable
language plpgsql
as $$
declare
  digits text := regexp_replace(coalesce(input, ''), '[^0-9]', '', 'g');
  subscriber text;
begin
  if digits like '8%' and length(digits) = 11 then
    subscriber := substr(digits, 2, 10);
  elsif digits like '7%' and length(digits) = 11 then
    subscriber := substr(digits, 2, 10);
  elsif length(digits) = 10 then
    subscriber := digits;
  else
    return trim(coalesce(input, ''));
  end if;

  return '+7 (' ||
    substr(subscriber, 1, 3) || ') ' ||
    substr(subscriber, 4, 3) || ' ' ||
    substr(subscriber, 7, 2) || ' ' ||
    substr(subscriber, 9, 2);
end;
$$;

update public.profiles
set phone = public.format_kz_phone(phone)
where phone is not null
  and phone <> '';

create or replace function public.handle_new_user()
returns trigger
security definer
set search_path = public
language plpgsql
as $$
declare m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles(id,role,status,phone,email,full_name,age,education_type,education_place)
  values(
    new.id,
    'STUDENT',
    'WAITING_FOR_TEAM',
    public.format_kz_phone(coalesce(m->>'phone','')),
    lower(coalesce(new.email,'')),
    coalesce(m->>'full_name',''),
    greatest(10,least(100,coalesce((m->>'age')::int,18))),
    coalesce((m->>'education_type')::public.education_type,'OTHER'),
    ''
  );
  return new;
end;
$$;

create or replace function public.mentor_find_student_by_phone(target_phone text)
returns table(id uuid, full_name text, email text, phone text, age int, education_type public.education_type, education_place text, status public.profile_status, assigned_team_id uuid)
security definer set search_path=public stable language plpgsql
as $$
declare formatted_phone text := public.format_kz_phone(target_phone);
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='MENTOR') then
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
    (select tm.team_id
     from public.team_members tm
     where tm.student_id=p.id and tm.status='ACTIVE'
     limit 1)
  from public.profiles p
  where p.phone = formatted_phone
  limit 1;
end;
$$;
