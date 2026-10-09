-- Remove the implicit PUBLIC/anonymous EXECUTE surface for public-schema RPCs.
-- SECURITY DEFINER RPCs must never be callable by authenticated users unless a
-- later migration deliberately re-grants a specific safe interface.
revoke execute on all functions in schema public from public, anon;

do $$
declare
  function_row record;
begin
  for function_row in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
  loop
    execute format(
      'revoke all privileges on function %s from public, anon, authenticated',
      function_row.signature
    );
  end loop;
end
$$;

-- RLS policies and read-only authenticated routes use these SECURITY INVOKER
-- helpers. Privileged SECURITY DEFINER RPCs remain service_role-only or trigger-only.
grant execute on function public.current_role() to authenticated, service_role;
grant execute on function public.is_team_mentor(uuid) to authenticated, service_role;
grant execute on function public.is_chief_mentor_or_above() to authenticated, service_role;
grant execute on function public.is_leader() to authenticated, service_role;
grant execute on function public.is_staff() to authenticated, service_role;
grant execute on function public.normalize_kz_phone(text) to authenticated, service_role;
