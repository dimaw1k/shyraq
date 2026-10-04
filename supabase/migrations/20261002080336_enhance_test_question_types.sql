alter table public.test_questions
  add column if not exists question_type text not null default 'SINGLE',
  add column if not exists attachments jsonb not null default '[]'::jsonb;

alter table public.test_questions
  drop constraint if exists test_questions_question_type_check;

alter table public.test_questions
  add constraint test_questions_question_type_check
  check (question_type in ('SINGLE','MULTIPLE','TEXT'));

alter table public.test_questions
  drop constraint if exists test_questions_attachments_array_check;

alter table public.test_questions
  add constraint test_questions_attachments_array_check
  check (jsonb_typeof(attachments) = 'array');

alter table public.test_answers
  add column if not exists selected_option_ids jsonb;

alter table public.test_answers
  drop constraint if exists test_answers_selected_option_ids_array_check;

alter table public.test_answers
  add constraint test_answers_selected_option_ids_array_check
  check (selected_option_ids is null or jsonb_typeof(selected_option_ids) = 'array');

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values (
  'test-question-files',
  'test-question-files',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
