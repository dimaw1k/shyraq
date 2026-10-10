-- Record which authenticated Google account owns each configured Meet space.
-- NULL is retained for legacy rows that need a one-time access-based resolution.
alter table public.meet_spaces
  add column if not exists google_user_id uuid
  references public.profiles(id) on delete set null;

-- For authenticated direct API writes (not service-role API writes), default the
-- owner to the caller. Server routes that use the service role set it explicitly.
alter table public.meet_spaces
  alter column google_user_id set default auth.uid();

create index if not exists meet_spaces_google_user_id_idx
  on public.meet_spaces(google_user_id);

-- Backfill only where the audit trail recorded an explicit creator/upserter.
-- Do not guess the owner for legacy rows without an audit event; the sync code
-- resolves those once it can verify which connected account has access.
update public.meet_spaces as ms
set google_user_id = coalesce(
  (
    select al.actor_id
    from public.audit_logs as al
    where al.entity_type = 'MEET_SPACE'
      and al.entity_id = ms.id
      and al.action = 'GOOGLE_MEET_SPACE_CREATED'
      and al.actor_id is not null
    order by al.created_at asc
    limit 1
  ),
  (
    select al.actor_id
    from public.audit_logs as al
    where al.entity_type = 'MEET_SPACE'
      and al.entity_id = ms.id
      and al.action = 'MEET_SPACE_UPSERTED'
      and al.actor_id is not null
    order by al.created_at asc
    limit 1
  )
)
where ms.google_user_id is null
  and (
    exists (
      select 1 from public.audit_logs as al
      where al.entity_type = 'MEET_SPACE'
        and al.entity_id = ms.id
        and al.action = 'GOOGLE_MEET_SPACE_CREATED'
        and al.actor_id is not null
    )
    or exists (
      select 1 from public.audit_logs as al
      where al.entity_type = 'MEET_SPACE'
        and al.entity_id = ms.id
        and al.action = 'MEET_SPACE_UPSERTED'
        and al.actor_id is not null
    )
  );

create or replace function public.assign_meet_space_google_owner()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $function$
begin
  if auth.uid() is not null and new.google_user_id is null then
    new.google_user_id := auth.uid();
  end if;
  return new;
end;
$function$;

drop trigger if exists meet_spaces_assign_google_owner on public.meet_spaces;
create trigger meet_spaces_assign_google_owner
before insert or update on public.meet_spaces
for each row execute function public.assign_meet_space_google_owner();

revoke all on function public.assign_meet_space_google_owner()
  from public, anon, authenticated;

-- A mentor or leader may set the owner only to their own Google OAuth connection.
-- The trigger fills omitted values with auth.uid() for older authenticated clients.
drop policy if exists meet_spaces_mentor_insert on public.meet_spaces;
create policy meet_spaces_mentor_insert
  on public.meet_spaces
  for insert to authenticated
  with check (
    public.is_team_mentor(team_id)
    and google_user_id = (select auth.uid())
  );

drop policy if exists meet_spaces_mentor_update on public.meet_spaces;
create policy meet_spaces_mentor_update
  on public.meet_spaces
  for update to authenticated
  using (public.is_team_mentor(team_id))
  with check (
    public.is_team_mentor(team_id)
    and google_user_id = (select auth.uid())
  );

drop policy if exists meet_spaces_staff_insert on public.meet_spaces;
create policy meet_spaces_staff_insert
  on public.meet_spaces
  for insert to authenticated
  with check (
    public.is_leader()
    and google_user_id = (select auth.uid())
  );

drop policy if exists meet_spaces_staff_update on public.meet_spaces;
create policy meet_spaces_staff_update
  on public.meet_spaces
  for update to authenticated
  using (public.is_leader())
  with check (
    public.is_leader()
    and google_user_id = (select auth.uid())
  );
