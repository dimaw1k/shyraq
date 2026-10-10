-- These tables hold server-verified external data or derived scores. Allowing
-- authenticated DML lets API clients bypass Google verification, scoring rules,
-- audit logging and rate limits via the Supabase REST API.
REVOKE INSERT, UPDATE, DELETE
  ON TABLE
    public.attendance_records,
    public.google_connections,
    public.meet_conferences,
    public.meet_participant_mappings,
    public.meet_participant_sessions,
    public.meet_participants,
    public.meet_spaces,
    public.score_events
  FROM PUBLIC, anon, authenticated;

-- Ensure server-side handlers continue to have the write privileges needed for
-- OAuth, Meet synchronization, participant reconciliation and score events.
GRANT INSERT, UPDATE, DELETE
  ON TABLE
    public.attendance_records,
    public.google_connections,
    public.meet_conferences,
    public.meet_participant_mappings,
    public.meet_participant_sessions,
    public.meet_participants,
    public.meet_spaces,
    public.score_events
  TO service_role;

-- Reads remain governed by the existing SELECT grants and RLS policies.
DROP POLICY IF EXISTS attendance_staff_delete ON public.attendance_records;
DROP POLICY IF EXISTS attendance_staff_insert ON public.attendance_records;
DROP POLICY IF EXISTS attendance_staff_update ON public.attendance_records;

DROP POLICY IF EXISTS google_connections_staff_delete ON public.google_connections;
DROP POLICY IF EXISTS google_connections_staff_insert ON public.google_connections;
DROP POLICY IF EXISTS google_connections_staff_update ON public.google_connections;

DROP POLICY IF EXISTS meet_conferences_staff_delete ON public.meet_conferences;
DROP POLICY IF EXISTS meet_conferences_staff_insert ON public.meet_conferences;
DROP POLICY IF EXISTS meet_conferences_staff_update ON public.meet_conferences;

DROP POLICY IF EXISTS meet_participant_mappings_staff_delete ON public.meet_participant_mappings;
DROP POLICY IF EXISTS meet_participant_mappings_staff_insert ON public.meet_participant_mappings;
DROP POLICY IF EXISTS meet_participant_mappings_staff_update ON public.meet_participant_mappings;

DROP POLICY IF EXISTS meet_participant_sessions_staff_delete ON public.meet_participant_sessions;
DROP POLICY IF EXISTS meet_participant_sessions_staff_insert ON public.meet_participant_sessions;
DROP POLICY IF EXISTS meet_participant_sessions_staff_update ON public.meet_participant_sessions;

DROP POLICY IF EXISTS meet_participants_staff_delete ON public.meet_participants;
DROP POLICY IF EXISTS meet_participants_staff_insert ON public.meet_participants;
DROP POLICY IF EXISTS meet_participants_staff_update ON public.meet_participants;

DROP POLICY IF EXISTS meet_spaces_mentor_insert ON public.meet_spaces;
DROP POLICY IF EXISTS meet_spaces_mentor_update ON public.meet_spaces;
DROP POLICY IF EXISTS meet_spaces_staff_delete ON public.meet_spaces;
DROP POLICY IF EXISTS meet_spaces_staff_insert ON public.meet_spaces;
DROP POLICY IF EXISTS meet_spaces_staff_update ON public.meet_spaces;

DROP POLICY IF EXISTS score_events_staff_insert ON public.score_events;
