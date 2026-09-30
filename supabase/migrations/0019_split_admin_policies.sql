-- 0019 — split admin ALL policies to remove permissive SELECT overlap

drop policy if exists attendance_admin_all on public.attendance_records;
drop policy if exists attendance_admin_insert on public.attendance_records;
drop policy if exists attendance_admin_update on public.attendance_records;
drop policy if exists attendance_admin_delete on public.attendance_records;

create policy attendance_admin_insert
on public.attendance_records for insert to public
with check ((select public.is_admin()));

create policy attendance_admin_update
on public.attendance_records for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy attendance_admin_delete
on public.attendance_records for delete to public
using ((select public.is_admin()));

drop policy if exists google_connections_admin_all on public.google_connections;
drop policy if exists google_connections_admin_insert on public.google_connections;
drop policy if exists google_connections_admin_update on public.google_connections;
drop policy if exists google_connections_admin_delete on public.google_connections;

create policy google_connections_admin_insert
on public.google_connections for insert to public
with check ((select public.is_admin()));

create policy google_connections_admin_update
on public.google_connections for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy google_connections_admin_delete
on public.google_connections for delete to public
using ((select public.is_admin()));

drop policy if exists lesson_tests_admin_all on public.lesson_tests;
drop policy if exists lesson_tests_admin_insert on public.lesson_tests;
drop policy if exists lesson_tests_admin_update on public.lesson_tests;
drop policy if exists lesson_tests_admin_delete on public.lesson_tests;

create policy lesson_tests_admin_insert
on public.lesson_tests for insert to public
with check ((select public.is_admin()));

create policy lesson_tests_admin_update
on public.lesson_tests for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy lesson_tests_admin_delete
on public.lesson_tests for delete to public
using ((select public.is_admin()));

drop policy if exists lessons_admin_all on public.lessons;
drop policy if exists lessons_admin_insert on public.lessons;
drop policy if exists lessons_admin_update on public.lessons;
drop policy if exists lessons_admin_delete on public.lessons;

create policy lessons_admin_insert
on public.lessons for insert to public
with check ((select public.is_admin()));

create policy lessons_admin_update
on public.lessons for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy lessons_admin_delete
on public.lessons for delete to public
using ((select public.is_admin()));

drop policy if exists marathon_settings_admin_all on public.marathon_settings;
drop policy if exists marathon_settings_admin_insert on public.marathon_settings;
drop policy if exists marathon_settings_admin_update on public.marathon_settings;
drop policy if exists marathon_settings_admin_delete on public.marathon_settings;

create policy marathon_settings_admin_insert
on public.marathon_settings for insert to public
with check ((select public.is_admin()));

create policy marathon_settings_admin_update
on public.marathon_settings for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy marathon_settings_admin_delete
on public.marathon_settings for delete to public
using ((select public.is_admin()));

drop policy if exists meet_conferences_admin_all on public.meet_conferences;
drop policy if exists meet_conferences_admin_insert on public.meet_conferences;
drop policy if exists meet_conferences_admin_update on public.meet_conferences;
drop policy if exists meet_conferences_admin_delete on public.meet_conferences;

create policy meet_conferences_admin_insert
on public.meet_conferences for insert to public
with check ((select public.is_admin()));

create policy meet_conferences_admin_update
on public.meet_conferences for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy meet_conferences_admin_delete
on public.meet_conferences for delete to public
using ((select public.is_admin()));

drop policy if exists meet_participant_mappings_admin_all on public.meet_participant_mappings;
drop policy if exists meet_participant_mappings_admin_insert on public.meet_participant_mappings;
drop policy if exists meet_participant_mappings_admin_update on public.meet_participant_mappings;
drop policy if exists meet_participant_mappings_admin_delete on public.meet_participant_mappings;

create policy meet_participant_mappings_admin_insert
on public.meet_participant_mappings for insert to public
with check ((select public.is_admin()));

