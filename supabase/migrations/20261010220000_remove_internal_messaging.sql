-- Shyraq no longer supports internal direct messages or chat.
-- Drop the now-unused message stores so stale APIs cannot be re-enabled accidentally.
drop table if exists public.staff_messages;
drop table if exists public.mentor_student_messages;

-- Support intake remains available, but staff replies/notes are no longer sent to students.
alter table if exists public.support_tickets
  drop column if exists staff_note;

-- Remove the unused student notification toggle and reminder schedule.
alter table if exists public.student_settings
  drop column if exists notifications_enabled,
  drop column if exists reminders;
