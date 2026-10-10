-- Serialize daily-report writes with reviews. A request that read the old
-- SUBMITTED/REJECTED status before a mentor review must not overwrite REVIEWED.
CREATE OR REPLACE FUNCTION public.save_daily_report_submission(
  p_student_id uuid,
  p_report_date date,
  p_report_type text,
  p_marathon_day smallint,
  p_study_minutes integer,
  p_completed_task_count integer,
  p_reflection text,
  p_difficulties text,
  p_next_day_goal text,
  p_answers jsonb
)
RETURNS public.daily_reports
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  actor_profile public.profiles%ROWTYPE;
  report_settings public.marathon_settings%ROWTYPE;
  current_report public.daily_reports%ROWTYPE;
  saved_report public.daily_reports%ROWTYPE;
  local_now timestamp without time zone := clock_timestamp() AT TIME ZONE 'Asia/Almaty';
  required_open_time time without time zone;
BEGIN
  IF p_student_id IS NULL
     OR p_report_date IS NULL
     OR p_report_type NOT IN ('MORNING', 'EVENING')
     OR p_marathon_day IS NOT NULL AND (p_marathon_day < 1 OR p_marathon_day > 21)
     OR p_study_minutes IS NULL OR p_study_minutes < 0 OR p_study_minutes > 1440
     OR p_completed_task_count IS NULL OR p_completed_task_count < 0 OR p_completed_task_count > 10000
     OR p_reflection IS NOT NULL AND length(p_reflection) > 3000
     OR p_difficulties IS NOT NULL AND length(p_difficulties) > 3000
     OR p_next_day_goal IS NOT NULL AND length(p_next_day_goal) > 3000
     OR jsonb_typeof(p_answers) IS DISTINCT FROM 'object'
     OR octet_length(p_answers::text) > 65536 THEN
    RAISE EXCEPTION 'Invalid daily report payload'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO actor_profile
  FROM public.profiles
  WHERE id = p_student_id
  FOR SHARE;

  IF NOT FOUND
     OR actor_profile.role <> 'STUDENT'::public.app_role
     OR actor_profile.status <> 'ACTIVE'::public.profile_status THEN
    RAISE EXCEPTION 'Active student authorization required'
      USING ERRCODE = '42501';
  END IF;

  IF p_report_date <> local_now::date THEN
    RAISE EXCEPTION 'Daily reports may only be submitted for the current Almaty date'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO report_settings
  FROM public.marathon_settings
  WHERE id IS TRUE
  FOR SHARE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report settings are unavailable'
      USING ERRCODE = 'P0002';
  END IF;

  required_open_time := CASE
    WHEN p_report_type = 'MORNING' THEN report_settings.morning_report_open_time
    ELSE report_settings.evening_report_open_time
  END;

  IF local_now::time < required_open_time THEN
    RAISE EXCEPTION 'The daily report window is not open yet'
      USING ERRCODE = '55000';
  END IF;

  -- Acquire the unique report row even when it does not yet exist, then lock
  -- that row before evaluating state. Concurrent submissions serialize here.
  INSERT INTO public.daily_reports (
    student_id, report_date, report_type, answers, status,
    study_minutes, completed_task_count
  )
  VALUES (
    p_student_id, p_report_date, p_report_type, '{}'::jsonb, 'DRAFT'::public.submission_status,
    0, 0
  )
  ON CONFLICT (student_id, report_date, report_type) DO NOTHING;

  SELECT *
  INTO current_report
  FROM public.daily_reports
  WHERE student_id = p_student_id
    AND report_date = p_report_date
    AND report_type = p_report_type
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Daily report could not be locked'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_report.status = 'REVIEWED'::public.submission_status THEN
    RAISE EXCEPTION 'A reviewed daily report is immutable'
      USING ERRCODE = '55000';
  END IF;

  UPDATE public.daily_reports
  SET
    marathon_day = p_marathon_day,
    study_minutes = p_study_minutes,
    completed_task_count = p_completed_task_count,
    reflection = p_reflection,
    difficulties = p_difficulties,
    next_day_goal = p_next_day_goal,
    answers = p_answers,
    status = 'SUBMITTED'::public.submission_status,
    submitted_at = clock_timestamp(),
    reviewed_at = NULL,
    reviewed_by = NULL,
    updated_at = clock_timestamp()
  WHERE id = current_report.id
  RETURNING * INTO saved_report;

  RETURN saved_report;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_daily_report_submission(uuid, date, text, smallint, integer, integer, text, text, text, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_daily_report_submission(uuid, date, text, smallint, integer, integer, text, text, text, jsonb)
  TO service_role;
