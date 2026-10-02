import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { uiLabel } from "@/lib/ui-labels";
import { DailyReportForm } from "@/components/reports/DailyReportForm";
import { Card, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<{ day?: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dayParam = (await searchParams)?.day;
  const marathonDay = dayParam ? Number(dayParam) : null;

  const [{ data: profile }, { data: reportRows }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase
      .from("daily_reports")
      .select("id,report_date,marathon_day,study_minutes,completed_task_count,status,reflection")
      .eq("student_id", user.id)
      .order("report_date", { ascending: false })
      .limit(30),
  ]);

  const role = profile?.role ?? "STUDENT";
  const filtered = marathonDay ? (reportRows ?? []).filter((row) => Number(row.marathon_day) === marathonDay) : (reportRows ?? []);

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Күндік есеп" description={marathonDay ? marathonDay + "-күннің есебі" : "Күнделікті оқу прогресін белгіле."}>
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="ПРОГРЕСС" title={marathonDay ? marathonDay + "-күн" : "Күндік есеп"} description="Бүгін не істегеніңді қысқа түрде белгіле." />
          <div className="grid gap-5 lg:grid-cols-[.88fr_1.12fr]">
            <Card className="p-5 sm:p-6"><DailyReportForm marathonDay={marathonDay ?? undefined} /></Card>
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">ТАРИХ</p><h2 className="mt-1 text-[18px] font-extrabold text-[#172235]">Есептер тарихы</h2></div>
                <span className="text-[10px] font-semibold text-[#9A9189]">{filtered.length} жазба</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {filtered.map((report) => (
                  <div key={report.id} className="rounded-[16px] bg-[#FFFCF9] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[11px] font-extrabold text-[#172235]">{report.report_date}</span>
                      <StatusPill tone={report.status === "REVIEWED" ? "green" : "neutral"}>{uiLabel(report.status)}</StatusPill>
                    </div>
                    <p className="mt-2 text-[10px] font-semibold text-[#8B8179]">{report.study_minutes ?? 0} мин · {report.completed_task_count ?? 0} тапсырма</p>
                    {report.reflection ? <p className="mt-2.5 text-xs font-medium leading-5 text-[#4F4740]">{report.reflection}</p> : null}
                  </div>
                ))}
                {!filtered.length ? <p className="py-10 text-center text-xs font-medium text-[#9A9189]">Әзірге есеп жоқ.</p> : null}
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
