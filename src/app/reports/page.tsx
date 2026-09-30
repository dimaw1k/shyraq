import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { DailyReportForm } from "@/components/reports/DailyReportForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const { data: reportRows } = await supabase.from("daily_reports")
    .select("id,report_date,study_minutes,completed_task_count,status,reflection")
    .eq("student_id", user.id).order("report_date", { ascending: false }).limit(14);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role={profile?.role ?? "STUDENT"} />
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 lg:grid-cols-[1fr_1fr]">
        <DailyReportForm />
        <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <h2 className="text-xl font-semibold">Соңғы есептер</h2>
          <div className="mt-5 space-y-3">
            {(reportRows ?? []).map((report) => (
              <div key={report.id} className="rounded-xl bg-zinc-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{report.report_date}</span>
                  <span className="text-xs text-[var(--muted)]">{report.status}</span>
                </div>
                <p className="mt-2 text-sm text-[var(--muted)]">{report.study_minutes ?? 0} мин · {report.completed_task_count ?? 0} тапсырма</p>
                {report.reflection ? <p className="mt-2 text-sm">{report.reflection}</p> : null}
              </div>
            ))}
            {!reportRows?.length ? <p className="text-sm text-[var(--muted)]">Әзірге есеп жоқ.</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
