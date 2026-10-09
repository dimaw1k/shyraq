-- Mentor self-service may connect only the Meet space for the active team
-- that they manage. Chief mentors and leaders retain their existing wider policy.
DROP POLICY IF EXISTS meet_spaces_mentor_insert ON public.meet_spaces;
CREATE POLICY meet_spaces_mentor_insert
  ON public.meet_spaces
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_team_mentor(team_id));

DROP POLICY IF EXISTS meet_spaces_mentor_update ON public.meet_spaces;
CREATE POLICY meet_spaces_mentor_update
  ON public.meet_spaces
  FOR UPDATE
  TO authenticated
  USING (public.is_team_mentor(team_id))
  WITH CHECK (public.is_team_mentor(team_id));
