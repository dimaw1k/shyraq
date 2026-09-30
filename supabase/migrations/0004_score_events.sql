alter table public.score_events
  alter column source_id set not null;

alter table public.score_events
  add constraint score_events_source_unique unique(student_id, source_code, source_id);

create or replace function public.record_score_event(
  target_student uuid,
  target_team uuid,
  target_source_code text,
  target_source_id uuid,
  target_points numeric,
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
security definer
set search_path=public
language plpgsql
as $$
declare new_id uuid;
begin
  insert into public.score_events(student_id,team_id,source_code,source_id,points,metadata)
  values(target_student,target_team,target_source_code,target_source_id,target_points,target_metadata)
  on conflict(student_id,source_code,source_id) do nothing
  returning id into new_id;
  return new_id;
end;
$$;
