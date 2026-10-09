-- Preserve submitted assessment history when staff modify or remove test questions.
-- The application now blocks question-set edits after attempts exist; this FK is
-- the database-level guard against accidental/privileged cascade deletion.
ALTER TABLE public.test_answers
  DROP CONSTRAINT IF EXISTS test_answers_question_id_fkey;

ALTER TABLE public.test_answers
  ADD CONSTRAINT test_answers_question_id_fkey
  FOREIGN KEY (question_id)
  REFERENCES public.test_questions(id)
  ON DELETE RESTRICT;
