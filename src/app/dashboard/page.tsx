import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bell,
  Clock3,
  Flame,
  ListChecks,
  Trophy,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { calculateCurrentStreak, getSubmittedReportDates, todayInTimezone } from "@/lib/streak";
import { MARATHON_WEEKS } from "@/lib/marathon";
import { DashboardBanner } from "@/components/student/DashboardBanner";

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

  const [
    { data: banners },
    { data: reports },
    { data: scores },
    { data: membership },
    { data: tasks },
    { data: submissions },
    { data: lessons },
    { data: tickets },
  ] = await Promise.all([
    supabase
      .from("marathon_banners")
      .select("id,title,description,image_path,href")
      .eq("published", true)
      .order("sort_order")
      .limit(8),
    supabase
      .from("daily_reports")
      .select("report_date,status,study_minutes,completed_task_count")
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
    supabase
      .from("lessons")
      .select("id,title,starts_at")
      .eq("published", true)
      .not("starts_at", "is", null)
      .order("starts_at")
      .limit(40),
    supabase
      .from("support_tickets")
      .select("id,subject,status,updated_at")
      .eq("student_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(4),
  ]);

  const admin = createAdminSupabaseClient();
  const bannerItems = (banners ?? []).map((banner) => ({
    id: banner.id,
    title: banner.title,
    description: banner.description,
    href: banner.href,
    imageUrl: banner.image_path
      ? admin.storage.from("banners").getPublicUrl(banner.image_path).data.publicUrl
      : null,
  }));

  const today = todayInTimezone("Asia/Almaty");
  const now = new Date();
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
  const todayReport = (reports ?? []).find((report) => report.report_date === today);
  const studyMinutes = Math.max(0, Number(todayReport?.study_minutes ?? 0));
  const completedToday = Math.max(0, Number(todayReport?.completed_task_count ?? 0));

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

  const openTodayTasks = todayTasks.filter((task) => !submittedTaskIds.has(task.id));
  const taskCount = openTodayTasks.length || todayTasks.length;

  const nextDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const notifications: Array<{ id: string; title: string; message: string; href: string }> = [];

  for (const task of tasks ?? []) {
    if (task.starts_at) {
      const start = new Date(task.starts_at);
      if (start >= now && start <= nextDay) {
        notifications.push({
          id: "task-open-" + task.id,
          title: "Тапсырма ашылады",
          message: task.title,
          href: "/tasks/" + task.id,
        });
      }
    }
    if (task.deadline) {
      const deadline = new Date(task.deadline);
      if (deadline >= now && deadline <= nextDay) {
        notifications.push({
          id: "task-deadline-" + task.id,
          title: "Deadline жақындады",
          message: task.title,
          href: "/tasks/" + task.id,
        });
      }
    }
  }

  for (const lesson of lessons ?? []) {
    const start = new Date(lesson.starts_at!);
    if (start >= now && start <= nextDay) {
      notifications.push({
        id: "lesson-open-" + lesson.id,
        title: "Сабақ ашылады",
        message: lesson.title,
        href: "/lessons/" + lesson.id,
      });
    }
  }

  for (const ticket of tickets ?? []) {
    notifications.push({
      id: "support-" + ticket.id,
      title: "Қолдау жаңартуы",
      message: ticket.subject,
      href: "/settings",
    });
  }

  const visibleNotifications = notifications.slice(0, 3);
  const firstName = profile?.full_name?.split(" ")[0] ?? "досым";

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Басты бет"
      hideHeader
    >
      <PageContainer className="max-w-[1380px] pb-5 lg:pb-6">
        <div className="space-y-5">
          <section className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">
                SHYRAQ
              </p>
              <h1 className="mt-1 text-[27px] font-extrabold leading-none tracking-[-.05em] text-[#172235] sm:text-[32px]">
                Сәлем, {firstName}.
              </h1>
            </div>
            <Link
              href="/tasks"
              className="hidden h-9 items-center justify-center gap-2 rounded-[11px] border border-[#E7E0D8] bg-white px-3.5 text-[9px] font-extrabold text-[#172235] shadow-[0_6px_18px_rgba(23,34,53,.03)] transition hover:border-[#FFD1A8] sm:inline-flex"
            >
              Тапсырмалар
              <ArrowUpRight size={13} className="text-[#FF8000]" />
            </Link>
          </section>

          <DashboardBanner banners={bannerItems} />

          <section className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-4">
              <section>
                <div className="mb-2.5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                      МАРАФОН
                    </p>
                    <h2 className="mt-1 text-[20px] font-extrabold tracking-[-.045em] text-[#172235]">
                      Шырақ марафоны
                    </h2>
                  </div>
                  <Link
                    href="/lessons"
                    className="text-[9px] font-extrabold text-[#FF8000] hover:underline"
                  >
                    Сабақтар →
                  </Link>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {MARATHON_WEEKS.map((week) => (
                    <Link
                      key={week.week}
                      href={"/marathon/week/" + week.week}
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
                        <h3 className="mt-1 text-[17px] font-extrabold tracking-[-.035em] text-[#172235]">
                          {week.subtitle}
                        </h3>
                        <p className="mt-2 text-[9px] font-medium leading-4 text-[#8B8179]">
                          Сабақ · тест · тапсырма
                        </p>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>

              {meetSpaceMarkup()}
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
                  <MiniStat icon={<Flame size={13} />} label="Қатарынан" value={streak + " күн"} />
                  <MiniStat icon={<Trophy size={13} />} label="Ұпай" value={String(score)} />
                  <MiniStat icon={<UsersRound size={13} />} label="Команда" value={team ? String(team.name) : "Күтілуде"} />
                </div>
              </Card>

              <Card className="p-4">
                <p className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                  STUDY TIME
                </p>
                <div className="mt-2 flex items-end justify-between gap-2">
                  <p className="text-[24px] font-extrabold tracking-[-.05em] text-[#172235]">
                    {studyMinutes >= 60
                      ? Math.floor(studyMinutes / 60) + " сағ " + (studyMinutes % 60) + " мин"
                      : studyMinutes + " мин"}
                  </p>
                  <Clock3 size={16} className="mb-1 text-[#FF8000]" />
                </div>
                <p className="mt-1 text-[9px] font-medium text-[#9A9189]">Бүгінгі оқу уақыты</p>
              </Card>

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
                  className="mt-2.5 inline-flex items-center gap-1 text-[9px] font-extrabold text-[#FF8000] hover:underline"
                >
                  Барлығын көру <ArrowRight size={12} />
                </Link>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                      ХАБАРЛАНДЫРУ
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold tracking-[-.03em] text-[#172235]">
                      Соңғысы
                    </p>
                  </div>
                  <Bell size={15} className="text-[#FF8000]" />
                </div>
                <div className="mt-2 divide-y divide-[#F0EBE6]">
                  {visibleNotifications.length ? (
                    visibleNotifications.map((item) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        className="block py-2.5 transition hover:bg-[#FFFCF9]"
                      >
                        <p className="truncate text-[9px] font-extrabold text-[#172235]">
                          {item.title}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-[8px] font-medium text-[#9A9189]">
                          {item.message}
                        </p>
                      </Link>
                    ))
                  ) : (
                    <p className="py-4 text-center text-[9px] font-semibold text-[#9A9189]">
                      Жаңа хабарландыру жоқ.
                    </p>
                  )}
                </div>
              </Card>
            </aside>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );

  function meetSpaceMarkup() {
    const teamId = membership?.team_id ?? null;
    return teamId ? (
      <MeetBlock supabase={supabase} teamId={teamId} />
    ) : null;
  }
}

async function MeetBlock({
  supabase,
  teamId,
}: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>;
  teamId: string;
}) {
  const { data: meetSpace } = await supabase
    .from("meet_spaces")
    .select("meeting_url,display_name,active")
    .eq("team_id", teamId)
    .eq("active", true)
    .maybeSingle();

  if (!meetSpace?.meeting_url) return null;

  return (
    <section className="flex flex-col gap-3 rounded-[16px] border border-[#E8E1DA] bg-white px-4 py-3.5 shadow-[0_8px_22px_rgba(23,34,53,.025)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#EAF7F0] text-[#2E7E58]">
          <Clock3 size={14} />
        </span>
        <div className="min-w-0">
          <p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-[#2E7E58]">
            БЕЙНЕ КЕЗДЕСУ
          </p>
          <p className="mt-0.5 truncate text-[12px] font-extrabold text-[#172235]">
            {meetSpace.display_name || "Meet – STUDY STREAM"}
          </p>
        </div>
      </div>
      <a
        href={meetSpace.meeting_url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-[#FF8000] px-4 text-[9px] font-extrabold text-white transition hover:bg-[#E56F00]"
      >
        Кездесуге кіру
        <ArrowUpRight size={13} />
      </a>
    </section>
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
