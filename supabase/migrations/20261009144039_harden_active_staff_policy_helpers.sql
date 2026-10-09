create or replace function private.is_chief_mentor_or_above()
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'ACTIVE'
      and role in ('CHIEF_MENTOR', 'LEADER')
  );
$function$;

create or replace function private.is_leader()
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'ACTIVE'
      and role = 'LEADER'
  );
$function$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'ACTIVE'
      and role in ('MENTOR', 'CHIEF_MENTOR', 'LEADER')
  );
$function$;

create or replace function private.is_team_mentor(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
  select exists (
    select 1
    from public.profiles as p
    join public.teams as t on t.mentor_id = p.id
    where p.id = auth.uid()
      and p.role = 'MENTOR'
      and p.status = 'ACTIVE'
      and t.id = target_team_id
      and t.status = 'ACTIVE'
  );
$function$;