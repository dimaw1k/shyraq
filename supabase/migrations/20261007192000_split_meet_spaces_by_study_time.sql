alter table public.meet_spaces
  add column if not exists study_time text not null default 'MORNING'
    check (study_time in ('MORNING','EVENING'));

alter table public.meet_spaces
  drop constraint if exists meet_spaces_team_id_key;

create unique index if not exists meet_spaces_team_study_time_uidx
  on public.meet_spaces(team_id, study_time);
