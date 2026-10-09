-- Do not expose a student's test scores or test-derived ranking points until
-- their configured attempt limit is exhausted. The helper uses SECURITY DEFINER
-- to inspect attempts without recursively invoking the test_attempts RLS policy.

CREATE OR REPLACE FUNCTION private.student_test_results_revealed(p_test_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.profiles AS profile
      WHERE profile.id = (SELECT auth.uid())
        AND profile.role = 'STUDENT'
        AND profile.status = 'ACTIVE'
    )
    AND EXISTS (
      SELECT 1
      FROM public.lesson_tests AS test
      WHERE test.id = p_test_id
        AND (
          SELECT count(*)
          FROM public.test_attempts AS attempt
          WHERE attempt.test_id = test.id
            AND attempt.student_id = (SELECT auth.uid())
        ) >= GREATEST(1, COALESCE(test.max_attempts, 1))
    );
$function$;

REVOKE ALL ON FUNCTION private.student_test_results_revealed(uuid)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.student_test_results_revealed(uuid)
  TO authenticated, service_role;

DROP POLICY IF EXISTS test_attempts_select ON public.test_attempts;
CREATE POLICY test_attempts_select
  ON public.test_attempts
  FOR SELECT
  TO authenticated
  USING (
    (
      student_id = (SELECT auth.uid())
      AND private.student_test_results_revealed(test_id)
    )
    OR (SELECT is_chief_mentor_or_above())
  );

-- Score events are directly readable by their student. Hide TESTS events until
-- the final attempt and only reveal the final attempt's row. This also prevents
-- older pre-fix attempt events from disclosing intermediate scores in metadata.
DROP POLICY IF EXISTS score_events_select ON public.score_events;
CREATE POLICY score_events_select
  ON public.score_events
  FOR SELECT
  TO authenticated
  USING (
    (
      student_id = (SELECT auth.uid())
      AND (
        source_code IS DISTINCT FROM 'TESTS'
        OR EXISTS (
          SELECT 1
          FROM public.test_attempts AS attempt
          JOIN public.lesson_tests AS test
            ON test.id = attempt.test_id
          WHERE attempt.id = score_events.source_id
            AND attempt.student_id = (SELECT auth.uid())
            AND attempt.attempt_number >= GREATEST(1, COALESCE(test.max_attempts, 1))
            AND private.student_test_results_revealed(attempt.test_id)
        )
      )
    )
    OR (SELECT is_chief_mentor_or_above())
    OR (
      team_id IS NOT NULL
      AND (SELECT is_team_mentor(score_events.team_id))
    )
  );


-- Update test metadata and replace questions/options as one transaction. The
-- editor creates new tests as inactive placeholders so students cannot open a
-- half-created exam while attachments are being uploaded.
CREATE OR REPLACE FUNCTION public.save_lesson_test_version(
  p_test_id uuid,
  p_title text,
  p_instructions text,
  p_passing_score numeric,
  p_max_attempts integer,
  p_active boolean,
  p_questions jsonb
)
RETURNS public.lesson_tests
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  current_test public.lesson_tests;
  saved_test public.lesson_tests;
  question_data jsonb;
  option_data jsonb;
  new_question_id uuid;
  question_type_value text;
  question_text_value text;
  question_count integer := 0;
  correct_option_count integer;
