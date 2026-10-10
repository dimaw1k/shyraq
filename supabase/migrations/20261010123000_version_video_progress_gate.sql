-- Bind watch progress to the exact lesson video/gate configuration.
-- Legacy progress has no version provenance, so reset it once during rollout.
ALTER TABLE public.video_progress
  ADD COLUMN IF NOT EXISTS kinescope_video_id_snapshot text,
  ADD COLUMN IF NOT EXISTS duration_seconds_snapshot integer,
  ADD COLUMN IF NOT EXISTS required_watch_percent_snapshot numeric;

DELETE FROM public.video_progress AS progress
WHERE NOT EXISTS (
  SELECT 1
  FROM public.lessons AS lesson
  WHERE lesson.id = progress.lesson_id
);

UPDATE public.video_progress AS progress
SET
  watched_seconds = 0,
  watched_percent = 0,
  maximum_position_seconds = 0,
  watched_ranges = '[]'::jsonb,
  completed = false,
  test_unlocked = false,
  first_started_at = NULL,
  last_watched_at = NULL,
  kinescope_video_id_snapshot = lesson.kinescope_video_id,
  duration_seconds_snapshot = lesson.duration_seconds,
  required_watch_percent_snapshot = lesson.required_watch_percent,
  updated_at = clock_timestamp()
FROM public.lessons AS lesson
WHERE lesson.id = progress.lesson_id;

ALTER TABLE public.video_progress
  ALTER COLUMN kinescope_video_id_snapshot SET NOT NULL,
  ALTER COLUMN duration_seconds_snapshot SET NOT NULL,
  ALTER COLUMN required_watch_percent_snapshot SET NOT NULL;

DO $constraints$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.video_progress'::regclass
      AND conname = 'video_progress_snapshot_duration_positive'
  ) THEN
    ALTER TABLE public.video_progress
      ADD CONSTRAINT video_progress_snapshot_duration_positive
      CHECK (duration_seconds_snapshot > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.video_progress'::regclass
      AND conname = 'video_progress_snapshot_watch_percent_range'
  ) THEN
    ALTER TABLE public.video_progress
      ADD CONSTRAINT video_progress_snapshot_watch_percent_range
      CHECK (required_watch_percent_snapshot >= 1 AND required_watch_percent_snapshot <= 100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.video_progress'::regclass
      AND conname = 'video_progress_snapshot_video_id_nonempty'
  ) THEN
    ALTER TABLE public.video_progress
      ADD CONSTRAINT video_progress_snapshot_video_id_nonempty
      CHECK (length(btrim(kinescope_video_id_snapshot)) > 0);
  END IF;
END;
$constraints$;

-- A replacement video, changed duration, or changed watch threshold invalidates
-- every student's old coverage. Keep the row id so an already-awarded VIDEO
-- score event cannot be awarded again just because the lesson configuration changed.
CREATE OR REPLACE FUNCTION public.reset_video_progress_for_lesson_gate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
BEGIN
  UPDATE public.video_progress AS progress
  SET
    watched_seconds = 0,
    watched_percent = 0,
    maximum_position_seconds = 0,
    watched_ranges = '[]'::jsonb,
    completed = false,
    test_unlocked = false,
    first_started_at = NULL,
    last_watched_at = NULL,
    kinescope_video_id_snapshot = NEW.kinescope_video_id,
    duration_seconds_snapshot = NEW.duration_seconds,
    required_watch_percent_snapshot = NEW.required_watch_percent,
    updated_at = clock_timestamp()
  WHERE progress.lesson_id = NEW.id;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.reset_video_progress_for_lesson_gate()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS lessons_reset_video_progress_on_gate_change ON public.lessons;
CREATE TRIGGER lessons_reset_video_progress_on_gate_change
AFTER UPDATE OF kinescope_video_id, duration_seconds, required_watch_percent
ON public.lessons
FOR EACH ROW
WHEN (
  OLD.kinescope_video_id IS DISTINCT FROM NEW.kinescope_video_id
  OR OLD.duration_seconds IS DISTINCT FROM NEW.duration_seconds
  OR OLD.required_watch_percent IS DISTINCT FROM NEW.required_watch_percent
)
EXECUTE FUNCTION public.reset_video_progress_for_lesson_gate();

