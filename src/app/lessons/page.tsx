import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
  Clock3,
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

  const availableDays = Array.from(
    new Set(
      weekLessons
        .map((lesson) => Number(lesson.marathon_day))
        .filter(
          (day) =>
            day >= activeWeek.startDay && day <= activeWeek.endDay,
        ),
    ),
  ).sort((a, b) => a - b);

  const requestedDay = Number(params.day ?? availableDays[0] ?? activeWeek.startDay);
  const activeDay =
    availableDays.includes(requestedDay) || !weekLessons.length
      ? requestedDay
      : availableDays[0] ?? activeWeek.startDay;

  const dayLessons = weekLessons.filter(
    (lesson) => Number(lesson.marathon_day) === activeDay,
  );

  const now = Date.now();

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Сабақтар"
      description="Аптаны таңда → күнді таңда → сол күннің сабақтарын орында."
    >
      <PageContainer className="pb-8">
        <div className="space-y-4">
          <header>
            <p className="text-[9px] font-extrabold uppercase tracking-[.17em] text-[#FF8000]">
              ОҚУ
            </p>
            <h1 className="mt-1 text-[24px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[28px]">
              Сабақтар
            </h1>
            <p className="mt-1.5 max-w-2xl text-[11px] font-medium leading-5 text-[#857B72]">
              Әр апта бөлек. Әр күннің ішінде тек сол күнге тиесілі сабақтар көрсетіледі.
            </p>
          </header>

          <Card className="p-2.5">
            <div className="grid gap-2 md:grid-cols-3">
              {MARATHON_WEEKS.map((week) => (
                <Link
                  key={week.week}
                  href={"/lessons?week=" + week.week}
                  className={[
                    "rounded-[13px] border px-4 py-3.5 transition",
                    activeWeek.week === week.week
                      ? "border-[#FFD5AD] bg-[#FFF1E2] text-[#B95D00]"
                      : "border-transparent bg-[#FAF8F5] text-[#6F665E] hover:border-[#E8E1DA] hover:bg-white hover:text-[#172235]",
                  ].join(" ")}
                >
                  <span className="block text-[9px] font-extrabold uppercase tracking-[.12em]">
                    {week.week}-АПТА
                  </span>
                  <span className="mt-1 block text-[14px] font-extrabold tracking-[-.02em]">
                    {week.subtitle.replace(" · ", " • ")}
                  </span>
                </Link>
              ))}
            </div>
          </Card>

          {!visibleLessons.length ? (
            <EmptyState title="Әзірге жарияланған сабақ жоқ." />
          ) : (
            <section className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <Card className="h-fit overflow-hidden p-2">
                <div className="border-b border-[#EFE8E1] px-3 py-3">
                  <p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#FF8000]">
                    {activeWeek.title}
                  </p>
                  <p className="mt-1 text-[14px] font-extrabold text-[#172235]">
                    Күндер
                  </p>
                </div>

                <div className="space-y-1.5 p-1.5">
                  {Array.from(
                    { length: activeWeek.endDay - activeWeek.startDay + 1 },
                    (_, index) => activeWeek.startDay + index,
                  ).map((day) => {
                    const count = weekLessons.filter(
                      (lesson) => Number(lesson.marathon_day) === day,
                    ).length;
                    const active = day === activeDay;

                    return (
                      <Link
                        key={day}
                        href={"/lessons?week=" + activeWeek.week + "&day=" + day}
                        className={[
                          "flex items-center justify-between rounded-[11px] px-3 py-2.5 transition",
                          active
                            ? "bg-[#FFF1E2] text-[#B95D00]"
                            : "text-[#6F665E] hover:bg-[#FAF8F5] hover:text-[#172235]",
                        ].join(" ")}
                      >
                        <span className="flex items-center gap-2">
                          <CalendarDays size={14} />
                          <span className="text-[10px] font-extrabold">
                            {day}-күн
                          </span>
                        </span>
                        <span
                          className={[
                            "min-w-5 rounded-full px-1.5 py-0.5 text-center text-[8px] font-extrabold",
                            active
                              ? "bg-white text-[#B95D00]"
                              : "bg-[#F4F1EC] text-[#9A9189]",
                          ].join(" ")}
                        >
                          {count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </Card>

              <div className="min-w-0">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">
                      {activeWeek.week}-АПТА
                    </p>
                    <h2 className="mt-1 text-[20px] font-extrabold tracking-[-.04em] text-[#172235]">
                      {activeDay}-күннің сабақтары
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#F4F1EC] px-3 py-1.5 text-[9px] font-extrabold text-[#766E66]">
                    {dayLessons.length} сабақ
                  </span>
                </div>

                {!dayLessons.length ? (
                  <Card className="p-8">
                    <div className="mx-auto max-w-sm text-center">
                      <span className="mx-auto grid h-11 w-11 place-items-center rounded-[14px] bg-[#FFF1E2] text-[#FF8000]">
                        <BookOpen size={18} />
                      </span>
                      <p className="mt-3 text-[13px] font-extrabold text-[#172235]">
                        Бұл күні сабақ жоқ.
                      </p>
                      <p className="mt-1 text-[10px] leading-5 text-[#8B8179]">
                        Сол аптаның басқа күнін таңдаңыз.
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-2.5">
                    {dayLessons.map((lesson, index) => {
                      const locked =
                        Boolean(lesson.starts_at) &&
                        new Date(lesson.starts_at!).getTime() > now;

                      return (
                        <Card
                          key={lesson.id}
                          className="overflow-hidden p-0 transition hover:border-[#F2C8A8]"
                        >
                          <Link
                            href={locked ? "#" : "/lessons/" + lesson.id}
                            aria-disabled={locked}
                            className={[
                              "flex items-center gap-3 px-4 py-3.5 sm:px-5",
                              locked ? "pointer-events-none opacity-65" : "",
                            ].join(" ")}
                          >
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#FFF1E2] text-[#B95D00]">
                              {locked ? (
                                <LockKeyhole size={16} />
                              ) : (
                                <BookOpen size={16} />
                              )}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-[8px] font-extrabold uppercase tracking-[.13em] text-[#9A9189]">
                                  {String(index + 1).padStart(2, "0")} • {activeDay}-КҮН
                                </span>
                                {locked ? (
                                  <span className="rounded-full bg-[#F4F1EC] px-2 py-1 text-[8px] font-extrabold text-[#857B72]">
                                    Жабық
                                  </span>
                                ) : (
                                  <span className="rounded-full bg-[#EAF7F0] px-2 py-1 text-[8px] font-extrabold text-[#2E7E58]">
                                    Ашық
                                  </span>
                                )}
                              </span>

                              <span className="mt-1 block truncate text-[13px] font-extrabold tracking-[-.02em] text-[#172235]">
                                {lesson.title}
                              </span>

                              <span className="mt-1 flex flex-wrap items-center gap-2 text-[9px] font-medium text-[#8B8179]">
                                <span>
                                  {Math.max(1, Math.ceil(Number(lesson.duration_seconds ?? 0) / 60))} мин
                                </span>
                                <span>•</span>
                                <span>
                                  Тестке өту үшін {Number(lesson.required_watch_percent ?? 85)}% көру керек
                                </span>
                              </span>
                            </span>

                            {locked ? (
                              <LockKeyhole size={15} className="shrink-0 text-[#AAA097]" />
                            ) : (
                              <ArrowRight size={16} className="shrink-0 text-[#FF8000]" />
                            )}
                          </Link>

                          <div className="flex items-center gap-2 border-t border-[#F0EBE6] bg-[#FFFCF9] px-4 py-2.5 sm:px-5">
                            <CheckCircle2 size={13} className="text-[#9A9189]" />
                            <span className="text-[8px] font-semibold text-[#9A9189]">
                              Бейне → тест → тапсырма
                            </span>
                            <span className="ml-auto inline-flex items-center gap-1 text-[8px] font-semibold text-[#9A9189]">
                              <Clock3 size={11} />
                              {Number(lesson.lesson_order ?? index + 1)}
                            </span>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
