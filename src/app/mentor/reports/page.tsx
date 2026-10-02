import { FileText } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, StatusPill } from "@/components/ui/ShyraqUI";
import { MentorReportReviewActions } from "@/components/mentor/MentorReportReviewActions";
import { getMentorPageData } from "@/lib/mentor/auth";

export default async function MentorReportsPage() {
  const { profile, workspace } = await getMentorPageData();

  return (
    <AppShell role="MENTOR" userName={profile.full_name} title="Есептер" description={workspace?.team.name}>
      <PageContainer>
        {!workspace ? <Card className="p-8 text-center"><EmptyState title="Команда бекітілмеген." /></Card> : (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">DAILY REPORT</p>
                <h2 className="mt-1 text-[18px] font-extrabold text-[#172235]">Оқушы есептері</h2>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill tone="orange">{workspace.reports.filter((report) => report.status === "SUBMITTED").length} жаңа</StatusPill>
                <FileText size={16} className="text-[#FF8000]" />
              </div>
            </div>
            <div className="divide-y divide-[#EFE8E1]">
              {workspace.reports.map((report) => (
                <div key={report.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_1.4fr_auto] lg:items-start sm:px-6">
                  <div>
                    <p className="text-[11px] font-extrabold text-[#263247]">{report.student_name}</p>
                    <p className="mt-1 text-[9px] font-semibold text-[#9A9189]">{report.report_date} · {report.study_minutes} минут</p>
                  </div>
                  <div className="rounded-[12px] bg-[#FFFCF9] px-3.5 py-3">
                    <p className="text-[9px] font-extrabold uppercase tracking-[.08em] text-[#A19890]">Есеп</p>
                    <p className="mt-1 text-[10px] font-semibold leading-5 text-[#5F5750]">{report.reflection || report.next_day_goal || "Мәтін жоқ"}</p>
                    {report.difficulties ? <p className="mt-2 text-[9px] font-semibold text-[#B54D2B]">Қиындық: {report.difficulties}</p> : null}
                  </div>
                  <MentorReportReviewActions reportId={report.id} status={report.status} reviewComment={report.review_comment} />
                </div>
              ))}
              {!workspace.reports.length ? <div className="p-8"><EmptyState title="Есеп жоқ." /></div> : null}
            </div>
          </Card>
        )}
      </PageContainer>
    </AppShell>
  );
}
