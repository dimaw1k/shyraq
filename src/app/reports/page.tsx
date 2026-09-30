import { redirect } from "next/navigation";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { DailyReportForm } from "@/components/reports/DailyReportForm";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  const { data: reportRows } = await supabase
    .from("daily_reports")
    .select("id,report_date,study_minutes,completed_task_count,status,reflection")
    .eq("student_id", user.id)
    .order("report_date", { ascending: false })
    .limit(14);

  const role = profile?.role ?? "STUDENT";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Есептер" description="Күнделікті оқу прогресін белгілеңіз." right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
      <main className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-5 sm:px-6 sm:py-7 lg:grid-cols-[0.95fr_1.05fr]">
        <DailyReportForm />
        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">HISTORY</p>
              <h2 className="mt-1 text-sm font-semibold tracking-tight text-gray-900">Соңғы есептер</h2>
            </div>
            <span className="text-xs text-gray-400">{reportRows?.length ?? 0} жазба</span>
          </div>
          <div className="mt-4 space-y-2">
            {(reportRows ?? []).map((report) => (
              <div key={report.id} className="rounded-xl bg-[#FAFAFA] p-3.5 transition-all duration-300 ease-in-out hover:bg-white hover:shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-900">{report.report_date}</span>
                  <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-gray-500">{report.status}</span>
                </div>
                <p className="mt-1.5 text-xs text-gray-500">{report.study_minutes ?? 0} мин · {report.completed_task_count ?? 0} тапсырма</p>
                {report.reflection ? <p className="mt-2 text-sm leading-6 text-gray-700">{report.reflection}</p> : null}
              </div>
            ))}
            {!reportRows?.length ? <p className="py-8 text-center text-sm text-gray-500">Әзірге есеп жоқ.</p> : null}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
