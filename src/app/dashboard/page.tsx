import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Video,
  Flame,
  Trophy,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { MARATHON_WEEKS, marathonDayFromDate } from "@/lib/marathon";
import { calculateCurrentStreak, getSubmittedReportDates, todayInTimezone } from "@/lib/streak";
import { DashboardBanner } from "@/components/student/DashboardBanner";
import { StudyTimeCard } from "@/components/student/StudyTimeCard";

function currentTimestampMs() {
  return Date.now();
}

function kzDateKey(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "STUDENT";

  if (role === "MENTOR") redirect("/mentor");
  if (role === "CHIEF_MENTOR") redirect("/chief-mentor");
  if (role === "LEADER") redirect("/leader");

  const admin = createAdminSupabaseClient();

  const [
    { data: banners },
    { data: reports },
    { data: scores },
    { data: membership },
    { data: tasks },
    { data: submissions },
  ] = await Promise.all([
    admin
      .from("marathon_banners")
      .select("id,title,description,image_path,href,published,starts_at,ends_at,sort_order")
      .eq("published", true)
      .order("sort_order")
      .limit(8),
    supabase
      .from("daily_reports")
      .select("report_date,report_type,status,completed_task_count")
      .eq("student_id", user.id)
      .order("report_date", { ascending: false })
      .limit(370),
    supabase.from("score_events").select("points").eq("student_id", user.id),
    supabase
      .from("team_members")
      .select("team_id,teams(name)")
      .eq("student_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id,title,starts_at,deadline,active")
      .eq("active", true)
      .order("deadline")
      .limit(50),
    supabase
      .from("task_submissions")
      .select("task_id,status,submitted_at")
      .eq("student_id", user.id)
      .limit(100),
  ]);

  const teamIdFromMembership = membership?.team_id ?? null;

  const [{ data: meetSpace }, { data: attendance }, { data: marathonStartRow }, { data: reportSettings }] =
    await Promise.all([
      teamIdFromMembership
        ? supabase
            .from("meet_spaces")
            .select("meeting_url,display_name,active")
            .eq("team_id", teamIdFromMembership)
            .eq("active", true)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("attendance_records")
        .select("attended_seconds,started_at,ended_at,attendance_percent,status")
        .eq("student_id", user.id)
        .order("started_at", { ascending: false })
        .limit(20),
      supabase
        .from("tasks")
        .select("starts_at")
        .eq("marathon_day", 1)
        .not("starts_at", "is", null)
        .order("starts_at", { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("marathon_settings")
        .select("morning_report_open_time,evening_report_open_time")
        .eq("id", true)
        .maybeSingle(),
    ]);

  const bannerItems = (
    await Promise.all(
      (banners ?? [])
        .filter((banner) => {
          const now = currentTimestampMs();
          const startsOk = !banner.starts_at || new Date(banner.starts_at).getTime() <= now;
          const endsOk = !banner.ends_at || new Date(banner.ends_at).getTime() >= now;
          return startsOk && endsOk;
        })
        .map(async (banner) => {
          let imageUrl: string | null = null;

          if (banner.image_path) {
            const { data } = await admin.storage
              .from("banners")
              .createSignedUrl(banner.image_path, 60 * 60);
            imageUrl = data?.signedUrl ?? null;
          }

          return {
            id: banner.id,
            title: banner.title,
            description: banner.description,
            href: banner.href,
            imageUrl,
          };
        }),
    )
  ).filter((banner) => Boolean(banner.imageUrl));

  const today = todayInTimezone("Asia/Almaty");
  const streak = calculateCurrentStreak(
    getSubmittedReportDates(reports ?? []),
    today,
  );
  const score = (scores ?? []).reduce(
    (sum, item) => sum + Number(item.points ?? 0),
    0,
  );
  const team = Array.isArray(membership?.teams)
    ? membership.teams[0]
    : membership?.teams;
  const teamId = membership?.team_id ?? null;
  const submittedTaskIds = new Set(
    (submissions ?? [])
      .filter((item) => ["SUBMITTED", "REVIEWED"].includes(String(item.status)))
      .map((item) => item.task_id),
  );

  const todayTasks = (tasks ?? []).filter((task) => {
    const startsToday = task.starts_at && kzDateKey(task.starts_at) === today;
    const deadlineToday = task.deadline && kzDateKey(task.deadline) === today;
    return Boolean(startsToday || deadlineToday);
  });

  const completedToday = todayTasks.filter((task) =>
    submittedTaskIds.has(task.id),
  ).length;
  const taskCount = todayTasks.length;

  const meeting = meetSpace as
    | { data: { meeting_url: string; display_name: string | null; active: boolean } | null }
    | null
    | undefined;
  const meetingData = meeting?.data ?? null;

  const marathonStart = marathonStartRow?.starts_at ?? null;
  const marathonDay = marathonStart
    ? marathonDayFromDate(today, marathonStart)
    : null;

  const attendanceRows = attendance ?? [];
  const classifyAttendance = (row: {
    attended_seconds: number | null;
    started_at: string | null;
    ended_at: string | null;
  }) => {
    const stamp = row.started_at ?? row.ended_at;
    if (!stamp) return null;
    const hour = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Almaty",
        hour: "2-digit",
        hour12: false,
      }).format(new Date(stamp)),
    );
    const dateKey = kzDateKey(stamp);
    if (dateKey !== today) return null;
    return hour < 14 ? "MORNING" : "EVENING";
  };

  const morningMinutes = Math.round(
    attendanceRows
      .filter((row) => classifyAttendance(row) === "MORNING")
      .reduce((sum, row) => sum + Number(row.attended_seconds ?? 0), 0) / 60,
  );

  const eveningMinutes = Math.round(
    attendanceRows
      .filter((row) => classifyAttendance(row) === "EVENING")
      .reduce((sum, row) => sum + Number(row.attended_seconds ?? 0), 0) / 60,
  );

  const todayReports = (reports ?? [])
    .filter((report) => report.report_date === today)
    .map((report) => ({
      report_type: report.report_type as "MORNING" | "EVENING",
      status: String(report.status ?? ""),
    }));

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Басты бет"
      hideHeader
    >
      <PageContainer className="max-w-[1380px] pb-5 lg:pb-6">
        <div className="space-y-5">
          <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-4">
              <DashboardBanner banners={bannerItems} />
              <div className="mb-2.5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                    МАРАФОН
                  </p>
                  <h1 className="mt-1 text-[20px] font-extrabold tracking-[-.045em] text-[#172235]">
                    Шырақ марафоны
                  </h1>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                {MARATHON_WEEKS.map((week) => (
                  <Link
                    key={week.week}
                    href={"/lessons?week=" + week.week}
                    className="group min-w-0"
                  >
                    <Card className="h-full p-4 transition duration-200 group-hover:-translate-y-0.5 group-hover:border-[#F3C7B0]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#FFF1E2] text-[9px] font-extrabold text-[#B95D00]">
                          {String(week.week).padStart(2, "0")}
                        </span>
                        <ArrowUpRight
                          size={14}
                          className="text-[#B6AEA6] transition group-hover:text-[#FF8000]"
                        />
                      </div>
                      <p className="mt-3 text-[8px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">
                        21 КҮН
                      </p>
                      <h2 className="mt-1 text-[17px] font-extrabold tracking-[-.035em] text-[#172235]">
                        {week.subtitle}
                      </h2>
                      <p className="mt-2 text-[9px] font-medium leading-4 text-[#8B8179]">
                        Сабақ · тест · тапсырма
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>

              <StudyTimeCard
                meetingUrl={meetingData?.meeting_url ?? null}
                meetingName={meetingData?.display_name ?? "Google Meet"}
                today={today}
                marathonDay={marathonDay}
                morningMinutes={morningMinutes}
                eveningMinutes={eveningMinutes}
                reports={todayReports}
                completedTaskCount={completedToday}
                morningReportOpenTime={reportSettings?.morning_report_open_time ?? "08:00"}
                eveningReportOpenTime={reportSettings?.evening_report_open_time ?? "19:00"}
              />
            </div>

            <aside className="grid gap-3 xl:sticky xl:top-[72px]">
              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                      ПРОГРЕСС
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold tracking-[-.03em] text-[#172235]">
                      Нәтижең
                    </p>
                  </div>
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#FFF1E2] text-[#FF8000]">
                    <Trophy size={14} />
                  </span>
                </div>
                <div className="mt-3 grid gap-2">
                  <MiniStat
                    icon={<Flame size={13} />}
                    label="Қатарынан"
                    value={streak + " күн"}
                  />
                  <MiniStat
                    icon={<Trophy size={13} />}
                    label="Ұпай"
                    value={String(score)}
                  />
                  <MiniStat
                    icon={<UsersRound size={13} />}
                    label="Команда"
                    value={team ? String(team.name) : "Күтілуде"}
                  />
                </div>
              </Card>

              {meetingData?.meeting_url ? (
                <Card className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                        БЕЙНЕ КЕЗДЕСУ
                      </p>
                      <p className="mt-1 text-[15px] font-extrabold tracking-[-.03em] text-[#172235]">
                        {meetingData.display_name || "Meet – STUDY STREAM"}
                      </p>
                    </div>
                    <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#EAF7F0] text-[#2E7E58]">
                      <Video size={14} />
                    </span>
                  </div>
                  <p className="mt-2 text-[9px] leading-4 text-[#8B8179]">
                    Командаңның онлайн сабағына қосыл.
                  </p>
                  <a
                    href={meetingData.meeting_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex h-8 w-full items-center justify-center gap-2 rounded-[10px] bg-[#FF8000] px-3 text-[9px] font-semibold text-white transition hover:bg-[#E56F00]"
                  >
                    Кездесуге кіру
                    <ArrowUpRight size={12} />
                  </a>
                </Card>
              ) : null}

              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                      БҮГІН
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold tracking-[-.03em] text-[#172235]">
                      Тапсырмалар
                    </p>
                  </div>
                  <span className="text-[24px] font-extrabold tracking-[-.05em] text-[#172235]">
                    {taskCount}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between rounded-[11px] bg-[#FFFCF9] px-3 py-2.5">
                  <span className="text-[9px] font-semibold text-[#8B8179]">
                    Орындалды
                  </span>
                  <span className="text-[10px] font-extrabold text-[#2E7E58]">
                    {completedToday}
                  </span>
                </div>
                <Link
                  href="/tasks"
                  className="mt-2.5 inline-flex items-center gap-1 text-[9px] font-semibold text-[#FF8000] hover:underline"
                >
                  Барлығын көру <ArrowRight size={12} />
                </Link>
              </Card>
            </aside>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-[11px] bg-[#FFFCF9] px-2.5 py-2.5">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[#FFF1E2] text-[#FF8000]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[8px] font-semibold text-[#9A9189]">{label}</p>
        <p className="truncate text-[10px] font-extrabold text-[#172235]">{value}</p>
      </div>
    </div>
  );
}
