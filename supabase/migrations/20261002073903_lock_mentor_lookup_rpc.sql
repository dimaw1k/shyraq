revoke all privileges on function public.mentor_find_student_by_phone(text, uuid) from public, anon, authenticated;
grant execute on function public.mentor_find_student_by_phone(text, uuid) to service_role;
