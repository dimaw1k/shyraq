-- 0025 — harden staff messaging RLS and index new foreign keys

-- Staff messages are written through server-only routes. Explicitly deny
-- direct PostgREST access to anonymous and authenticated clients.
drop policy if exists staff_messages_deny_anon on public.staff_messages;
create policy staff_messages_deny_anon
  on public.staff_messages
  as restrictive
  for all
  to anon
  using (false)
  with check (false);

drop policy if exists staff_messages_deny_authenticated on public.staff_messages;
create policy staff_messages_deny_authenticated
  on public.staff_messages
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);

create index if not exists mentor_student_messages_sender_idx
  on public.mentor_student_messages(sender_id);

create index if not exists mentor_task_requests_created_task_id_idx
  on public.mentor_task_requests(created_task_id);

create index if not exists mentor_task_requests_reviewed_by_idx
  on public.mentor_task_requests(reviewed_by);
