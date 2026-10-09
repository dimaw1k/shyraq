-- Profile role/status changes must go through trusted server-side handlers.
-- The self-update policy allowed authenticated users to update their own role
-- and status directly, which could lead to privilege escalation.
revoke update on table public.profiles from public, anon, authenticated;
revoke update (
  id,
  role,
  status,
  phone,
  email,
  full_name,
  avatar_path,
  created_at,
  updated_at
) on table public.profiles from public, anon, authenticated;
drop policy if exists profiles_update_self on public.profiles;