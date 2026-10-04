alter table public.lessons add column if not exists deadline_at timestamptz;
create index if not exists lessons_deadline_at_idx on public.lessons(deadline_at);
