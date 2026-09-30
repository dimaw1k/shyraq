-- 0014 — prevent browser-side arbitrary score RPC calls

revoke execute on function public.record_score_event(
  uuid,
  uuid,
  text,
  uuid,
  numeric,
  jsonb
) from public, anon, authenticated;
