-- Assessment answers are historical records. Never allow deleting a question
-- to silently erase submitted student answers through ON DELETE CASCADE.
-- The save_lesson_test_version RPC already rejects edits after attempts exist;
-- this FK is a second, database-enforced line of defense.
alter table public.test_answers
  drop constraint if exists test_answers_question_id_fkey;

alter table public.test_answers
  add constraint test_answers_question_id_fkey
  foreign key (question_id)
  references public.test_questions(id)
  on delete restrict;
