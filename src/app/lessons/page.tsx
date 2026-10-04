import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  FolderOpen,
  LockKeyhole,
  Play,
  Star,
  UserRound,
} from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MARATHON_WEEKS } from "@/lib/marathon";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams?: Promise<{ week?: string; day?: string }>;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: membership }, { data: lessons }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name,role")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("team_members")
        .select("team_id")
        .eq("student_id", user.id)
        .eq("status", "ACTIVE")
        .maybeSingle(),
      supabase
        .from("lessons")
        .select(
          "id,title,description,duration_seconds,required_watch_percent,marathon_day,lesson_order,team_id,starts_at,published",
        )
        .eq("published", true)
        .order("marathon_day")
        .order("lesson_order")
        .limit(200),
    ]);

  const role = profile?.role ?? "STUDENT";
  const teamId = membership?.team_id ?? null;

  const visibleLessons =
    role === "STUDENT"
      ? (lessons ?? []).filter(
          (lesson) => !lesson.team_id || lesson.team_id === teamId,
        )
      : lessons ?? [];

  const params = (await searchParams) ?? {};
  const requestedWeek = Number(params.week ?? 1);
  const activeWeek =
    MARATHON_WEEKS.find((week) => week.week === requestedWeek) ??
    MARATHON_WEEKS[0];

  const weekLessons = visibleLessons.filter((lesson) => {
    const day = Number(lesson.marathon_day ?? 0);
    return day >= activeWeek.startDay && day <= activeWeek.endDay;
  });

  const requestedDay = Number(
    params.day ?? weekLessons[0]?.marathon_day ?? activeWeek.startDay,
  );

  const activeDay =
    requestedDay >= activeWeek.startDay && requestedDay <= activeWeek.endDay
      ? requestedDay
      : activeWeek.startDay;

  const dayLessons = weekLessons.filter(
    (lesson) => Number(lesson.marathon_day) === activeDay,
  );

  const now = Date.now();
  const totalWeekLessons = weekLessons.length;
  const completedEstimate = visibleLessons.filter((lesson) => {
    const lessonDay = Number(lesson.marathon_day ?? 0);
    return lessonDay < activeDay;
  }).length;
  const percent =
    totalWeekLessons > 0
      ? Math.min(100, Math.round((completedEstimate / totalWeekLessons) * 100))
      : 0;

  const dayCount = activeWeek.endDay - activeWeek.startDay + 1;

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Сабақтар"
      hideHeader
    >
      <PageContainer className="max-w-[1460px] pb-8 pt-4">
        <div className="space-y-3">
          <header className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[25px]">
                Сабақтар
              </h1>
              <p className="mt-1 text-[9px] font-semibold text-[#9A9189]">
                {activeWeek.title} · {activeWeek.subtitle}
              </p>
            </div>
            <span className="hidden rounded-full bg-[#FFF1E2] px-3 py-1.5 text-[8px] font-extrabold text-[#B95D00] sm:inline-flex">
              {activeDay}-күн
            </span>
          </header>

          <div className="shrq-lessons-reference">
            <aside className="shrq-lessons-reference-sidebar">
              <div className="shrq-lessons-reference-tools">
                <Link href="/lessons" className="shrq-lessons-tool active" aria-label="Сабақтар">
                  <BookOpen size={15} />
                </Link>
                <Link href="/tasks" className="shrq-lessons-tool" aria-label="Тапсырмалар">
                  <FileText size={15} />
                </Link>
                <Link href="/statistics" className="shrq-lessons-tool" aria-label="Статистика">
                  <Star size={15} />
                </Link>
                <Link href="/profile" className="shrq-lessons-tool" aria-label="Профиль">
                  <UserRound size={15} />
                </Link>
              </div>

              <div className="shrq-lessons-side-section">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold text-[#172235]">Оқу жоспары</span>
                  <ChevronDown size={12} className="text-[#9A9189]" />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1">
                  {MARATHON_WEEKS.map((week) => (
                    <Link
                      key={week.week}
                      href={"/lessons?week=" + week.week}
                      className={[
                        "rounded-[9px] px-2 py-2 text-center text-[8px] font-extrabold transition",
                        activeWeek.week === week.week
                          ? "bg-[#FFF1E2] text-[#B95D00]"
                          : "text-[#7C736B] hover:bg-[#FAF8F5]",
                      ].join(" ")}
                    >
                      {week.week}-АПТА
                    </Link>
                  ))}
                </div>
              </div>

              <div className="shrq-lessons-side-divider" />

              <div className="shrq-lessons-side-section">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-extrabold text-[#172235]">
                    {activeWeek.startDay}–{activeWeek.endDay} күн
                  </span>
                  <span className="text-[8px] font-semibold text-[#A19890]">
                    {dayCount}
                  </span>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {Array.from({ length: dayCount }, (_, index) => activeWeek.startDay + index).map(
                    (day) => {
                      const count = weekLessons.filter(
                        (lesson) => Number(lesson.marathon_day) === day,
                      ).length;
                      const active = day === activeDay;

                      return (
                        <Link
                          key={day}
                          href={"/lessons?week=" + activeWeek.week + "&day=" + day}
                          className={[
                            "group rounded-[10px] border px-2 py-2 text-center transition",
                            active
                              ? "border-[#FFD2A9] bg-[#FFF1E2] text-[#FF8000]"
                              : "border-[#ECE7E2] bg-white text-[#6F665E] hover:border-[#FFD2A9]",
                          ].join(" ")}
                        >
                          <span className="block text-[10px] font-extrabold">
                            {String(day).padStart(2, "0")}
                          </span>
                          <span className="mt-0.5 block text-[7px] font-bold text-[#9A9189]">
                            {count} сабақ
                          </span>
                        </Link>
                      );
                    },
                  )}
                </div>
              </div>

              <div className="shrq-lessons-side-divider" />

              <Link
                href="/tasks"
                className="flex items-center gap-2 rounded-[11px] bg-[#FAF8F5] px-3 py-2.5 text-[9px] font-extrabold text-[#172235] transition hover:bg-[#FFF1E2]"
              >
                <FileText size={13} className="text-[#FF8000]" />
                Тапсырмалар
                <ArrowRight size={12} className="ml-auto text-[#9A9189]" />
              </Link>
            </aside>

            <main className="shrq-lessons-reference-main">
              <div className="shrq-lessons-reference-toolbar">
                <div className="flex items-center gap-2">
                  <FolderOpen size={15} className="text-[#FF8000]" />
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">
                      {activeWeek.week}-АПТА
                    </p>
                    <h2 className="mt-0.5 text-[15px] font-extrabold text-[#172235]">
                      {activeDay}-күн
                    </h2>
                  </div>
                </div>
                <span className="rounded-full bg-[#F4F1EC] px-3 py-1.5 text-[8px] font-extrabold text-[#766E66]">
                  {dayLessons.length} сабақ
                </span>
              </div>

              {dayLessons.length ? (
                <div className="grid gap-2.5">
                  {dayLessons.map((lesson, index) => {
                    const locked =
                      Boolean(lesson.starts_at) &&
                      new Date(lesson.starts_at!).getTime() > now;

                    return (
                      <Card
                        key={lesson.id}
                        className="overflow-hidden border-[#E8E1DA] bg-white p-0 transition hover:border-[#F2C8A8] hover:shadow-[0_8px_22px_rgba(23,34,53,.035)]"
                      >
                        <Link
                          href={locked ? "#" : "/lessons/" + lesson.id}
                          aria-disabled={locked}
                          className={[
                            "flex items-center gap-3 px-4 py-3.5",
                            locked ? "pointer-events-none opacity-60" : "",
                          ].join(" ")}
                        >
                          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#B95D00]">
                            {locked ? (
                              <LockKeyhole size={16} />
                            ) : (
                              <Play size={15} fill="currentColor" />
                            )}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-2">
                              <span className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span
                                className={[
                                  "rounded-full px-2 py-0.5 text-[7px] font-extrabold",
                                  locked
                                    ? "bg-[#F4F1EC] text-[#857B72]"
                                    : "bg-[#EAF7F0] text-[#2E7E58]",
                                ].join(" ")}
                              >
                                {locked ? "Жабық" : "Ашық"}
                              </span>
                            </span>
                            <span className="mt-1 block truncate text-[13px] font-extrabold tracking-[-.025em] text-[#172235]">
                              {lesson.title}
                            </span>
                            <span className="mt-1 block truncate text-[8px] font-medium text-[#8B8179]">
                              {Math.max(
                                1,
                                Math.ceil(Number(lesson.duration_seconds ?? 0) / 60),
                              )}{" "}
                              мин · Теориялық сабақ · {Number(lesson.required_watch_percent ?? 85)}% көру
                            </span>
                          </span>

                          <ArrowRight size={15} className="shrink-0 text-[#FF8000]" />
                        </Link>

                        <div className="flex items-center gap-2 border-t border-[#F0EBE6] bg-[#FFFCF9] px-4 py-2.5">
                          <CheckCircle2 size={12} className="text-[#9A9189]" />
                          <span className="text-[8px] font-semibold text-[#9A9189]">
                            Бейне → тест → тапсырма
                          </span>
                          <span className="ml-auto text-[8px] font-semibold text-[#A19890]">
                            {Number(lesson.lesson_order ?? index + 1)}
                          </span>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-10 text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-[14px] bg-[#FFF1E2] text-[#FF8000]">
                    <BookOpen size={18} />
                  </span>
                  <p className="mt-3 text-[13px] font-extrabold text-[#172235]">
                    Бұл күні сабақ жоқ
                  </p>
                </Card>
              )}
            </main>

            <aside className="shrq-lessons-reference-right">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#FF8000]">
                      БҮГІН
                    </p>
                    <p className="mt-1 text-[15px] font-extrabold text-[#172235]">
                      {activeDay}-күн
                    </p>
                  </div>
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#FFF1E2] text-[#FF8000]">
                    <Bell size={14} />
                  </span>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-bold text-[#9A9189]">Апта прогресі</span>
                    <span className="text-[9px] font-extrabold text-[#172235]">{percent}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#EEE9E3]">
                    <div
                      className="h-full rounded-full bg-[#FF8000]"
                      style={{ width: percent + "%" }}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="rounded-[11px] border border-[#EEE9E3] bg-[#FFFCF9] px-3 py-2.5">
                    <p className="text-[8px] font-semibold text-[#9A9189]">Сабақтар</p>
                    <p className="mt-0.5 text-[15px] font-extrabold text-[#172235]">
                      {dayLessons.length}
                    </p>
                  </div>
                  <div className="rounded-[11px] border border-[#EEE9E3] bg-[#FFFCF9] px-3 py-2.5">
                    <p className="text-[8px] font-semibold text-[#9A9189]">Тест шарты</p>
                    <p className="mt-0.5 text-[11px] font-extrabold text-[#172235]">
                      85%+ видео
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#EAF7F0] text-[#2E7E58]">
                    <CheckCircle2 size={14} />
                  </span>
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#2E7E58]">
                      ЖҮЙЕ
                    </p>
                    <p className="mt-0.5 text-[10px] font-extrabold text-[#172235]">
                      Бейне → тест → тапсырма
                    </p>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
