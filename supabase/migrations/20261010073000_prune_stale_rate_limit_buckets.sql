-- Bound the growth of per-identifier rate-limit state.
-- Keys may contain attacker-controlled email/identifier material (stored only as a hash),
-- so dormant buckets must be periodically pruned. A bounded opportunistic cleanup avoids
-- depending on pg_cron and caps per-request delete work.
create index if not exists security_rate_limit_buckets_updated_at_idx
  on public.security_rate_limit_buckets (updated_at);

create or replace function public.consume_security_rate_limit(
  p_bucket_key text,
  p_limit integer,
  p_window_seconds integer,
  p_block_seconds integer default 1800
)
returns table(
  allowed boolean,
  retry_after_seconds integer,
  hits integer
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  now_ts timestamptz := clock_timestamp();
  current_window_started timestamptz;
  current_hits integer;
  current_blocked_until timestamptz;
  next_hits integer;
  reset_at timestamptz;
  next_blocked_until timestamptz;
begin
  if p_bucket_key is null or length(trim(p_bucket_key)) < 16 then
    raise exception 'invalid_bucket_key';
  end if;

  if p_limit < 1 or p_window_seconds < 1 or p_block_seconds < 1 then
    raise exception 'invalid_rate_limit';
  end if;

  -- An idle bucket older than 24 hours cannot still represent a live limit window
  -- in this app (the longest configured window is one hour). Prune at random intervals
  -- and delete at most 500 rows each time to keep hot-path overhead bounded.
  if random() < 0.05 then
    delete from public.security_rate_limit_buckets
    where bucket_key in (
      select stale.bucket_key
      from public.security_rate_limit_buckets as stale
      where stale.updated_at < now_ts - interval '24 hours'
      order by stale.updated_at asc
      limit 500
    );
  end if;

  insert into public.security_rate_limit_buckets(
    bucket_key,
    window_started_at,
    hits,
    blocked_until,
    updated_at
  )
  values(
    p_bucket_key,
    now_ts,
    0,
    null,
    now_ts
  )
  on conflict (bucket_key) do nothing;

  select
    rl.window_started_at,
    rl.hits,
    rl.blocked_until
  into
    current_window_started,
    current_hits,
    current_blocked_until
  from public.security_rate_limit_buckets as rl
  where rl.bucket_key = p_bucket_key
  for update;

  if current_blocked_until is not null and current_blocked_until > now_ts then
    return query
    select
      false,
      greatest(
        1,
        ceil(extract(epoch from (current_blocked_until - now_ts)))::integer
      ),
      current_hits;
    return;
  end if;

  reset_at := current_window_started + make_interval(secs => p_window_seconds);

  if now_ts >= reset_at then
    next_hits := 1;

    update public.security_rate_limit_buckets
    set
      window_started_at = now_ts,
      hits = next_hits,
      blocked_until = null,
      updated_at = now_ts
    where bucket_key = p_bucket_key;

    return query
    select true, 0, next_hits;
    return;
  end if;

  next_hits := current_hits + 1;

  if next_hits > p_limit then
    next_blocked_until := now_ts + make_interval(secs => p_block_seconds);

    update public.security_rate_limit_buckets
    set
      hits = next_hits,
      blocked_until = next_blocked_until,
      updated_at = now_ts
    where bucket_key = p_bucket_key;

    return query
    select
      false,
      greatest(
        1,
        ceil(extract(epoch from (next_blocked_until - now_ts)))::integer
      ),
      next_hits;
    return;
  end if;

  update public.security_rate_limit_buckets
  set
    hits = next_hits,
    blocked_until = null,
    updated_at = now_ts
  where bucket_key = p_bucket_key;

  return query
  select true, 0, next_hits;
end;
$function$;

-- Retain service-role-only access to the privileged rate-limit RPC.
revoke all on function public.consume_security_rate_limit(text, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_security_rate_limit(text, integer, integer, integer)
  to service_role;
