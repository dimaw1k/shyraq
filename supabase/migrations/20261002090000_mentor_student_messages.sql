create table if not exists public.mentor_student_messages (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  constraint mentor_student_messages_pair_check check (mentor_id <> student_id)
);

create index if not exists idx_mentor_student_messages_pair_created
  on public.mentor_student_messages (mentor_id, student_id, created_at);

create index if not exists idx_mentor_student_messages_student_created
  on public.mentor_student_messages (student_id, created_at);

alter table public.mentor_student_messages enable row level security;

revoke all on table public.mentor_student_messages from anon, authenticated;
grant all on table public.mentor_student_messages to service_role;
