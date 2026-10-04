-- Harden student-facing content policies against anonymous access and cross-team reads.

drop policy if exists lessons_select on public.lessons;
create policy lessons_select
on public.lessons
for select
to authenticated
using (
  (select public.is_chief_mentor_or_above())
  or (
    published = true
    and (
      team_id is null
      or (select public.is_team_mentor(lessons.team_id))
      or exists (
        select 1
        from public.team_members tm
        where tm.team_id = lessons.team_id
          and tm.student_id = (select auth.uid())
          and tm.status = 'ACTIVE'
      )
    )
  )
);

drop policy if exists tasks_select on public.tasks;
create policy tasks_select
on public.tasks
for select
to authenticated
using (
  (select public.is_chief_mentor_or_above())
  or (
    team_id is null
    or (select public.is_team_mentor(tasks.team_id))
    or exists (
      select 1
      from public.team_members tm
      where tm.team_id = tasks.team_id
        and tm.student_id = (select auth.uid())
        and tm.status = 'ACTIVE'
    )
  )
);

drop policy if exists lesson_tests_select on public.lesson_tests;
create policy lesson_tests_select
on public.lesson_tests
for select
to authenticated
using (
  (select public.is_chief_mentor_or_above())
  or (
    active = true
    and exists (
      select 1
      from public.lessons l
      where l.id = lesson_tests.lesson_id
        and l.published = true
        and (
          l.team_id is null
          or (select public.is_team_mentor(l.team_id))
          or exists (
            select 1
            from public.team_members tm
            where tm.team_id = l.team_id
              and tm.student_id = (select auth.uid())
              and tm.status = 'ACTIVE'
          )
        )
    )
  )
);