create policy meet_participant_mappings_admin_update
on public.meet_participant_mappings for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy meet_participant_mappings_admin_delete
on public.meet_participant_mappings for delete to public
using ((select public.is_admin()));

drop policy if exists meet_participant_sessions_admin_all on public.meet_participant_sessions;
drop policy if exists meet_participant_sessions_admin_insert on public.meet_participant_sessions;
drop policy if exists meet_participant_sessions_admin_update on public.meet_participant_sessions;
drop policy if exists meet_participant_sessions_admin_delete on public.meet_participant_sessions;

create policy meet_participant_sessions_admin_insert
on public.meet_participant_sessions for insert to public
with check ((select public.is_admin()));

create policy meet_participant_sessions_admin_update
on public.meet_participant_sessions for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy meet_participant_sessions_admin_delete
on public.meet_participant_sessions for delete to public
using ((select public.is_admin()));

drop policy if exists meet_participants_admin_all on public.meet_participants;
drop policy if exists meet_participants_admin_insert on public.meet_participants;
drop policy if exists meet_participants_admin_update on public.meet_participants;
drop policy if exists meet_participants_admin_delete on public.meet_participants;

create policy meet_participants_admin_insert
on public.meet_participants for insert to public
with check ((select public.is_admin()));

create policy meet_participants_admin_update
on public.meet_participants for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy meet_participants_admin_delete
on public.meet_participants for delete to public
using ((select public.is_admin()));

drop policy if exists meet_spaces_admin_all on public.meet_spaces;
drop policy if exists meet_spaces_admin_insert on public.meet_spaces;
drop policy if exists meet_spaces_admin_update on public.meet_spaces;
drop policy if exists meet_spaces_admin_delete on public.meet_spaces;

create policy meet_spaces_admin_insert
on public.meet_spaces for insert to public
with check ((select public.is_admin()));

create policy meet_spaces_admin_update
on public.meet_spaces for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy meet_spaces_admin_delete
on public.meet_spaces for delete to public
using ((select public.is_admin()));

drop policy if exists score_rules_admin_all on public.score_rules;
drop policy if exists score_rules_admin_insert on public.score_rules;
drop policy if exists score_rules_admin_update on public.score_rules;
drop policy if exists score_rules_admin_delete on public.score_rules;

create policy score_rules_admin_insert
on public.score_rules for insert to public
with check ((select public.is_admin()));

create policy score_rules_admin_update
on public.score_rules for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy score_rules_admin_delete
on public.score_rules for delete to public
using ((select public.is_admin()));

drop policy if exists tasks_admin_all on public.tasks;
drop policy if exists tasks_admin_insert on public.tasks;
drop policy if exists tasks_admin_update on public.tasks;
drop policy if exists tasks_admin_delete on public.tasks;

create policy tasks_admin_insert
on public.tasks for insert to public
with check ((select public.is_admin()));

create policy tasks_admin_update
on public.tasks for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy tasks_admin_delete
on public.tasks for delete to public
using ((select public.is_admin()));

drop policy if exists test_options_admin_write on public.test_options;
drop policy if exists test_options_admin_insert on public.test_options;
drop policy if exists test_options_admin_update on public.test_options;
drop policy if exists test_options_admin_delete on public.test_options;

create policy test_options_admin_insert
on public.test_options for insert to public
with check ((select public.is_admin()));

create policy test_options_admin_update
on public.test_options for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy test_options_admin_delete
on public.test_options for delete to public
using ((select public.is_admin()));

drop policy if exists test_questions_admin_write on public.test_questions;
drop policy if exists test_questions_admin_insert on public.test_questions;
drop policy if exists test_questions_admin_update on public.test_questions;
drop policy if exists test_questions_admin_delete on public.test_questions;

create policy test_questions_admin_insert
on public.test_questions for insert to public
with check ((select public.is_admin()));

create policy test_questions_admin_update
on public.test_questions for update to public
using ((select public.is_admin()))
with check ((select public.is_admin()));

create policy test_questions_admin_delete
on public.test_questions for delete to public
using ((select public.is_admin()));

