-- Students may read their own progress, but cannot forge playback coverage or
-- set test_unlocked directly through the Supabase REST API. Progress writes must
-- go through the authenticated server route, which validates elapsed playback.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.video_progress FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS video_progress_insert ON public.video_progress;
DROP POLICY IF EXISTS video_progress_update ON public.video_progress;

-- Keep read access limited to the student's own row and authorized staff.
DROP POLICY IF EXISTS video_progress_select ON public.video_progress;
CREATE POLICY video_progress_select
  ON public.video_progress
  FOR SELECT
  TO authenticated
  USING (
    student_id = (SELECT auth.uid())
    OR (SELECT is_chief_mentor_or_above())
  );
