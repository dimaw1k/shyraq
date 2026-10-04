-- Restrict the mentor lookup SECURITY DEFINER RPC to trusted server-side callers.
revoke all privileges
on function public.mentor_find_student_by_phone(text, uuid)
from public, anon, authenticated;

grant execute
on function public.mentor_find_student_by_phone(text, uuid)
to service_role;
