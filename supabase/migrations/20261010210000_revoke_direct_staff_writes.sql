-- Staff mutations must pass through authenticated, validated server routes.
-- The corresponding API handlers use the service role after checking actor role,
-- active status, request schema, rate limits and audit logging.
REVOKE INSERT, UPDATE, DELETE ON TABLE
  public.audit_logs,
  public.lessons,
  public.profiles,
  public.tasks,
  public.team_members,
  public.teams
FROM authenticated;

-- Remove permissive staff write policies as a second line of defense if table
-- grants are accidentally broadened again in a later migration.
DROP POLICY IF EXISTS lessons_staff_delete ON public.lessons;
DROP POLICY IF EXISTS lessons_staff_insert ON public.lessons;
DROP POLICY IF EXISTS lessons_staff_update ON public.lessons;

DROP POLICY IF EXISTS tasks_staff_delete ON public.tasks;
DROP POLICY IF EXISTS tasks_staff_insert ON public.tasks;
DROP POLICY IF EXISTS tasks_staff_update ON public.tasks;

DROP POLICY IF EXISTS team_members_staff_insert ON public.team_members;
DROP POLICY IF EXISTS team_members_staff_update ON public.team_members;

DROP POLICY IF EXISTS teams_staff_insert ON public.teams;
DROP POLICY IF EXISTS teams_staff_update ON public.teams;
