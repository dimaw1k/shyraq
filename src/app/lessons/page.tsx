import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  LockKeyhole,
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
    new Set(weekLessons.map((lesson) => Number(lesson.marathon_day))),
  )
    .filter(
      (day) => day >= activeWeek.startDay && day <= activeWeek.endDay,
    )
    .sort((a, b) => a - b);

  const requestedDay = Number(
    params.day ?? availableDays[0] ?? activeWeek.startDay,
  );

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
      hideHeader
    >
      <PageContainer className="max-w-[1380px] pb-8 pt-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-extrabold tracking-[-.05em] text-[#172235]">
              Сабақтар
            </h1>
            <span className="rounded-full bg-[#FFF1E2] px-3 py-1.5 text-[9px] font-extrabold text-[#B95D00]">
              {activeWeek.subtitle}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {MARATHON_WEEKS.map((week) => (
              <Link
                key={week.week}
                href={"/lessons?week=" + week.week}
                className="group min-w-0"
              >
                <Card
                  className={[
                    "h-full p-4 transition duration-200",
                    activeWeek.week === week.week
                      ? "border-[#F3C7B0] bg-[#FFFDFB]"
                      : "hover:-translate-y-0.5 hover:border-[#F3C7B0]",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#FFF1E2] text-[9px] font-extrabold text-[#B95D00]">
                      {String(week.week).padStart(2, "0")}
                    </span>
                    <ArrowRight
                      size={14}
                      className={[
                        "transition",
                        activeWeek.week === week.week
                          ? "text-[#FF8000]"
                          : "text-[#B6AEA6] group-hover:text-[#FF8000]",
                      ].join(" ")}
                    />
                  </div>
                  <p className="mt-3 text-[8px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">
                    21 КҮН
                  </p>
                  <h2 className="mt-1 text-[16px] font-extrabold tracking-[-.03em] text-[#172235]">
                    {week.subtitle}
                  </h2>
                </Card>
              </Link>
            ))}
          </div>

          {!visibleLessons.length ? (
            <EmptyState title="Әзірге жарияланған сабақ жоқ." />
          ) : (
            <section className="shrq-lessons-layout">
              <div className="flex flex-col items-center gap-1.5 pt-1">
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
                      aria-label={day + "-күн, " + count + " сабақ"}
                      className={[
                        "group grid h-10 w-10 place-items-center rounded-[10px] border text-center transition",
                        active
                          ? "border-[#FF8000] bg-[#FFF1E2] text-[#FF8000] shadow-[0_4px_12px_rgba(255,128,0,.10)]"
                          : "border-[#E6E0D9] bg-transparent text-[#172235] hover:border-[#FFB366] hover:bg-[#FFF9F4] hover:text-[#FF8000]",
                      ].join(" ")}
                    >
                      <span className="text-[10px] font-extrabold leading-none">
                        {String(day).padStart(2, "0")}
                      </span>
                    </Link>
                  );
                })}
              </div>

                            <div className="min-w-0">
                <div className="mb-3 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#FF8000]">
                      {activeWeek.week}-АПТА
                    </p>
                    <h2 className="mt-1 text-[20px] font-extrabold tracking-[-.04em] text-[#172235]">
                      {activeDay}-күн
                    </h2>
                  </div>
                  <span className="rounded-full bg-[#F4F1EC] px-3 py-1.5 text-[8px] font-extrabold text-[#766E66]">
                    {dayLessons.length} сабақ
                  </span>
                </div>

                {!dayLessons.length ? (
                  <Card className="p-8 text-center">
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-[14px] bg-[#FFF1E2] text-[#FF8000]">
                      <BookOpen size={18} />
                    </span>
                    <p className="mt-3 text-[13px] font-extrabold text-[#172235]">
                      Бұл күні сабақ жоқ
                    </p>
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
                              locked ? "pointer-events-none opacity-60" : "",
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
                              <span className="flex items-center gap-2">
                                <span className="text-[8px] font-extrabold uppercase tracking-[.13em] text-[#9A9189]">
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

                              <span className="mt-1 block truncate text-[13px] font-extrabold tracking-[-.02em] text-[#172235]">
                                {lesson.title}
                              </span>

                              <span className="mt-1 block text-[9px] font-medium text-[#8B8179]">
                                {Math.max(
                                  1,
                                  Math.ceil(Number(lesson.duration_seconds ?? 0) / 60),
                                )}{" "}
                                мин · {Number(lesson.required_watch_percent ?? 85)}% көру
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
