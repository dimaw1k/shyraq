import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer } from "@/components/ui/ShyraqUI";
import { MentorReportsManager } from "@/components/mentor/MentorReportsManager";
import { getMentorPageData } from "@/lib/mentor/auth";
import { MarathonDayNavigator } from "@/components/staff/MarathonDayNavigator";

export default async function MentorReportsPage({ searchParams }: { searchParams?: Promise<{ day?: string }> }) {
  const { profile, workspace } = await getMentorPageData();
  const selectedDay = Math.min(21, Math.max(1, Number((await searchParams)?.day ?? 1) || 1));

  return (
    <AppShell role="MENTOR" userName={profile.full_name} title="Есептер" hideHeader>
      <PageContainer>
        {!workspace ? (
          <Card className="p-8 text-center">
            <EmptyState title="Команда бекітілмеген." />
          </Card>
        ) : (
          <div className="space-y-5">
            <MarathonDayNavigator basePath="/mentor/reports" selectedDay={selectedDay} />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">КҮНДЕЛІКТІ ЕСЕП</p>
                <h1 className="mt-1 text-[28px] font-extrabold tracking-[-.045em] text-[#172235]">Оқушы есептері</h1>
              </div>
              <span className="rounded-full border border-[#FFDDBB] bg-[#FFF1E2] px-3.5 py-2 text-[11px] font-extrabold text-[#B95D00]">
                {workspace.reports.length} есеп
              </span>
            </div>

            <MentorReportsManager reports={workspace.reports.filter((report) => Number(report.marathon_day ?? 0) === selectedDay)} />
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
