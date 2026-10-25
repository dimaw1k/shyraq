import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import {
  Card,
  EmptyState,
  MetricCard,
  PageContainer,
  ProgressBar,
  StatusPill,
} from "@/components/ui/ShyraqUI";
import { getMentorPageData } from "@/lib/mentor/auth";

function issueOf(student: {
  overdueTaskCount: number;
  todayReportMissing: boolean;
  pendingReviewCount: number;
}) {
  if (student.overdueTaskCount > 0) {
    return {
      title: "Мерзімі өтіп кеткен тапсырма",
      detail: student.overdueTaskCount + " тапсырма",
      tone: "red" as const,
    };
  }

  if (student.todayReportMissing) {
    return {
      title: "Бүгінгі есеп тапсырылмаған",
      detail: "Күндік есеп күтілуде",
      tone: "orange" as const,
    };
  }

  if (student.pendingReviewCount > 0) {
    return {
      title: "Тапсырмасы тексеруді күтуде",
      detail: student.pendingReviewCount + " жұмыс",
      tone: "orange" as const,
    };
  }

  return null;
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "О";
}

export default async function MentorPage() {
  const { profile, workspace } = await getMentorPageData();

  if (!workspace) {
    return (
      <AppShell
        role="MENTOR"
        userName={profile.full_name}
        title="Ментор кабинеті"
        hideHeader
      >
        <PageContainer className="pt-8 sm:pt-10">
          <Card className="p-6 sm:p-10">
            <div className="mx-auto max-w-xl py-5 text-center sm:py-8">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-[18px] bg-[#FFF1E2] text-[#FF8000]">
                <UsersRound size={24} />
              </span>
              <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">
                МЕНТОР КАБИНЕТІ
              </p>
              <h1 className="mt-2 text-[26px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[30px]">
                Команда әлі бекітілмеген
              </h1>
              <p className="mx-auto mt-3 max-w-md text-[13px] leading-6 text-[#857B72]">
                Лидер сізге команда бекіткеннен кейін мұнда оқушылардың прогресі,
                тапсырмалары және күнделікті есептері көрсетіледі.
              </p>
            </div>
          </Card>
        </PageContainer>
      </AppShell>
    );
  }

  const allStudentIssues = workspace.students
    .map((student) => ({ student, issue: issueOf(student) }))
    .filter(
      (
        item,
      ): item is {
        student: (typeof workspace.students)[number];
        issue: NonNullable<ReturnType<typeof issueOf>>;
      } => Boolean(item.issue),
    )
    .sort((a, b) => {
      if (a.issue.tone === "red" && b.issue.tone !== "red") return -1;
      if (b.issue.tone === "red" && a.issue.tone !== "red") return 1;
      return 0;
    });

  const alerts = allStudentIssues.slice(0, 4);
  const reportsToReview = workspace.reports.filter(
    (report) => report.status === "SUBMITTED",
  ).length;
  const videoAverage = workspace.students.length
    ? Math.round(
        workspace.students.reduce(
          (sum, student) => sum + student.videoAverage,
          0,
        ) / workspace.students.length,
      )
    : 0;
  const reportCoverage = workspace.students.length
    ? Math.round(
        (workspace.students.filter((student) => !student.todayReportMissing)
          .length /
          workspace.students.length) *
          100,
      )
    : 0;
  const attendanceAverage = Math.round(
    Math.max(0, Math.min(100, workspace.averageAttendance)),
  );

  const quickActions = [
    {
      title: "Команда",
      description: "Оқушылар мен прогресті бақылау",
      meta: workspace.students.length + " оқушы",
      href: "/mentor/team",
      icon: UsersRound,
    },
    {
      title: "Тапсырмалар",
      description: "Жұмыстарды тексеру және сұраныстар",
      meta: workspace.pendingReviewCount + " жұмыс күтіп тұр",
      href: "/mentor/tasks",
      icon: ClipboardCheck,
    },
    {
      title: "Есептер",
      description: "Оқушылардың күндік есептері",
      meta: reportsToReview + " жаңа есеп",
      href: "/mentor/reports",
      icon: FileText,
    },
    {
      title: "Кездесу",
      description: "Meet және қатысу статистикасы",
      meta: workspace.meetSpaces.length + " Meet кеңістігі",
      href: "/mentor/meet",
      icon: Activity,
    },
  ];

  return (
    <AppShell
      role="MENTOR"
      userName={profile.full_name}
      title="Ментор кабинеті"
      hideHeader
    >
      <PageContainer className="space-y-5 pb-8 pt-5 sm:space-y-6 sm:pt-7">
        <section className="relative overflow-hidden rounded-[26px] border border-[#E8E3DD] bg-gradient-to-br from-white via-white to-[#FFF1E2] p-5 shadow-[0_12px_34px_rgba(23,34,53,.045)] sm:p-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-[#FFDDBB]/35 blur-3xl"
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[.18em] text-[#D96B00]">
                <span className="h-2 w-2 rounded-full bg-[#FF8000]" />
                МЕНТОР КАБИНЕТІ
              </p>
              <h1 className="mt-2 text-[27px] font-extrabold leading-tight tracking-[-.05em] text-[#172235] sm:text-[34px]">
                Бүгінгі жағдай
              </h1>
              <p className="mt-2 max-w-2xl text-[12px] font-medium leading-6 text-[#766E66] sm:text-[13px]">
                Командаңыздың оқу барысын, тапсырмаларын және күнделікті есептерін
                бір жерден бақылаңыз.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex min-h-8 items-center rounded-full border border-[#F0D7C0] bg-white/80 px-3 text-[10px] font-bold text-[#6F665E]">
                  Команда: {workspace.team.name}
                </span>
                {allStudentIssues.length > 0 ? (
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#FFF0EE] px-3 text-[10px] font-extrabold text-[#BF514A]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#BF514A]" />
                    {allStudentIssues.length} назар қажет
                  </span>
                ) : (
                  <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-[#EDF8F2] px-3 text-[10px] font-extrabold text-[#2E7E58]">
                    <CheckCircle2 size={12} />
                    Барлығы бақылауда
                  </span>
                )}
              </div>
            </div>

            <Link
              href="/mentor/team"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-[14px] bg-[#FF8000] px-4 py-3 text-[11px] font-extrabold text-white shadow-[0_10px_24px_rgba(255,128,0,.16)] transition hover:-translate-y-0.5 hover:bg-[#E56F00] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(255,128,0,.18)] sm:self-center"
            >
              Команданы ашу
              <ArrowUpRight size={15} />
            </Link>
          </div>
        </section>

        <section
          aria-label="Команда көрсеткіштері"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
        >
          <MetricCard
            label="ОҚУШЫ"
            value={String(workspace.students.length)}
            hint={workspace.team.name}
            icon={<UsersRound size={18} />}
          />
          <MetricCard
            label="ТЕКСЕРУДІ КҮТЕДІ"
            value={String(workspace.pendingReviewCount)}
            hint="Жаңа тапсырма жұмыстары"
            icon={<ClipboardCheck size={18} />}
          />
          <MetricCard
            label="ЕСЕПТЕР"
            value={String(reportsToReview)}
            hint="Тексеруді қажет етеді"
            icon={<FileText size={18} />}
          />
          <MetricCard
            label="MEET КЕҢІСТІКТЕРІ"
            value={String(workspace.meetSpaces.length)}
            hint="Командаға қосылған"
            icon={<Activity size={18} />}
          />
        </section>

        <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)]">
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                  КҮНДЕЛІКТІ БАҚЫЛАУ
                </p>
                <h2 className="mt-1 text-[17px] font-extrabold tracking-[-.03em] text-[#172235] sm:text-[19px]">
                  Назар аудару керек
                </h2>
                <p className="mt-1 text-[11px] font-medium text-[#948A82]">
                  Мәселе анықталған оқушылар мен келесі әрекеттер
                </p>
              </div>
              <StatusPill
                tone={
                  allStudentIssues.some((item) => item.issue.tone === "red")
                    ? "red"
                    : allStudentIssues.length
                      ? "orange"
                      : "green"
                }
              >
                {allStudentIssues.length ? allStudentIssues.length + " назар" : "Қалыпты"}
              </StatusPill>
            </div>

            {alerts.length ? (
              <div className="divide-y divide-[#F0EBE6]">
                {alerts.map(({ student, issue }) => (
                  <Link
                    key={student.id}
                    href="/mentor/team"
                    className="group flex min-w-0 items-center gap-3.5 px-5 py-4 transition hover:bg-[#FFFCF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FF8000] sm:px-6"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#172235] text-[10px] font-extrabold text-white">
                      {initials(student.full_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-extrabold text-[#243044] sm:text-[13px]">
                        {student.full_name}
                      </span>
                      <span className="mt-1 block break-words text-[10px] font-medium leading-5 text-[#8F857D] sm:text-[11px]">
                        {issue.title} · {issue.detail}
                      </span>
                    </span>
                    <StatusPill tone={issue.tone}>
                      {issue.tone === "red" ? "Шұғыл" : "Назар"}
                    </StatusPill>
                    <ArrowUpRight
                      size={15}
                      className="shrink-0 text-[#B6AEA6] transition group-hover:text-[#FF8000]"
                    />
                  </Link>
                ))}
                {allStudentIssues.length > alerts.length ? (
                  <div className="flex items-center justify-between gap-3 bg-[#FFFCF9] px-5 py-3 sm:px-6">
                    <span className="text-[10px] font-semibold text-[#8F857D]">
                      Тағы {allStudentIssues.length - alerts.length} оқушыға назар аудару қажет
                    </span>
                    <Link
                      href="/mentor/team"
                      className="shrink-0 text-[10px] font-extrabold text-[#D96B00] hover:text-[#B95D00]"
                    >
                      Барлығын көру
                    </Link>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="px-5 py-9 sm:px-6">
                <div className="rounded-[18px] border border-dashed border-[#D7E9DE] bg-[#F7FCF8] px-5 py-7 text-center">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-[13px] bg-[#EAF7F0] text-[#2E7E58]">
                    <CheckCircle2 size={19} />
                  </span>
                  <p className="mt-3 text-[13px] font-extrabold text-[#172235]">
                    Қазір шұғыл назар қажет емес
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-[#7F8C82]">
                    Жаңа тапсырмалар мен есептер түскенде, олар осы жерде көрсетіледі.
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                  ЖЫЛДАМ ӨТУ
                </p>
                <h2 className="mt-1 text-[17px] font-extrabold tracking-[-.03em] text-[#172235] sm:text-[19px]">
                  Жұмыс бөлімдері
                </h2>
                <p className="mt-1 text-[11px] font-medium leading-5 text-[#948A82]">
                  Күнделікті жұмысты бірден жалғастырыңыз
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
              {quickActions.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex min-w-0 items-center gap-3 rounded-[15px] border border-[#EDE6DF] bg-[#FFFCF9] px-3.5 py-3 transition hover:-translate-y-0.5 hover:border-[#F1C8A9] hover:bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[rgba(255,128,0,.12)]"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#FFF1E2] text-[#D96B00] transition group-hover:bg-[#FFE6CF]">
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-extrabold text-[#263247] sm:text-[12px]">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block break-words text-[9px] font-medium leading-4 text-[#948A82]">
                        {item.description}
                      </span>
                      <span className="mt-1 block text-[9px] font-extrabold text-[#B95D00]">
                        {item.meta}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-[#B6AEA6] transition group-hover:text-[#FF8000]"
                    />
                  </Link>
                );
              })}
            </div>
          </Card>
        </section>

        <Card className="p-5 sm:p-6">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                КОМАНДА ПРОГРЕСІ
              </p>
              <h2 className="mt-1 text-[17px] font-extrabold tracking-[-.03em] text-[#172235] sm:text-[19px]">
                Жалпы бақылау көрсеткіштері
              </h2>
            </div>
            <Link
              href="/mentor/team"
              className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#D96B00] hover:text-[#B95D00] sm:mt-0"
            >
              Команда есебі
              <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <ProgressBar
              value={attendanceAverage}
              label="Орташа Meet қатысуы"
              className="min-w-0"
            />
            <ProgressBar
              value={videoAverage}
              label="Бейне сабақтардың орташа прогресі"
              className="min-w-0"
            />
            <ProgressBar
              value={reportCoverage}
              label="Бүгін есеп тапсырған оқушылар"
              className="min-w-0"
            />
          </div>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
