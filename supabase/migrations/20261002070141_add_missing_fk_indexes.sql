-- 0027 — cover foreign keys flagged by Supabase Performance Advisor

create index if not exists daily_report_questions_created_by_idx
  on public.daily_report_questions(created_by);

create index if not exists marathon_banners_created_by_idx
  on public.marathon_banners(created_by);

create index if not exists support_tickets_resolved_by_idx
  on public.support_tickets(resolved_by);
