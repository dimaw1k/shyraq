-- Migration-history reconciliation.
-- The production database already has migration 20261009173500_atomic_test_editor_and_attempt_locking.sql
-- recorded and applied. That later migration contains the final implementations of both
-- create_test_attempt_with_answers and replace_lesson_test_questions.
--
-- This older version was added afterwards and is pending before a newer remote version.
-- Do not replay its older definitions over the later production functions. Keep this
-- version as an intentional no-op so --include-all can reconcile the ledger safely.
DO $$
BEGIN
  NULL;
END
$$;
