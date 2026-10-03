import { CheckCircle2, CircleAlert, GraduationCap } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, StatusPill } from "@/components/ui/ShyraqUI";
import { getMentorPageData } from "@/lib/mentor/auth";
import { uiLabel } from "@/lib/ui-labels";

export default async function MentorTeamPage() {
  const { profile, workspace } = await getMentorPageData();

  const averageMeet =
    workspace?.students.length
      ? workspace.students.reduce((sum, student) => sum + student.attendanceAverage, 0) /
        workspace.students.length
      : 0;

  const attentionCount =
    workspace?.students.filter(
      (student) => student.attendanceAverage > 0 && student.attendanceAverage < 60,
    ).length ?? 0;

  return (
    <AppShell
      role="MENTOR"
      userName={profile.full_name}
      title="Команда"
      hideHeader
    >
      <PageContainer>
        {!workspace ? (
          <Card className="p-8 text-center">
            <EmptyState title="Команда бекітілмеген." />
          </Card>
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">КОМАНДА</p>
                <h1 className="mt-1 text-[28px] font-extrabold tracking-[-.045em] text-[#172235]">Команда</h1>
              </div>
              <span className="rounded-full border border-[#FFDDBB] bg-[#FFF1E2] px-3.5 py-2 text-[11px] font-extrabold text-[#B95D00]">
                {workspace.team.name}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["ОҚУШЫ", String(workspace.students.length), "командада"],
                ["MEET ҚАТЫСУ", averageMeet ? averageMeet.toFixed(1) + "%" : "—", "орташа"],
                ["НАЗАР", String(attentionCount), "төмен қатысу"],
              ].map(([label, value, hint], index) => (
                <Card key={label} className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#A19890]">
                        {label}
                      </p>
                      <p className="mt-1 text-[24px] font-extrabold tracking-[-.045em] text-[#172235]">
                        {value}
                      </p>
                      <p className="mt-0.5 text-[9px] font-semibold text-[#8B8179]">{hint}</p>
                    </div>
                    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
                      {index === 2 ? <CircleAlert size={15} /> : <CheckCircle2 size={15} />}
                    </span>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                    КОМАНДА
                  </p>
                  <h2 className="mt-1 text-[18px] font-extrabold text-[#172235]">Оқушылар</h2>
                </div>
                <span className="rounded-full bg-[#FFF0E2] px-2.5 py-1 text-[9px] font-extrabold text-[#B95D00]">
                  {workspace.students.length} оқушы
                </span>
              </div>

              <div className="hidden min-w-[980px] lg:block">
                <div className="grid grid-cols-[54px_1.8fr_1.1fr_120px_120px_100px_110px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[8px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">
                  <span>№</span>
                  <span>ОҚУШЫ</span>
                  <span>БАЙЛАНЫС</span>
                  <span>MEET</span>
                  <span>БЕЙНЕ</span>
                  <span>ҰПАЙ</span>
                  <span>ТАПСЫРМА</span>
                </div>

                <div className="divide-y divide-[#EFE8E1]">
                  {workspace.students.map((student, index) => (
                    <Link
                      href="/mentor/team"
                      key={student.id}
                      className="grid grid-cols-[54px_1.8fr_1.1fr_120px_120px_100px_110px] items-center gap-3 px-6 py-3.5 transition hover:bg-[#FFFBF6]"
                    >
                      <span className="text-[9px] font-bold text-[#A19890]">{index + 1}</span>

                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#172235] text-[9px] font-extrabold text-white">
                          {student.full_name
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((part) => part[0]?.toUpperCase())
                            .join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-extrabold text-[#354153]">
                            {student.full_name}
                          </p>
                          <p className="mt-0.5 truncate text-[8px] font-semibold text-[#9A9189]">
                            {uiLabel(student.status)}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-0 text-[8px] font-semibold text-[#8B8179]">
                        <p className="truncate">{student.phone}</p>
                        <p className="mt-0.5 truncate">{student.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={[
                            "grid h-7 w-7 place-items-center rounded-full",
                            student.attendanceAverage >= 80
                              ? "bg-[#EDF8F2] text-[#2E7E58]"
                              : student.attendanceAverage > 0 && student.attendanceAverage < 60
                                ? "bg-[#FFF0EE] text-[#BF514A]"
                                : "bg-[#F4F1EC] text-[#8B8179]",
                          ].join(" ")}
                        >
                          {student.attendanceAverage > 0 && student.attendanceAverage < 60 ? (
                            <CircleAlert size={12} />
                          ) : (
                            <CheckCircle2 size={12} />
                          )}
                        </span>
                        <div>
                          <p className="text-[10px] font-extrabold text-[#334054]">
                            {student.attendanceAverage
                              ? student.attendanceAverage.toFixed(1) + "%"
                              : "—"}
                          </p>
                          <p className="mt-0.5 text-[7px] font-semibold text-[#A19890]">
                            {student.attendanceStatus}
                          </p>
                        </div>
                      </div>

                      <p className="text-[10px] font-extrabold text-[#334054]">
                        {student.videoAverage ? student.videoAverage.toFixed(1) + "%" : "—"}
                      </p>
                      <p className="text-[11px] font-extrabold text-[#172235]">
                        {student.score || 0}
                      </p>
                      <p className="text-[10px] font-extrabold text-[#4B433C]">
                        {student.taskSubmittedCount}
                      </p>
                    </Link>
                  ))}

                  {!workspace.students.length ? (
                    <div className="p-8">
                      <EmptyState title="Командада оқушы жоқ." />
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="divide-y divide-[#EFE8E1] lg:hidden">
                {workspace.students.map((student) => (
                  <Link
                    href="/mentor/team"
                    key={student.id}
                    className="block space-y-3 px-4 py-4 transition hover:bg-[#FFFBF6]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#172235] text-[10px] font-extrabold text-white">
                        {student.full_name
                          .split(" ")
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase())
                          .join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-extrabold text-[#354153]">
                          {student.full_name}
                        </p>
                        <p className="mt-1 truncate text-[8px] font-semibold text-[#9A9189]">
                          {student.email}
                        </p>
                      </div>
                      <StatusPill tone={student.status === "ACTIVE" ? "green" : "orange"}>
                        {uiLabel(student.status)}
                      </StatusPill>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ["Meet", student.attendanceAverage ? student.attendanceAverage.toFixed(1) + "%" : "—"],
                        ["Бейне", student.videoAverage ? student.videoAverage.toFixed(1) + "%" : "—"],
                        ["Ұпай", String(student.score || 0)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[12px] bg-[#FAF8F5] px-3 py-2.5">
                          <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#A19890]">
                            {label}
                          </p>
                          <p className="mt-1 text-[13px] font-extrabold text-[#334054]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
