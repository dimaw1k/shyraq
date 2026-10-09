-- Students may read their own progress, but cannot forge playback coverage or
-- set test_unlocked directly through the Supabase REST API. Progress writes must
-- go through the authenticated server route, which validates elapsed playback.
REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.video_progress
  FROM PUBLIC, anon, authenticated;

-- These legacy policies are no longer useful once client write privileges are
-- revoked. Drop the exact policy names present in the production schema too.
DROP POLICY IF EXISTS video_progress_insert ON public.video_progress;
DROP POLICY IF EXISTS video_progress_update ON public.video_progress;
DROP POLICY IF EXISTS video_progress_staff_insert ON public.video_progress;
DROP POLICY IF EXISTS video_progress_staff_update ON public.video_progress;

-- Preserve the existing read contract: students see their own progress, senior
-- staff can administer the cohort, and mentors can read active members of their
-- own active teams. Removing client write privileges must not remove mentoring
-- visibility.
DROP POLICY IF EXISTS video_progress_select ON public.video_progress;
CREATE POLICY video_progress_select
  ON public.video_progress
  FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT auth.uid())
    OR (SELECT is_chief_mentor_or_above())
    OR EXISTS (
      SELECT 1
      FROM public.team_members AS tm
      JOIN public.teams AS t
        ON t.id = tm.team_id
      WHERE tm.student_id = video_progress.student_id
        AND tm.status = 'ACTIVE'
        AND t.status = 'ACTIVE'
        AND (SELECT is_team_mentor(t.id))
    )
  );
