-- In-app notifications/reminders are no longer part of Shyraq.
-- Leave legacy message/support tables intact for historical retention and rollback;
-- their UI and application APIs have been removed from this release.
alter table if exists public.student_settings
  drop column if exists notifications_enabled,
  drop column if exists reminders;
