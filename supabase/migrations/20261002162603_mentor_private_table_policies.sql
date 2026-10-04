create policy "mentor_student_messages_deny_anon"
  on public.mentor_student_messages
  as restrictive
  for all
  to anon
  using (false)
  with check (false);

create policy "mentor_student_messages_deny_authenticated"
  on public.mentor_student_messages
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);

create policy "mentor_task_requests_deny_anon"
  on public.mentor_task_requests
  as restrictive
  for all
  to anon
  using (false)
  with check (false);

create policy "mentor_task_requests_deny_authenticated"
  on public.mentor_task_requests
  as restrictive
  for all
  to authenticated
  using (false)
  with check (false);
