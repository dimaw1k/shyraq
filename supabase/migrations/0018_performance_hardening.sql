-- 0018 — database performance hardening
-- Add covering indexes for foreign keys and cache auth/helper checks per statement
-- inside RLS policies.

create index if not exists attendance_records_team_id_idx
  on public.attendance_records(team_id);

create index if not exists audit_logs_actor_id_idx
  on public.audit_logs(actor_id);

create index if not exists daily_reports_reviewed_by_idx
  on public.daily_reports(reviewed_by);

create index if not exists lessons_created_by_idx
  on public.lessons(created_by);

create index if not exists meet_participant_mappings_assigned_by_idx
  on public.meet_participant_mappings(assigned_by);

create index if not exists meet_participant_mappings_student_id_idx
  on public.meet_participant_mappings(student_id);

create index if not exists report_files_report_id_idx
  on public.report_files(report_id);

create index if not exists score_events_team_id_idx
  on public.score_events(team_id);

create index if not exists score_rules_updated_by_idx
  on public.score_rules(updated_by);

create index if not exists submission_files_submission_id_idx
  on public.submission_files(submission_id);

create index if not exists task_submissions_reviewed_by_idx
  on public.task_submissions(reviewed_by);

create index if not exists task_submissions_student_id_idx
  on public.task_submissions(student_id);

create index if not exists tasks_created_by_idx
  on public.tasks(created_by);

create index if not exists team_members_assigned_by_idx
  on public.team_members(assigned_by);

create index if not exists test_answers_question_id_idx
  on public.test_answers(question_id);

create index if not exists test_answers_selected_option_id_idx
  on public.test_answers(selected_option_id);

create index if not exists test_attempts_student_id_idx
  on public.test_attempts(student_id);

create index if not exists test_questions_test_id_idx
  on public.test_questions(test_id);

create index if not exists video_progress_student_id_idx
  on public.video_progress(student_id);

do $$
declare
  p record;
  q text;
  c text;
begin
  for p in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    if p.qual is not null then
      q := p.qual;
      q := regexp_replace(q, 'auth[.]uid[[:space:]]*[(][[:space:]]*[)]', '(select auth.uid())', 'g');
      q := regexp_replace(q, '(^|[^[:alnum:]_])is_admin[[:space:]]*[(][[:space:]]*[)]', '\1(select public.is_admin())', 'g');
      q := regexp_replace(q, '(^|[^[:alnum:]_])is_team_mentor[[:space:]]*[(]([^()]*)[)]', '\1(select public.is_team_mentor(\2))', 'g');

      execute format(
        'alter policy %I on %I.%I using (%s)',
        p.policyname,
        p.schemaname,
        p.tablename,
        q
      );
    end if;

    if p.with_check is not null then
      c := p.with_check;
      c := regexp_replace(c, 'auth[.]uid[[:space:]]*[(][[:space:]]*[)]', '(select auth.uid())', 'g');
      c := regexp_replace(c, '(^|[^[:alnum:]_])is_admin[[:space:]]*[(][[:space:]]*[)]', '\1(select public.is_admin())', 'g');
      c := regexp_replace(c, '(^|[^[:alnum:]_])is_team_mentor[[:space:]]*[(]([^()]*)[)]', '\1(select public.is_team_mentor(\2))', 'g');

      execute format(
        'alter policy %I on %I.%I with check (%s)',
        p.policyname,
        p.schemaname,
        p.tablename,
        c
      );
    end if;
  end loop;
end
$$;
