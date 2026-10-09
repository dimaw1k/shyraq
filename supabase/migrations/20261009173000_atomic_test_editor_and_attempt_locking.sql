-- Protect test history and serialize test editing with student submissions.
-- Replacing questions cascades their test_answers, so a test whose attempts
-- already exist must be immutable; create a new test for a new version.

CREATE OR REPLACE FUNCTION public.create_test_attempt_with_answers(
  p_test_id uuid,
  p_student_id uuid,
  p_attempt_number integer,
  p_score numeric,
  p_submitted_at timestamptz,
  p_answers jsonb
)
RETURNS public.test_attempts
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  saved_attempt public.test_attempts;
  current_test public.lesson_tests;
  existing_attempt_count integer;
BEGIN
  -- Shared row lock with the editor's replacement function. It serializes a
  -- test submit and an edit so neither can delete/change the other's question set.
  SELECT *
  INTO current_test
  FROM public.lesson_tests
  WHERE id = p_test_id
  FOR UPDATE;

  IF NOT FOUND OR current_test.active IS NOT TRUE THEN
    RAISE EXCEPTION 'The test is no longer active'
      USING ERRCODE = '22023';
  END IF;

  SELECT count(*)::integer
  INTO existing_attempt_count
  FROM public.test_attempts
  WHERE test_id = p_test_id
    AND student_id = p_student_id;

  -- Enforce the limit inside the locked database transaction, not only in the
  -- API's earlier count query, which may be stale under concurrent requests.
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

REVOKE ALL ON FUNCTION public.create_test_attempt_with_answers(
  uuid, uuid, integer, numeric, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_test_attempt_with_answers(
  uuid, uuid, integer, numeric, timestamptz, jsonb
) TO service_role;


CREATE OR REPLACE FUNCTION public.replace_lesson_test_questions(
  p_test_id uuid,
  p_questions jsonb
)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  locked_test_id uuid;
  question_data jsonb;
  option_data jsonb;
  new_question_id uuid;
  question_type_value text;
  question_text_value text;
  question_count integer := 0;
  correct_option_count integer;
BEGIN
  SELECT id
  INTO locked_test_id
  FROM public.lesson_tests
  WHERE id = p_test_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Test not found'
      USING ERRCODE = 'P0002';
  END IF;

  -- Keep prior student answer history intact. New question versions should use
  -- a new test after anyone has submitted an attempt.
  IF EXISTS (
    SELECT 1 FROM public.test_attempts WHERE test_id = p_test_id
  ) THEN
    RAISE EXCEPTION 'Cannot replace questions after students have attempted this test; create a new test version'
      USING ERRCODE = '55000';
  END IF;

  IF jsonb_typeof(p_questions) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_questions) < 1
     OR jsonb_array_length(p_questions) > 50 THEN
    RAISE EXCEPTION 'A test must contain between 1 and 50 questions'
      USING ERRCODE = '22023';
  END IF;

  -- Validate the whole payload before deleting anything.
  FOR question_data IN
    SELECT item
    FROM jsonb_array_elements(p_questions) AS q(item)
  LOOP
    question_type_value := question_data ->> 'question_type';
    question_text_value := btrim(COALESCE(question_data ->> 'question_text', ''));

    IF question_type_value NOT IN ('SINGLE', 'MULTIPLE', 'TEXT')
       OR question_text_value = ''
       OR length(question_text_value) > 10000
       OR jsonb_typeof(question_data -> 'attachments') IS DISTINCT FROM 'array'
       OR jsonb_array_length(question_data -> 'attachments') > 3 THEN
      RAISE EXCEPTION 'Invalid question payload'
        USING ERRCODE = '22023';
    END IF;

    IF question_type_value = 'TEXT' THEN
      IF jsonb_typeof(question_data -> 'options') IS DISTINCT FROM 'array'
         OR jsonb_array_length(question_data -> 'options') <> 0 THEN
        RAISE EXCEPTION 'Text questions cannot contain answer options'
          USING ERRCODE = '22023';
      END IF;
    ELSE
      IF jsonb_typeof(question_data -> 'options') IS DISTINCT FROM 'array'
         OR jsonb_array_length(question_data -> 'options') < 2
         OR jsonb_array_length(question_data -> 'options') > 6 THEN
        RAISE EXCEPTION 'Choice questions must contain 2 to 6 options'
          USING ERRCODE = '22023';
      END IF;

      SELECT count(*)::integer
      INTO correct_option_count
      FROM jsonb_array_elements(question_data -> 'options') AS o(item)
      WHERE COALESCE((item ->> 'is_correct')::boolean, false)
        AND btrim(COALESCE(item ->> 'option_text', '')) <> '';

      IF (question_type_value = 'SINGLE' AND correct_option_count <> 1)
         OR (question_type_value = 'MULTIPLE' AND correct_option_count < 1) THEN
        RAISE EXCEPTION 'Invalid number of correct options'
          USING ERRCODE = '22023';
      END IF;
    END IF;
  END LOOP;

  DELETE FROM public.test_questions WHERE test_id = p_test_id;

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

  RETURN question_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.replace_lesson_test_questions(uuid, jsonb)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_lesson_test_questions(uuid, jsonb)
  TO service_role;
