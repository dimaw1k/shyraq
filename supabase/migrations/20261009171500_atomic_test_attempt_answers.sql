-- Atomically save a test attempt and all selected answers.
-- If any answer row violates a constraint, PostgreSQL rolls the whole function
-- call back so a failed submission cannot consume an attempt without its answers.

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
BEGIN
  IF jsonb_typeof(p_answers) IS DISTINCT FROM 'array'
     OR jsonb_array_length(p_answers) = 0 THEN
    RAISE EXCEPTION 'A non-empty answers array is required'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(p_answers) AS answer
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
  FROM jsonb_array_elements(p_answers) AS answer;

  RETURN saved_attempt;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_test_attempt_with_answers(
  uuid, uuid, integer, numeric, timestamptz, jsonb
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_test_attempt_with_answers(
  uuid, uuid, integer, numeric, timestamptz, jsonb
) TO service_role;
