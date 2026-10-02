alter table public.lessons
  add column if not exists team_id uuid references public.teams(id) on delete set null;

create index if not exists lessons_team_id_idx
  on public.lessons(team_id, marathon_day, lesson_order, starts_at);