-- Recheck the gate inside the same transaction as the atomic attempt insert.
-- Locking the lesson row serializes submissions against video/gate edits. This
-- closes the race where an API request read an old unlock before a lesson edit
-- reset the progress row.
CREATE OR REPLACE FUNCTION public.create_test_attempt_with_answers(
  p_test_id uuid,
  p_student_id uuid,
  p_attempt_number integer,
  p_score numeric,
  p_submitted_at timestamp with time zone,
  p_answers jsonb
)
RETURNS public.test_attempts
LANGUAGE plpgsql
SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
  saved_attempt public.test_attempts;
  current_test public.lesson_tests;
  current_lesson public.lessons;
  current_progress public.video_progress;
  existing_attempt_count integer;
BEGIN
  SELECT *
  INTO current_test
  FROM public.lesson_tests
  WHERE id = p_test_id
  FOR UPDATE;

  IF NOT FOUND OR current_test.active IS NOT TRUE THEN
    RAISE EXCEPTION 'The test is no longer active'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO current_lesson
  FROM public.lessons
  WHERE id = current_test.lesson_id
  FOR SHARE;

  IF NOT FOUND
     OR current_lesson.published IS NOT TRUE
     OR (current_lesson.starts_at IS NOT NULL AND current_lesson.starts_at > clock_timestamp()) THEN
    RAISE EXCEPTION 'The lesson is not currently available'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles AS profile
    WHERE profile.id = p_student_id
      AND profile.role = 'STUDENT'::public.app_role
      AND profile.status = 'ACTIVE'::public.profile_status
  ) THEN
    RAISE EXCEPTION 'Active student authorization required'
      USING ERRCODE = '42501';
  END IF;

  IF current_lesson.team_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.team_members AS membership
       WHERE membership.student_id = p_student_id
         AND membership.team_id = current_lesson.team_id
         AND membership.status = 'ACTIVE'::public.assignment_status
     ) THEN
    RAISE EXCEPTION 'The lesson belongs to another team'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO current_progress
  FROM public.video_progress
  WHERE lesson_id = current_lesson.id
    AND student_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND
     OR current_progress.test_unlocked IS NOT TRUE
     OR current_progress.kinescope_video_id_snapshot IS DISTINCT FROM current_lesson.kinescope_video_id
     OR current_progress.duration_seconds_snapshot IS DISTINCT FROM current_lesson.duration_seconds
     OR current_progress.required_watch_percent_snapshot IS DISTINCT FROM current_lesson.required_watch_percent THEN
    RAISE EXCEPTION 'The current lesson video gate has not been satisfied'
      USING ERRCODE = '42501';
  END IF;

  SELECT count(*)::integer
  INTO existing_attempt_count
  FROM public.test_attempts
  WHERE test_id = p_test_id
    AND student_id = p_student_id;

  IF existing_attempt_count >= COALESCE(current_test.max_attempts, 1)
     OR p_attempt_number <> existing_attempt_count + 1 THEN
    RAISE EXCEPTION 'The test attempt limit has been reached or the attempt number is stale'
      USING ERRCODE = '23505';
  END IF;

  IF jsonb_typeof(p_answers) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_answers) = 0 THEN
    RAISE EXCEPTION 'A non-empty answers array is required'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_answers) AS items(answer)
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.test_questions AS question
      WHERE question.id = (answer ->> 'question_id')::uuid
        AND question.test_id = p_test_id
    )
  ) THEN
    RAISE EXCEPTION 'An answer references a question outside the test'
      USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.test_attempts (
    test_id,
    student_id,
    attempt_number,
    score,
    submitted_at
  )
  VALUES (
    p_test_id,
    p_student_id,
    p_attempt_number,
    p_score,
    p_submitted_at
  )
  RETURNING * INTO saved_attempt;

  INSERT INTO public.test_answers (
    attempt_id,
    question_id,
    selected_option_id,
    selected_option_ids,
    text_answer
  )
  SELECT
    saved_attempt.id,
    (answer ->> 'question_id')::uuid,
    NULLIF(answer ->> 'selected_option_id', '')::uuid,
    CASE
      WHEN jsonb_typeof(answer -> 'selected_option_ids') = 'array'
      THEN answer -> 'selected_option_ids'
      ELSE NULL
    END,
    NULLIF(answer ->> 'text_answer', '')
  FROM jsonb_array_elements(p_answers) AS items(answer);

  RETURN saved_attempt;
END;
$function$;
