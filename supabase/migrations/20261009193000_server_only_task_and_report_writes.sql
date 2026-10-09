-- Student-owned UPDATE policies are row-scoped, not column-scoped. Without
-- revoking client writes, a student can directly set review/status fields on their
-- own task submission or daily report through the Supabase REST API.
-- All supported creates/updates/reviews use authenticated server routes and the
-- server-only service role, so clients need SELECT but not direct DML on these tables.

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.task_submissions
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS submissions_insert ON public.task_submissions;
DROP POLICY IF EXISTS submissions_update ON public.task_submissions;

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.daily_reports
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS daily_reports_insert ON public.daily_reports;
DROP POLICY IF EXISTS daily_reports_update ON public.daily_reports;
