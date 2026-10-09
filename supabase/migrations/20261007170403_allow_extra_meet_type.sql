alter table public.meet_spaces
  drop constraint if exists meet_spaces_study_time_check;

alter table public.meet_spaces
  add constraint meet_spaces_study_time_check
  check (study_time in ('MORNING','EVENING','EXTRA'));
