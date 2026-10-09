-- Reconcile the baseline public-schema lockdown that was applied to production.
-- Keep authenticated/service_role grants intact; RLS policies remain the row-level
-- authorization boundary, while anonymous clients receive no direct table/sequence
-- privileges. Enable RLS on all existing public base tables idempotently.
do $$
declare
  item record;
begin
  for item in
    select schemaname, tablename
    from pg_tables
    where schemaname = 'public'
  loop
    execute format('alter table %I.%I enable row level security', item.schemaname, item.tablename);
  end loop;
end
$$;

revoke all privileges on all tables in schema public from public, anon;
revoke all privileges on all sequences in schema public from public, anon;
