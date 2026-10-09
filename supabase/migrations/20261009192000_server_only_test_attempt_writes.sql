-- Test attempts and answers must be created by the server-side atomic RPC.
-- Direct client inserts would let a student forge scores or consume attempts
-- without going through the video gate and grading logic.
REVOKE INSERT, UPDATE, DELETE ON TABLE public.test_attempts FROM PUBLIC, anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.test_answers FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS test_attempts_insert ON public.test_attempts;
DROP POLICY IF EXISTS test_attempts_update ON public.test_attempts;
DROP POLICY IF EXISTS test_answers_insert ON public.test_answers;
DROP POLICY IF EXISTS test_answers_update ON public.test_answers;
DROP POLICY IF EXISTS test_answers_delete ON public.test_answers;

-- Preserve SELECT policies: students can read only results permitted by the
-- result-visibility policy, and authorized staff retain their existing access.
