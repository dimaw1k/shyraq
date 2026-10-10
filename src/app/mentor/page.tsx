import Link from "next/link";
import { Activity, ClipboardCheck, FileText, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getMentorPageData } from "@/lib/mentor/auth";

function issueOf(student: {
  overdueTaskCount: number;
  todayReportMissing: boolean;
  pendingReviewCount: number;
}) {
  if (student.overdueTaskCount > 0) return { title: "Соңғы мерзімнен кешігу", detail: student.overdueTaskCount + " тапсырма", tone: "red" as const };
  if (student.todayReportMissing) return { title: "Бүгін есеп жоқ", detail: "Күндік есеп", tone: "orange" as const };
  if (student.pendingReviewCount > 0) return { title: "Тапсырмасы тексерілуде", detail: student.pendingReviewCount + " жұмыс", tone: "orange" as const };
  return null;
}

export default async function MentorPage() {
  const { profile, workspace } = await getMentorPageData();

  if (!workspace) {
    return (
      <AppShell role="MENTOR" userName={profile.full_name} title="Басты бет">
        <PageContainer>
          <Card className="p-8 text-center">
            <p className="text-sm font-extrabold text-[#172235]">Команда бекітілмеген</p>
            <p className="mt-1 text-[10px] font-semibold text-[#9A9189]">Лидер сізге команда бекіткеннен кейін бұл бөлім толтырылады.</p>
          </Card>
        </PageContainer>
      </AppShell>
    );
  }

  const alerts = workspace.students
    .map((student) => ({ student, issue: issueOf(student) }))
    .filter((item): item is { student: typeof workspace.students[number]; issue: NonNullable<ReturnType<typeof issueOf>> } => Boolean(item.issue))
    .sort((a, b) => (a.issue.tone === "red" ? -1 : b.issue.tone === "red" ? 1 : 0))
    .slice(0, 3);

  return (
    <AppShell role="MENTOR" userName={profile.full_name} title="Басқару">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="МЕНТОР"
            title="Бүгінгі жағдай"
          />

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="ОҚУШЫ" value={String(workspace.students.length)} hint="команда" icon={<UsersRound size={17} />} />
            <MetricCard label="ТЕКСЕРУ" value={String(workspace.pendingReviewCount)} hint="жаңа жұмыс" icon={<ClipboardCheck size={17} />} />
          </section>

          <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4">
                <div>
                  <p className="text-[13px] font-extrabold text-[#172235]">Назар аударатындар</p>
                  <p className="mt-0.5 text-[9px] font-semibold text-[#9A9189]">Қазір әрекет қажет болуы мүмкін</p>
                </div>
                <Link href="/mentor/team" className="text-[9px] font-extrabold text-[#FF8000]">Барлығын көру</Link>
              </div>
              <div className="divide-y divide-[#EFE8E1]">
                {alerts.length ? alerts.map(({ student, issue }) => (
                  <Link key={student.id} href="/mentor/team" className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#FFFBF6]">
                    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#172235] text-[10px] font-extrabold text-white">
                      {student.full_name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]?.toUpperCase()).join("")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-extrabold text-[#243044]">{student.full_name}</span>
                      <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#8F857D]">{issue.title} · {issue.detail}</span>
                    </span>
                    <StatusPill tone={issue.tone}>{issue.tone === "red" ? "Шұғыл" : "Назар"}</StatusPill>
                  </Link>
                )) : (
                  <div className="px-5 py-8 text-center text-[10px] font-extrabold text-[#3F3832]">Қазір назар аударатын оқушы жоқ</div>
                )}
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Link href="/mentor/tasks">
                <Card className="flex items-center justify-between p-5 transition hover:-translate-y-0.5">
                  <div>
                    <p className="text-[13px] font-extrabold text-[#172235]">Тапсырмалар</p>
                    <p className="mt-1 text-[9px] font-semibold text-[#9A9189]">Тексеру және сұраныстар</p>
                  </div>
                  <ClipboardCheck size={18} className="text-[#FF8000]" />
                </Card>
              </Link>
              <Link href="/mentor/reports">
                <Card className="flex items-center justify-between p-5 transition hover:-translate-y-0.5">
                  <div>
                    <p className="text-[13px] font-extrabold text-[#172235]">Есептер</p>
                    <p className="mt-1 text-[9px] font-semibold text-[#9A9189]">Күндік есепті тексеру</p>
                  </div>
                  <FileText size={18} className="text-[#FF8000]" />
                </Card>
              </Link>
              <Link href="/mentor/meet" className="sm:col-span-2 lg:col-span-1">
                <Card className="flex items-center justify-between p-5 transition hover:-translate-y-0.5">
                  <div>
                    <p className="text-[13px] font-extrabold text-[#172235]">Кездесу</p>
                    <p className="mt-1 text-[9px] font-semibold text-[#9A9189]">{workspace.meetSpaces.length ? workspace.meetSpaces.map((space) => space.study_time === "MORNING" ? "Таңғы Meet" : space.study_time === "EVENING" ? "Кешкі Meet" : "Қосымша Meet").join(" · ") : "Meet қосылмаған"}</p>
                  </div>
                  <Activity size={18} className="text-[#FF8000]" />
                </Card>
              </Link>
            </div>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
