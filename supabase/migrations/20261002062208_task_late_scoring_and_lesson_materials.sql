-- 0026 — task late scoring, submission links and lesson materials

alter table public.tasks
  add column if not exists late_points_percent smallint not null default 100;

alter table public.tasks
  drop constraint if exists tasks_late_points_percent_check;

alter table public.tasks
  add constraint tasks_late_points_percent_check
    check (late_points_percent between 0 and 100);

alter table public.task_submissions
  add column if not exists link_url text;

alter table public.lessons
  add column if not exists materials jsonb not null default '[]'::jsonb;

create index if not exists tasks_late_points_percent_idx
  on public.tasks(late_points_percent);

create index if not exists task_submissions_link_url_idx
  on public.task_submissions(id)
  where link_url is not null;

alter table public.lessons
  drop constraint if exists lessons_materials_array_check;

alter table public.lessons
  add constraint lessons_materials_array_check
    check (jsonb_typeof(materials) = 'array');
