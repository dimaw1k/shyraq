-- Study Time: split daily reports by morning/evening and add report photo slots.

alter table public.daily_reports
  add column if not exists report_type text not null default 'EVENING';

alter table public.daily_reports
  drop constraint if exists daily_reports_report_type_check;

alter table public.daily_reports
  add constraint daily_reports_report_type_check
    check (report_type in ('MORNING','EVENING'));

alter table public.daily_report_questions
  add column if not exists report_type text not null default 'EVENING';

alter table public.daily_report_questions
  drop constraint if exists daily_report_questions_report_type_check;

alter table public.daily_report_questions
  add constraint daily_report_questions_report_type_check
    check (report_type in ('MORNING','EVENING'));

alter table public.report_files
  add column if not exists slot text;

alter table public.report_files
  drop constraint if exists report_files_slot_check;

alter table public.report_files
  add constraint report_files_slot_check
    check (
      slot is null
      or slot in ('MORNING_MEET','PLAN','SCREEN_TIME','PROCESS')
    );

create unique index if not exists daily_reports_student_date_type_uidx
  on public.daily_reports(student_id, report_date, report_type);

create index if not exists daily_report_questions_type_day_idx
  on public.daily_report_questions(report_type, marathon_day, sort_order);

create index if not exists report_files_report_slot_idx
  on public.report_files(report_id, slot);

insert into public.daily_report_questions
  (marathon_day, report_type, question, field_key, field_type, required, sort_order, active)
select null, 'MORNING', x.question, x.field_key, 'LONG_TEXT', true, x.sort_order, true
from (values
  ('Бүгінгі басты мақсатың қандай?', 'morning_goal', 1),
  ('Бүгін қандай қателігіңді қайталамағың келеді?', 'morning_mistake_to_avoid', 2),
  ('Бүгінгі фокусың қандай?', 'morning_focus', 3),
  ('Бүгін өзіңнен қандай нәтиже күтесің?', 'morning_expected_result', 4)
) as x(question, field_key, sort_order)
where not exists (
  select 1 from public.daily_report_questions q
  where q.report_type='MORNING'
    and q.field_key=x.field_key
    and q.marathon_day is null
);

grant select, insert, update on public.daily_reports to authenticated;
grant select on public.daily_report_questions to authenticated;
grant select, insert on public.report_files to authenticated;
grant all on public.daily_reports, public.daily_report_questions, public.report_files to service_role;
