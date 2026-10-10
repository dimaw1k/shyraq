-- A shared Google Meet room can be assigned to multiple teams.
-- Keep one row per team/study time, but do not require a unique Google space ID.
alter table public.meet_spaces
  drop constraint if exists meet_spaces_external_space_id_key;
