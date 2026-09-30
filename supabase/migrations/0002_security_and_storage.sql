create or replace function public.normalize_kz_phone(input_phone text)
returns text
immutable
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

drop trigger if exists profiles_normalize_before_write on public.profiles;
create trigger profiles_normalize_before_write
before insert or update on public.profiles
for each row execute function public.normalize_profile_before_write();

create or replace function public.mentor_find_student_by_phone(target_phone text)
returns table(
  id uuid,
  full_name text,
  email text,
  phone text,
  age int,
  education_type public.education_type,
  education_place text,
  status public.profile_status,
  assigned_team_id uuid
)
security definer set search_path=public stable language plpgsql
as $$
declare normalized text := public.normalize_kz_phone(target_phone);
begin
  if not exists(select 1 from public.profiles where id=auth.uid() and role='MENTOR') then
    raise exception 'mentor_only';
  end if;
  return query
  select p.id,p.full_name,p.email,p.phone,p.age,p.education_type,p.education_place,p.status,
         (select tm.team_id from public.team_members tm where tm.student_id=p.id and tm.status='ACTIVE' limit 1)
  from public.profiles p
  where p.phone=normalized
  limit 1;
end;
$$;

insert into storage.buckets(id,name,public)
values ('submissions','submissions',false)
on conflict(id) do nothing;

create policy submission_storage_insert
on storage.objects for insert to authenticated
with check (
  bucket_id='submissions'
  and (storage.foldername(name))[1]=auth.uid()::text
);

create policy submission_storage_select
on storage.objects for select to authenticated
using (
  bucket_id='submissions'
  and (
    (storage.foldername(name))[1]=auth.uid()::text
    or public.is_admin()
    or exists(
      select 1
      from public.task_submissions s
      join public.tasks t on t.id=s.task_id
      join public.team_members tm on tm.student_id=s.student_id and tm.status='ACTIVE'
      join public.teams team on team.id=tm.team_id
      where t.id::text=(storage.foldername(name))[2]
        and team.mentor_id=auth.uid()
    )
  )
);

create policy submission_storage_delete
on storage.objects for delete to authenticated
using (
  bucket_id='submissions'
  and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin())
);

create policy submission_files_student_select
on public.submission_files for select
using (
  public.is_admin()
  or exists(select 1 from public.task_submissions s where s.id=submission_files.submission_id and s.student_id=auth.uid())
  or exists(
    select 1 from public.task_submissions s
    join public.tasks t on t.id=s.task_id
    where s.id=submission_files.submission_id
      and t.team_id is not null
      and public.is_team_mentor(t.team_id)
  )
);

create policy submission_files_student_insert
on public.submission_files for insert
with check (
  exists(select 1 from public.task_submissions s where s.id=submission_files.submission_id and s.student_id=auth.uid())
);

create policy report_files_student_select
on public.report_files for select
using (
  public.is_admin()
  or exists(select 1 from public.daily_reports r where r.id=report_files.report_id and r.student_id=auth.uid())
  or exists(
    select 1
    from public.daily_reports r
    join public.team_members tm on tm.student_id=r.student_id and tm.status='ACTIVE'
    join public.teams t on t.id=tm.team_id
    where r.id=report_files.report_id and t.mentor_id=auth.uid()
  )
);

create policy report_files_student_insert
on public.report_files for insert
with check (
  exists(select 1 from public.daily_reports r where r.id=report_files.report_id and r.student_id=auth.uid())
);

create index daily_reports_student_date_idx on public.daily_reports(student_id, report_date desc);
create index attendance_student_date_idx on public.attendance_records(student_id, imported_at desc);
create index video_progress_lesson_student_idx on public.video_progress(lesson_id, student_id);
create index task_submissions_task_status_idx on public.task_submissions(task_id, status);