BEGIN
  SELECT *
  INTO current_test
  FROM public.lesson_tests
  WHERE id = p_test_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Test not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.test_attempts
    WHERE test_id = p_test_id
  ) THEN
    RAISE EXCEPTION 'Cannot replace a test version after students have attempted it'
      USING ERRCODE = '55000';
  END IF;

  IF p_title IS NULL OR btrim(p_title) = '' OR length(btrim(p_title)) > 200 THEN
    RAISE EXCEPTION 'Invalid test title'
      USING ERRCODE = '22023';
  END IF;

  IF p_passing_score IS NOT NULL AND (p_passing_score < 0 OR p_passing_score > 100) THEN
    RAISE EXCEPTION 'Invalid passing score'
      USING ERRCODE = '22023';
  END IF;

  IF p_max_attempts IS NULL OR p_max_attempts < 1 OR p_max_attempts > 100 THEN
    RAISE EXCEPTION 'max_attempts must be between 1 and 100'
      USING ERRCODE = '22023';
  END IF;

  IF p_active IS NULL THEN
    RAISE EXCEPTION 'active flag is required'
      USING ERRCODE = '22023';
  END IF;

  IF jsonb_typeof(p_questions) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Questions must be an array'
      USING ERRCODE = '22023';
  END IF;
  IF jsonb_array_length(p_questions) < 1 OR jsonb_array_length(p_questions) > 50 THEN
    RAISE EXCEPTION 'A test must contain between 1 and 50 questions'
      USING ERRCODE = '22023';
  END IF;

  -- Validate the complete payload before modifying existing question rows.
  FOR question_data IN
    SELECT item
    FROM jsonb_array_elements(p_questions) AS q(item)
  LOOP
    question_type_value := question_data ->> 'question_type';
    question_text_value := btrim(COALESCE(question_data ->> 'question_text', ''));

    IF question_type_value IS NULL
       OR question_type_value NOT IN ('SINGLE', 'MULTIPLE', 'TEXT')
       OR question_text_value = ''
       OR length(question_text_value) > 10000 THEN
      RAISE EXCEPTION 'Invalid question text or type'
        USING ERRCODE = '22023';
    END IF;

    IF jsonb_typeof(question_data -> 'attachments') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Question attachments must be an array'
        USING ERRCODE = '22023';
    END IF;
    IF jsonb_array_length(question_data -> 'attachments') > 3 THEN
      RAISE EXCEPTION 'Each question can have at most 3 attachments'
        USING ERRCODE = '22023';
    END IF;

    IF jsonb_typeof(question_data -> 'options') IS DISTINCT FROM 'array' THEN
      RAISE EXCEPTION 'Question options must be an array'
        USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements(question_data -> 'options') AS o(item)
      WHERE btrim(COALESCE(item ->> 'option_text', '')) = ''
    ) THEN
      RAISE EXCEPTION 'Answer option text cannot be empty'
        USING ERRCODE = '22023';
    END IF;

    IF question_type_value = 'TEXT' THEN
      IF jsonb_array_length(question_data -> 'options') <> 0 THEN
        RAISE EXCEPTION 'Text questions cannot contain answer options'
          USING ERRCODE = '22023';
      END IF;
    ELSE
      IF jsonb_array_length(question_data -> 'options') < 2
         OR jsonb_array_length(question_data -> 'options') > 6 THEN
        RAISE EXCEPTION 'Choice questions must contain 2 to 6 options'
          USING ERRCODE = '22023';
      END IF;

      SELECT count(*)::integer
      INTO correct_option_count
      FROM jsonb_array_elements(question_data -> 'options') AS o(item)
      WHERE COALESCE((item ->> 'is_correct')::boolean, false);

      IF (question_type_value = 'SINGLE' AND correct_option_count <> 1)
         OR (question_type_value = 'MULTIPLE' AND correct_option_count < 1) THEN
        RAISE EXCEPTION 'Invalid number of correct options'
          USING ERRCODE = '22023';
      END IF;
    END IF;
  END LOOP;

  DELETE FROM public.test_questions
  WHERE test_id = p_test_id;

  FOR question_data IN
    SELECT item
    FROM jsonb_array_elements(p_questions) AS q(item)
  LOOP
    question_type_value := question_data ->> 'question_type';

    INSERT INTO public.test_questions (
      test_id, question_text, points, sort_order, question_type, attachments
    )
    VALUES (
      p_test_id,
      btrim(question_data ->> 'question_text'),
      GREATEST(0, COALESCE(NULLIF(question_data ->> 'points', '')::numeric, 1)),
      GREATEST(0, COALESCE(NULLIF(question_data ->> 'sort_order', '')::integer, question_count)),
      question_type_value,
      COALESCE(question_data -> 'attachments', '[]'::jsonb)
    )
    RETURNING id INTO new_question_id;

    IF question_type_value <> 'TEXT' THEN
      FOR option_data IN
        SELECT item
        FROM jsonb_array_elements(question_data -> 'options') AS o(item)
      LOOP
        INSERT INTO public.test_options (
          question_id, option_text, is_correct, sort_order
        )
        VALUES (
          new_question_id,
          btrim(COALESCE(option_data ->> 'option_text', '')),
          COALESCE((option_data ->> 'is_correct')::boolean, false),
          GREATEST(0, COALESCE(NULLIF(option_data ->> 'sort_order', '')::integer, 0))
        );
      END LOOP;
    END IF;

    question_count := question_count + 1;
  END LOOP;

  UPDATE public.lesson_tests
  SET
    title = btrim(p_title),
    instructions = NULLIF(btrim(COALESCE(p_instructions, '')), ''),
    passing_score = p_passing_score,
    max_attempts = p_max_attempts,
    active = p_active
  WHERE id = p_test_id
  RETURNING * INTO saved_test;

  RETURN saved_test;
END;
$function$;

REVOKE ALL ON FUNCTION public.save_lesson_test_version(
  uuid, text, text, numeric, integer, boolean, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_lesson_test_version(
  uuid, text, text, numeric, integer, boolean, jsonb
) TO service_role;
