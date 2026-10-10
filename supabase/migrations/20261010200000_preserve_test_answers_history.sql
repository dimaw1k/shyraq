-- Assessment answers are historical records. Do not let deleting a question
-- cascade-delete responses submitted by students. The application already
-- guards normal test edits; this constraint also protects against privileged
-- database paths and future regressions.
ALTER TABLE public.test_answers
  DROP CONSTRAINT IF EXISTS test_answers_question_id_fkey;

ALTER TABLE public.test_answers
  ADD CONSTRAINT test_answers_question_id_fkey
  FOREIGN KEY (question_id)
  REFERENCES public.test_questions(id)
  ON DELETE RESTRICT;
