import { Download, FileText, Paperclip } from "lucide-react";
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
  const reportIds = (reports ?? []).map((report) => report.id);
  const { data: reportFiles } = reportIds.length
    ? await supabase
        .from("report_files")
        .select("id,report_id,slot,file_name,size_bytes")
        .in("report_id", reportIds)
    : { data: [] as Array<{ id: string; report_id: string; slot: string; file_name: string; size_bytes: number }> };

  const filesByReport = new Map<string, NonNullable<typeof reportFiles>>();
  for (const file of reportFiles ?? []) {
    const items = filesByReport.get(file.report_id) ?? [];
    items.push(file);
    filesByReport.set(file.report_id, items);
  }

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
                      {filesByReport.get(report.id)?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {filesByReport.get(report.id)!.map((file) => (
                            <a
                              key={file.id}
                              href={"/api/reports/files/download?fileId=" + encodeURIComponent(file.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex max-w-full items-center gap-1 rounded-lg border border-[#FFDDBB] bg-[#FFF9F3] px-2 py-1 text-[9px] font-bold text-[#9C5600] hover:bg-[#FFF0E8]"
                              title={file.file_name}
                            >
                              <Paperclip size={10} />
                              <span className="max-w-[120px] truncate">{file.slot.replace(/_/g, " ")}</span>
                              <Download size={10} />
                            </a>
                          ))}
                        </div>
                      ) : null}
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
