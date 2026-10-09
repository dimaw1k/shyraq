-- Remove the implicit PUBLIC/anonymous EXECUTE surface for public-schema RPCs.
-- Explicitly preserve low-risk helpers used by authenticated app sessions/RLS;
-- privileged SECURITY DEFINER operations remain service_role-only or trigger-only.
revoke execute on all functions in schema public from public, anon;

grant execute on function public.current_role() to authenticated, service_role;
grant execute on function public.is_team_mentor(uuid) to authenticated, service_role;
grant execute on function public.is_chief_mentor_or_above() to authenticated, service_role;
grant execute on function public.is_leader() to authenticated, service_role;
grant execute on function public.is_staff() to authenticated, service_role;
grant execute on function public.normalize_kz_phone(text) to authenticated, service_role;
