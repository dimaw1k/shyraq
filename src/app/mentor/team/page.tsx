import { GraduationCap } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, StatusPill } from "@/components/ui/ShyraqUI";
import { getMentorPageData } from "@/lib/mentor/auth";
import { uiLabel } from "@/lib/ui-labels";

export default async function MentorTeamPage() {
  const { profile, workspace } = await getMentorPageData();

  return (
    <AppShell role="MENTOR" userName={profile.full_name} title="Команда" description={workspace?.team.name}>
      <PageContainer>
        {!workspace ? (
          <Card className="p-8 text-center"><EmptyState title="Команда бекітілмеген." /></Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">КОМАНДА</p>
                <h2 className="mt-1 text-[18px] font-extrabold text-[#172235]">Оқушылар</h2>
              </div>
              <span className="rounded-full bg-[#FFF0E2] px-2.5 py-1 text-[9px] font-extrabold text-[#B95D00]">{workspace.students.length} оқушы</span>
            </div>

            <div className="hidden grid-cols-[1.4fr_1.1fr_120px_100px_100px_110px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] lg:grid">
              <span>Оқушы</span><span>Байланыс</span><span>Ұпай</span><span>Қатысу</span><span>Есеп</span><span>Тапсырма</span>
            </div>

            <div className="divide-y divide-[#EFE8E1]">
              {workspace.students.map((student) => (
                <Link href="/mentor/team" key={student.id} className="grid gap-3 px-5 py-4 hover:bg-[#FFFBF6] lg:grid-cols-[1.4fr_1.1fr_120px_100px_100px_110px] lg:items-center lg:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF1E2] text-[#FF8000]"><GraduationCap size={14} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold text-[#354153]">{student.full_name}</p>
                      <p className="mt-1 truncate text-[9px] text-[#9A9189]">{uiLabel(student.status)}</p>
                    </div>
                  </div>
                  <div className="text-[9px] font-semibold text-[#8B8179]">
                    <p className="truncate">{student.phone}</p>
                    <p className="mt-1 truncate">{student.email}</p>
                  </div>
                  <p className="text-[11px] font-extrabold text-[#172235]">{student.score}</p>
                  <StatusPill tone={student.attendanceStatus === "Қатысты" ? "green" : student.attendanceStatus === "Қатыспады" ? "red" : "neutral"}>{student.attendanceStatus}</StatusPill>
                  <p className="text-[10px] font-extrabold text-[#4B433C]">{student.reportCount}</p>
                  <p className="text-[10px] font-extrabold text-[#4B433C]">{student.taskSubmittedCount}</p>
                </Link>
              ))}
              {!workspace.students.length ? <div className="p-8"><EmptyState title="Командада оқушы жоқ." /></div> : null}
            </div>
          </Card>
        )}
      </PageContainer>
    </AppShell>
  );
}
