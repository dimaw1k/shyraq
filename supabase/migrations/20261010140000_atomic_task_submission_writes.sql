-- Serialize student submission edits and file attachments with the same
-- task-submission row lock. This prevents a delayed draft autosave from
-- reverting a submitted/reviewed submission and prevents late file inserts.
CREATE OR REPLACE FUNCTION public.save_task_submission(
  p_task_id uuid,
  p_student_id uuid,
  p_text_answer text,
  p_link_url text,
  p_finalize boolean
)
RETURNS public.task_submissions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  actor_profile public.profiles%ROWTYPE;
  current_task public.tasks%ROWTYPE;
  current_submission public.task_submissions%ROWTYPE;
  saved_submission public.task_submissions%ROWTYPE;
  current_time timestamptz := clock_timestamp();
  existing_file_count integer := 0;
BEGIN
  IF p_task_id IS NULL
     OR p_student_id IS NULL
     OR p_finalize IS NULL
     OR (p_text_answer IS NOT NULL AND length(p_text_answer) > 10000)
     OR (p_link_url IS NOT NULL AND length(p_link_url) > 2048)
     OR (p_link_url IS NOT NULL AND p_link_url <> '' AND p_link_url !~* '^https?://') THEN
    RAISE EXCEPTION 'Invalid task submission payload'
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

  SELECT *
  INTO current_task
  FROM public.tasks
  WHERE id = p_task_id
  FOR SHARE;

  IF NOT FOUND OR current_task.active IS NOT TRUE THEN
    RAISE EXCEPTION 'Task is not available'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_task.starts_at IS NOT NULL AND current_task.starts_at > current_time THEN
    RAISE EXCEPTION 'Task has not started'
      USING ERRCODE = '55000';
  END IF;

  IF current_task.team_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.team_members AS membership
       WHERE membership.student_id = p_student_id
         AND membership.team_id = current_task.team_id
         AND membership.status = 'ACTIVE'::public.assignment_status
     ) THEN
    RAISE EXCEPTION 'Task is not assigned to this student'
      USING ERRCODE = '42501';
  END IF;

  -- Insert a provisional draft only if the unique (task, student) row does not
  -- exist. A concurrent caller serializes on the unique key and then locks the
  -- same row below before making a state transition.
  INSERT INTO public.task_submissions (
    task_id, student_id, status, text_answer, link_url, submitted_at, submitted_late
  )
  VALUES (
    p_task_id, p_student_id, 'DRAFT'::public.submission_status, NULL, NULL, NULL, false
  )
  ON CONFLICT (task_id, student_id) DO NOTHING;

  SELECT *
  INTO current_submission
  FROM public.task_submissions
  WHERE task_id = p_task_id
    AND student_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission could not be locked'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_submission.status IN (
    'SUBMITTED'::public.submission_status,
    'REVIEWED'::public.submission_status
  ) THEN
    RAISE EXCEPTION 'Submission is locked'
      USING ERRCODE = '55000';
  END IF;

  IF current_submission.status = 'REJECTED'::public.submission_status
     AND current_submission.resubmission_deadline IS NOT NULL
     AND current_submission.resubmission_deadline < current_time THEN
    RAISE EXCEPTION 'The resubmission deadline has passed'
      USING ERRCODE = '55000';
  END IF;

  IF p_finalize AND current_task.attachment_required IS TRUE THEN
    SELECT count(*)::integer
    INTO existing_file_count
    FROM public.submission_files
    WHERE submission_id = current_submission.id;

    IF existing_file_count < 1 THEN
      RAISE EXCEPTION 'A required attachment is missing'
        USING ERRCODE = '23514';
    END IF;
  END IF;

  UPDATE public.task_submissions
  SET
    status = CASE
      WHEN p_finalize THEN 'SUBMITTED'::public.submission_status
      ELSE 'DRAFT'::public.submission_status
    END,
    text_answer = p_text_answer,
    link_url = NULLIF(btrim(p_link_url), ''),
    submitted_at = CASE WHEN p_finalize THEN current_time ELSE NULL END,
    submitted_late = CASE
      WHEN p_finalize THEN (current_task.deadline IS NOT NULL AND current_time > current_task.deadline)
      ELSE false
    END,
    updated_at = current_time
  WHERE id = current_submission.id
  RETURNING * INTO saved_submission;

  RETURN saved_submission;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_task_submission(uuid, uuid, text, text, boolean)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_task_submission(uuid, uuid, text, text, boolean)
  TO service_role;


