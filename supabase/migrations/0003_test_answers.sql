create table public.test_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.test_attempts(id) on delete cascade,
  question_id uuid not null references public.test_questions(id) on delete cascade,
  selected_option_id uuid references public.test_options(id) on delete set null,
  text_answer text,
  created_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

alter table public.test_answers enable row level security;

create policy test_answers_select on public.test_answers
for select using (
  public.is_admin()
  or exists(select 1 from public.test_attempts a where a.id=test_answers.attempt_id and a.student_id=auth.uid())
);

create policy test_answers_insert on public.test_answers
for insert with check (
  exists(select 1 from public.test_attempts a where a.id=test_answers.attempt_id and a.student_id=auth.uid())
);

create index test_answers_attempt_idx on public.test_answers(attempt_id);
