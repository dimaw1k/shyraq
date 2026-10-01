-- 0023 — keep privileged score mutation RPC server-only
--
-- record_score_event() is SECURITY DEFINER and therefore must not be exposed
-- through PostgREST to anonymous or authenticated clients.

revoke all privileges
on function public.record_score_event(uuid,uuid,text,uuid,numeric,jsonb)
from public,anon,authenticated;

grant execute
on function public.record_score_event(uuid,uuid,text,uuid,numeric,jsonb)
to service_role;
