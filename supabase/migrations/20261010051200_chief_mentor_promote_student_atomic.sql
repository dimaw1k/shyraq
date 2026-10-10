-- Promote a student to mentor and remove active student-team memberships as one
-- transaction. The caller must pass the authenticated Chief Mentor's profile ID;
-- service_role alone is not the authorization decision for this business action.
CREATE OR REPLACE FUNCTION public.chief_mentor_promote_student(
  p_target_user_id uuid,
  p_requesting_actor_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  actor_profile public.profiles%ROWTYPE;
  target_profile public.profiles%ROWTYPE;
  removed_memberships integer := 0;
BEGIN
  IF p_target_user_id IS NULL OR p_requesting_actor_id IS NULL THEN
    RAISE EXCEPTION 'Invalid promotion request'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO actor_profile
  FROM public.profiles
  WHERE id = p_requesting_actor_id
  FOR SHARE;

  IF NOT FOUND
     OR actor_profile.role <> 'CHIEF_MENTOR'::public.app_role
     OR actor_profile.status <> 'ACTIVE'::public.profile_status THEN
    RAISE EXCEPTION 'Active Chief Mentor authorization required'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO target_profile
  FROM public.profiles
  WHERE id = p_target_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF target_profile.role <> 'STUDENT'::public.app_role THEN
    RAISE EXCEPTION 'Only a student can be promoted to mentor'
      USING ERRCODE = '22023';
  END IF;

  UPDATE public.team_members
  SET
    status = 'REMOVED'::public.assignment_status,
    removed_at = clock_timestamp()
  WHERE student_id = p_target_user_id
    AND status = 'ACTIVE'::public.assignment_status;

  GET DIAGNOSTICS removed_memberships = ROW_COUNT;

  UPDATE public.profiles
  SET
    role = 'MENTOR'::public.app_role,
    status = 'ACTIVE'::public.profile_status,
    updated_at = clock_timestamp()
  WHERE id = p_target_user_id;

  INSERT INTO public.audit_logs (
    actor_id,
    actor_role,
    action,
    entity_type,
    entity_id,
    metadata
  )
  VALUES (
    actor_profile.id,
    actor_profile.role,
    'STUDENT_PROMOTED_TO_MENTOR',
    'PROFILE',
    p_target_user_id,
    jsonb_build_object(
      'previous_role', target_profile.role::text,
      'previous_status', target_profile.status::text,
      'new_role', 'MENTOR',
      'new_status', 'ACTIVE',
      'removed_active_memberships', removed_memberships
    )
  );

  RETURN p_target_user_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.chief_mentor_promote_student(uuid, uuid)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chief_mentor_promote_student(uuid, uuid)
  TO service_role;
