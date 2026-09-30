drop policy if exists test_questions_select on public.test_questions;
drop policy if exists test_options_select on public.test_options;

create policy test_questions_admin_select
on public.test_questions for select
using (public.is_admin());

create policy test_options_admin_select
on public.test_options for select
using (public.is_admin());

create policy test_questions_admin_write
on public.test_questions for all
using (public.is_admin())
with check (public.is_admin());

create policy test_options_admin_write
on public.test_options for all
using (public.is_admin())
with check (public.is_admin());

create policy google_connections_admin_all
on public.google_connections for all
using (public.is_admin())
with check (public.is_admin());
