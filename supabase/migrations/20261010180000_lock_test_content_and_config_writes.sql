-- Critical test definitions, attempt history, scoring rules, report-question
-- configuration, marathon settings and banners are all changed through
-- rate-limited server endpoints using the service-role client. Direct DML by an
-- authenticated client would bypass those validators and atomic version RPCs.
REVOKE INSERT, UPDATE, DELETE
  ON TABLE
    public.lesson_tests,
    public.test_questions,
    public.test_options,
    public.test_attempts,
    public.test_answers,
    public.daily_report_questions,
    public.score_rules,
    public.marathon_settings,
    public.marathon_banners
  FROM PUBLIC, anon, authenticated;

-- Preserve service-side writes used by the validated API routes and server-only
-- RPCs after removing direct client privileges.
GRANT INSERT, UPDATE, DELETE
  ON TABLE
    public.lesson_tests,
    public.test_questions,
    public.test_options,
    public.test_attempts,
    public.test_answers,
    public.daily_report_questions,
    public.score_rules,
    public.marathon_settings,
    public.marathon_banners
  TO service_role;

-- Keep all SELECT policies as-is. Only the direct-write policies are removed.
DROP POLICY IF EXISTS lesson_tests_staff_delete ON public.lesson_tests;
DROP POLICY IF EXISTS lesson_tests_staff_insert ON public.lesson_tests;
DROP POLICY IF EXISTS lesson_tests_staff_update ON public.lesson_tests;

DROP POLICY IF EXISTS test_questions_staff_delete ON public.test_questions;
DROP POLICY IF EXISTS test_questions_staff_insert ON public.test_questions;
DROP POLICY IF EXISTS test_questions_staff_update ON public.test_questions;

DROP POLICY IF EXISTS test_options_staff_delete ON public.test_options;
DROP POLICY IF EXISTS test_options_staff_insert ON public.test_options;
DROP POLICY IF EXISTS test_options_staff_update ON public.test_options;

DROP POLICY IF EXISTS test_attempts_staff_insert ON public.test_attempts;
DROP POLICY IF EXISTS test_answers_staff_insert ON public.test_answers;

DROP POLICY IF EXISTS daily_report_questions_staff_delete ON public.daily_report_questions;
DROP POLICY IF EXISTS daily_report_questions_staff_insert ON public.daily_report_questions;
DROP POLICY IF EXISTS daily_report_questions_staff_update ON public.daily_report_questions;

DROP POLICY IF EXISTS score_rules_staff_delete ON public.score_rules;
DROP POLICY IF EXISTS score_rules_staff_insert ON public.score_rules;
DROP POLICY IF EXISTS score_rules_staff_update ON public.score_rules;

DROP POLICY IF EXISTS marathon_settings_staff_delete ON public.marathon_settings;
DROP POLICY IF EXISTS marathon_settings_staff_insert ON public.marathon_settings;
DROP POLICY IF EXISTS marathon_settings_staff_update ON public.marathon_settings;

DROP POLICY IF EXISTS marathon_banners_staff_delete ON public.marathon_banners;
DROP POLICY IF EXISTS marathon_banners_staff_insert ON public.marathon_banners;
DROP POLICY IF EXISTS marathon_banners_staff_update ON public.marathon_banners;