CREATE OR REPLACE FUNCTION public.attach_task_submission_file(
  p_task_id uuid,
  p_submission_id uuid,
  p_student_id uuid,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_size_bytes bigint
)
RETURNS public.submission_files
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  actor_profile public.profiles%ROWTYPE;
  current_task public.tasks%ROWTYPE;
  current_submission public.task_submissions%ROWTYPE;
  saved_file public.submission_files%ROWTYPE;
  current_time timestamptz := clock_timestamp();
  existing_file_count integer := 0;
  expected_prefix text;
BEGIN
  IF p_task_id IS NULL
     OR p_submission_id IS NULL
     OR p_student_id IS NULL
     OR p_storage_path IS NULL
     OR p_file_name IS NULL
     OR p_mime_type IS NULL
     OR p_size_bytes IS NULL
     OR length(p_file_name) < 1
     OR length(p_file_name) > 255
     OR p_size_bytes < 1
     OR p_size_bytes > 4194304
     OR p_mime_type NOT IN (
       'image/jpeg', 'image/png', 'image/webp',
       'application/pdf', 'application/msword',
       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
     )
     OR length(p_storage_path) > 1024
     OR p_storage_path LIKE '%' || chr(92) || '%'
     OR p_storage_path ~ '(^|/)\.\.(/|$)' THEN
    RAISE EXCEPTION 'Invalid submission file metadata'
      USING ERRCODE = '22023';
  END IF;

  expected_prefix := p_student_id::text || '/' || p_submission_id::text || '/';
  IF left(p_storage_path, length(expected_prefix)) <> expected_prefix
     OR length(p_storage_path) <= length(expected_prefix) THEN
    RAISE EXCEPTION 'Submission file path is outside the owner folder'
      USING ERRCODE = '42501';
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

  SELECT *
  INTO current_task
  FROM public.tasks
  WHERE id = p_task_id
  FOR SHARE;

  IF NOT FOUND OR current_task.active IS NOT TRUE THEN
    RAISE EXCEPTION 'Task is not available'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_task.starts_at IS NOT NULL AND current_task.starts_at > current_time THEN
    RAISE EXCEPTION 'Task has not started'
      USING ERRCODE = '55000';
  END IF;

  IF current_task.team_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM public.team_members AS membership
       WHERE membership.student_id = p_student_id
         AND membership.team_id = current_task.team_id
         AND membership.status = 'ACTIVE'::public.assignment_status
     ) THEN
    RAISE EXCEPTION 'Task is not assigned to this student'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO current_submission
  FROM public.task_submissions
  WHERE id = p_submission_id
    AND task_id = p_task_id
    AND student_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_submission.status <> 'DRAFT'::public.submission_status THEN
    RAISE EXCEPTION 'Files can only be attached to a draft submission'
      USING ERRCODE = '55000';
  END IF;

  SELECT count(*)::integer
  INTO existing_file_count
  FROM public.submission_files
  WHERE submission_id = p_submission_id;

  IF existing_file_count >= current_task.max_files THEN
    RAISE EXCEPTION 'The submission file limit has been reached'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.submission_files (
    submission_id, storage_path, file_name, mime_type, size_bytes
  )
  VALUES (
    p_submission_id, p_storage_path, p_file_name, p_mime_type, p_size_bytes
  )
  RETURNING * INTO saved_file;

  RETURN saved_file;
END;
$function$;

REVOKE ALL ON FUNCTION public.attach_task_submission_file(uuid, uuid, uuid, text, text, text, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_task_submission_file(uuid, uuid, uuid, text, text, text, bigint)
  TO service_role;
