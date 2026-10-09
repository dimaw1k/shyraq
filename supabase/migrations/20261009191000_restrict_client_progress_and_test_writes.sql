-- Progress and test-result integrity depends on server validation and atomic RPCs.
-- The app reads these rows through authenticated Supabase clients but all writes flow
-- through server routes using the service role. Remove client-side write privileges
-- so a student cannot directly set test_unlocked=true or insert an arbitrary score.

REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.video_progress
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS video_progress_insert ON public.video_progress;
DROP POLICY IF EXISTS video_progress_update ON public.video_progress;

-- A student-owned test_attempts INSERT policy lets a client forge score, attempt
-- number and submitted_at. Attempts must be created only through the server-validated
-- create_test_attempt_with_answers RPC.
REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.test_attempts
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS test_attempts_insert ON public.test_attempts;

-- Answers are written transactionally together with the attempt via the same
-- server-only RPC; preserve SELECT policy so authorized result views keep working.
REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.test_answers
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS test_answers_insert ON public.test_answers;
