-- Prevent disabling the lesson video gate by writing a zero watch threshold.
-- The lesson API validates this value too, but the constraint also protects direct
-- Supabase writes permitted to authorized staff by RLS.
UPDATE public.lessons
SET required_watch_percent = CASE
  WHEN required_watch_percent IS NULL THEN 85
  WHEN required_watch_percent < 1 THEN 1
  WHEN required_watch_percent > 100 THEN 100
  ELSE required_watch_percent
END
WHERE required_watch_percent IS NULL
   OR required_watch_percent < 1
   OR required_watch_percent > 100;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_required_watch_percent_min_one_check
  CHECK (required_watch_percent >= 1 AND required_watch_percent <= 100);
