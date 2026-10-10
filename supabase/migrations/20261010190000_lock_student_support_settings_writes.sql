-- Student support tickets and settings are written through validated,
-- rate-limited server routes. Direct authenticated DML could bypass the support
-- ticket rate limit and forge status/staff fields, or bypass settings validation.
REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.support_tickets, public.student_settings
  FROM PUBLIC, anon, authenticated;

GRANT INSERT, UPDATE, DELETE
  ON TABLE public.support_tickets, public.student_settings
  TO service_role;

-- Keep SELECT policies. API handlers remain the only write path.
DROP POLICY IF EXISTS support_tickets_student_insert ON public.support_tickets;
DROP POLICY IF EXISTS support_tickets_staff_update ON public.support_tickets;

DROP POLICY IF EXISTS student_settings_insert_own ON public.student_settings;
DROP POLICY IF EXISTS student_settings_update_own ON public.student_settings;
