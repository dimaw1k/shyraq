import { FileText } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { uiLabel } from "@/lib/ui-labels";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { ReportReviewActions } from "@/components/staff/ReportReviewActions";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { ReportQuestionManager } from "@/components/staff/ReportQuestionManager";
import { MarathonDayNavigator } from "@/components/staff/MarathonDayNavigator";

export default async function ChiefMentorReportsPage({ searchParams }: { searchParams?: Promise<{ day?: string }> }) {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const selectedDay = Math.min(21, Math.max(1, Number((await searchParams)?.day ?? 1) || 1));

  const { data: reports } = await supabase
    .from("daily_reports")
    .select("id,student_id,report_date,marathon_day,status,study_minutes,completed_task_count,submitted_at")
    .order("report_date", { ascending: false })
    .limit(100);

  const ids = [...new Set((reports ?? []).map((report) => report.student_id))];
  const { data: students } = ids.length
    ? await supabase.from("profiles").select("id,full_name").in("id", ids)
    : { data: [] as Array<{ id: string; full_name: string }> };

  const nameMap = new Map((students ?? []).map((student) => [student.id, student.full_name]));

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Есептер"
      
    >
      <PageContainer>
        <div className="space-y-5">
          <MarathonDayNavigator basePath="/chief-mentor/reports" selectedDay={selectedDay} />
          <ReportQuestionManager />

          <SectionHeader
            eyebrow="ЕСЕПТЕР"
            title="Күнделікті есептер"
            description="Күнделікті есептерді бақылау және тексеру."
          />

          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1.15fr_110px_120px_120px_190px] gap-3 border-b border-[#EFE8E1] bg-[#FCFAF8] px-5 py-3 text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#9A9189] sm:grid sm:px-6">
              <span>Оқушы</span>
              <span>Оқу</span>
              <span>Тапсырма</span>
              <span>Статус</span>
              <span className="text-right">Әрекет</span>
            </div>

            <div className="divide-y divide-[#EFE8E1]">
              {(reports ?? []).filter((report) => Number(report.marathon_day ?? 0) === selectedDay).map((report) => (
                <div
                  key={report.id}
                  className="grid gap-4 px-5 py-4 sm:grid-cols-[1.15fr_110px_120px_120px_190px] sm:items-center sm:px-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]">
                      <FileText size={14} />
                    </span>
                    <div>
                      <p className="text-[11px] font-extrabold text-[#354153]">
                        {nameMap.get(report.student_id) ?? "Оқушы"}
                      </p>
                      <p className="mt-1 text-[9px] text-[#9A9189]">
                        {new Date(report.report_date).toLocaleDateString("kk-KZ")}
                      </p>
                    </div>
                  </div>

                  <p className="text-[9px] font-semibold text-[#8B8179]">
                    {report.study_minutes ?? 0} мин
                  </p>

                  <p className="text-[9px] text-[#8B8179]">
                    {report.completed_task_count ?? 0} тапсырма
                  </p>

                  <StatusPill
                    tone={
                      report.status === "REVIEWED"
                        ? "green"
                        : report.status === "REJECTED"
                          ? "red"
                          : "orange"
                    }
                  >
                    {report.status === "SUBMITTED"
                      ? "Жіберілді"
                      : report.status === "REVIEWED"
                        ? "Тексерілді"
                        : report.status === "REJECTED"
                          ? "Қайтарылды"
                          : report.status}
                  </StatusPill>

                  <div className="flex justify-end">
                    <ReportReviewActions reportId={report.id} status={report.status} />
                  </div>
                </div>
              ))}

              {!reports?.length ? (
                <div className="p-8">
                  <EmptyState title="Есеп жоқ." />
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
