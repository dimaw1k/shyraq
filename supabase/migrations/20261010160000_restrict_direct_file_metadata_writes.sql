-- File metadata is a security-sensitive reference to private Storage objects.
-- All supported inserts/replacements go through service-role routes and the RPCs
-- below; authenticated clients may read rows allowed by RLS, but never forge or
-- mutate storage_path/file_size metadata directly.
REVOKE INSERT, UPDATE, DELETE
  ON TABLE public.submission_files, public.report_files
  FROM PUBLIC, anon, authenticated;

DROP POLICY IF EXISTS submission_files_student_insert ON public.submission_files;
DROP POLICY IF EXISTS report_files_student_insert ON public.report_files;


CREATE OR REPLACE FUNCTION public.replace_daily_report_file(
  p_student_id uuid,
  p_report_id uuid,
  p_slot text,
  p_storage_path text,
  p_file_name text,
  p_mime_type text,
  p_size_bytes bigint
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  actor_profile public.profiles%ROWTYPE;
  current_report public.daily_reports%ROWTYPE;
  saved_file public.report_files%ROWTYPE;
  prior_paths text[] := ARRAY[]::text[];
  expected_prefix text;
BEGIN
  IF p_student_id IS NULL
     OR p_report_id IS NULL
     OR p_slot IS NULL
     OR p_slot NOT IN ('MORNING_MEET', 'PLAN', 'SCREEN_TIME', 'PROCESS')
     OR p_storage_path IS NULL
     OR p_file_name IS NULL
     OR length(p_file_name) < 1
     OR length(p_file_name) > 255
     OR p_mime_type NOT IN (
       'image/jpeg', 'image/png', 'image/webp',
       'application/pdf', 'application/msword',
       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
     )
     OR p_size_bytes IS NULL
     OR p_size_bytes < 1
     OR p_size_bytes > 4194304
     OR length(p_storage_path) > 1024
     OR p_storage_path LIKE '%' || chr(92) || '%'
     OR p_storage_path ~ '(^|/)\.\.(/|$)' THEN
    RAISE EXCEPTION 'Invalid report file metadata'
      USING ERRCODE = '22023';
  END IF;

  expected_prefix := p_student_id::text || '/reports/' || p_report_id::text || '/' || p_slot || '/';
  IF left(p_storage_path, length(expected_prefix)) <> expected_prefix
     OR length(p_storage_path) <= length(expected_prefix)
     OR position('/' in substr(p_storage_path, length(expected_prefix) + 1)) > 0 THEN
    RAISE EXCEPTION 'Report file path is outside the expected slot folder'
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
  INTO current_report
  FROM public.daily_reports
  WHERE id = p_report_id
    AND student_id = p_student_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Report not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF current_report.status = 'REVIEWED'::public.submission_status THEN
    RAISE EXCEPTION 'Reviewed reports cannot be changed'
      USING ERRCODE = '55000';
  END IF;

  SELECT COALESCE(array_agg(storage_path), ARRAY[]::text[])
  INTO prior_paths
  FROM public.report_files
  WHERE report_id = p_report_id
    AND slot = p_slot
    AND left(storage_path, length(expected_prefix)) = expected_prefix
    AND position(chr(92) in storage_path) = 0
    AND storage_path !~ '(^|/)\.\.(/|$)';

  DELETE FROM public.report_files
  WHERE report_id = p_report_id
    AND slot = p_slot;

  INSERT INTO public.report_files (
    report_id, slot, storage_path, file_name, mime_type, size_bytes
  )
  VALUES (
    p_report_id, p_slot, p_storage_path, p_file_name, p_mime_type, p_size_bytes
  )
  RETURNING * INTO saved_file;

  RETURN jsonb_build_object(
    'file', to_jsonb(saved_file),
    'old_paths', to_jsonb(prior_paths)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.replace_daily_report_file(uuid, uuid, text, text, text, text, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_daily_report_file(uuid, uuid, text, text, text, text, bigint)
  TO service_role;
