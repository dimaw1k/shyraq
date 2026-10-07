-- 2026-10-08 — lock helper function execution to authenticated callers.
-- Trigger/helper functions do not need to be callable by anonymous Data API clients.

revoke execute on function public.normalize_kz_phone(text) from public;
revoke execute on function public.normalize_profile_before_write() from public;
revoke execute on function public.set_updated_at() from public;

alter default privileges for role postgres in schema public
  revoke execute on functions from public;
