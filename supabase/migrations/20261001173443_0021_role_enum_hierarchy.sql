-- 0021 — replace the legacy ADMIN enum value with the new LEADER role hierarchy
--
-- ADMIN is renamed in-place so existing profile/audit-log rows keep their enum
-- identity while exposing the new role name. CHIEF_MENTOR is added for the
-- second staff level.

alter type public.app_role rename value 'ADMIN' to 'LEADER';
alter type public.app_role add value if not exists 'CHIEF_MENTOR';
