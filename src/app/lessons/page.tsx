import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
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

  const [{ data: profile }, { data: membership }, { data: lessons }, { data: tasks }, { data: submissions }] =
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
      supabase
        .from("tasks")
        .select(
          "id,title,description,instructions,deadline,starts_at,points,marathon_day,task_order,team_id,active",
        )
        .eq("active", true)
        .order("marathon_day")
        .order("task_order")
        .limit(300),
      supabase
        .from("task_submissions")
        .select("task_id,status,submitted_late,submitted_at")
        .eq("student_id", user.id),
    ]);

  const role = profile?.role ?? "STUDENT";
  const teamId = membership?.team_id ?? null;
  const visibleLessons =
    role === "STUDENT"
      ? (lessons ?? []).filter(
          (lesson) => !lesson.team_id || lesson.team_id === teamId,
        )
      : lessons ?? [];

  const visibleTasks =
    role === "STUDENT"
      ? (tasks ?? []).filter(
          (task) => !task.team_id || task.team_id === teamId,
        )
      : tasks ?? [];

  const submissionMap = new Map(
    (submissions ?? []).map((submission) => [submission.task_id, submission]),
  );

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

  const dayTasks = visibleTasks.filter(
    (task) => Number(task.marathon_day) === activeDay,
  );

  const now = Date.now();

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Сабақтар"
      hideHeader
    >
      <PageContainer className="max-w-[1380px] pb-8 pt-4">
        <div className="space-y-3.5">
          <div className="flex items-center justify-between">
            <h1 className="text-[24px] font-extrabold tracking-[-.05em] text-[#172235]">
              Сабақтар
            </h1>

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
                  <h2 className="mt-3 text-center text-[16px] font-extrabold tracking-[-.03em] text-[#172235]">
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
              <aside className="shrq-day-rail" aria-label="Күндер">
                <div className="shrq-day-rail-label">КҮН</div>
                <div className="shrq-day-selector">
                  {Array.from(
                    { length: activeWeek.endDay - activeWeek.startDay + 1 },
                    (_, index) => activeWeek.startDay + index,
                  ).map((day) => {
                    const active = day === activeDay;

                    return (
                      <Link
                        key={day}
                        href={"/lessons?week=" + activeWeek.week + "&day=" + day}
                        aria-label={day + "-күн"}
                        aria-current={active ? "page" : undefined}
                        className={[
                          "shrq-day-tile",
                          active ? "is-active" : "",
                        ].join(" ")}
                      >
                        <span>{String(day).padStart(2, "0")}</span>
                      </Link>
                    );
                  })}
                </div>
              </aside>

              <div className="min-w-0">
                <div className="mb-2.5">
                  <h2 className="mt-0.5 text-[21px] font-extrabold tracking-[-.045em] text-[#172235]">
                    {activeDay}-күн
                  </h2>
                </div>

                <div className="shrq-lessons-day-columns">
                  <section className="min-w-0">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#172235]">
                        БЕЙНЕ САБАҚТАР
                      </p>
                      <span className="text-[8px] font-bold text-[#9A9189]">
                        {dayLessons.length}
                      </span>
                    </div>

                    {!dayLessons.length ? (
                      <Card className="p-7 text-center">
                        <BookOpen size={18} className="mx-auto text-[#B5ABA2]" />
                        <p className="mt-2 text-[11px] font-extrabold text-[#172235]">
                          Бұл күнге сабақ жоқ
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
                              className="shrq-day-item-card overflow-hidden border-[#E6E0D9] bg-white p-0 transition duration-200 hover:-translate-y-0.5 hover:border-[#F2C8A8] hover:shadow-[0_10px_24px_rgba(23,34,53,.045)]"
                            >
                              <Link
                                href={locked ? "#" : "/lessons/" + lesson.id}
                                aria-disabled={locked}
                                className={[
                                  "flex min-h-[82px] items-start gap-3 px-3.5 py-3.5",
                                  locked ? "pointer-events-none opacity-60" : "",
                                ].join(" ")}
                              >
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#FFF1E2] text-[#B95D00] mt-0.5">
                                  {locked ? <LockKeyhole size={15} /> : <BookOpen size={15} />}
                                </span>

                                <span className="min-w-0 flex-1 pt-0.5">
                                  <span className="flex h-4 items-center gap-2">
                                    <span className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#A19890]">
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

                                  <span className="mt-1.5 block truncate text-[12px] font-extrabold leading-[1.25] tracking-[-.02em] text-[#172235]">
                                    {lesson.title}
                                  </span>

                                  <span className="mt-1 block truncate text-[8px] font-medium leading-4 text-[#8B8179]">
                                    {Math.max(
                                      1,
                                      Math.ceil(Number(lesson.duration_seconds ?? 0) / 60),
                                    )}{" "}
                                    мин · {Number(lesson.required_watch_percent ?? 85)}% көру
                                  </span>
                                </span>

                                {locked ? (
                                  <LockKeyhole size={14} className="shrink-0 text-[#B0A79F]" />
                                ) : (
                                  <ArrowRight size={15} className="shrink-0 text-[#FF8000]" />
                                )}
                              </Link>

                              <div className="flex h-8 items-center gap-2 border-t border-[#F0EBE6] bg-[#FFFCF9] px-3.5">
                                <CheckCircle2 size={11} className="text-[#AAA198]" />
                                <span className="text-[7px] font-semibold text-[#9A9189]">
                                  Бейне → тест
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  <section className="min-w-0">
                    <div className="mb-2">
                      <p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#172235]">
                        ТАПСЫРМАЛАР
                      </p>
                    </div>

                    {!dayTasks.length ? (
                      <Card className="p-7 text-center">
                        <ClipboardList size={18} className="mx-auto text-[#B5ABA2]" />
                        <p className="mt-2 text-[11px] font-extrabold text-[#172235]">
                          Бұл күнге тапсырма жоқ
                        </p>
                      </Card>
                    ) : (
                      <div className="grid gap-2.5">
                        {dayTasks.map((task, index) => {
                          const locked =
                            Boolean(task.starts_at) &&
                            new Date(task.starts_at!).getTime() > now;
                          const submission = submissionMap.get(task.id);
                          const done = submission?.status === "REVIEWED";

                          return (
                            <Card
                              key={task.id}
                              className="shrq-day-item-card overflow-hidden border-[#E6E0D9] bg-white p-0 transition duration-200 hover:-translate-y-0.5 hover:border-[#F2C8A8] hover:shadow-[0_10px_24px_rgba(23,34,53,.045)]"
                            >
                              <Link
                                href={locked ? "#" : "/tasks/" + task.id}
                                aria-disabled={locked}
                                className={[
                                  "flex min-h-[82px] items-start gap-3 px-3.5 py-3.5",
                                  locked ? "pointer-events-none opacity-60" : "",
                                ].join(" ")}
                              >
                                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#FFF1E2] text-[#B95D00] mt-0.5">
                                  {done ? (
                                    <CheckCircle2 size={15} />
                                  ) : locked ? (
                                    <LockKeyhole size={15} />
                                  ) : (
                                    <ClipboardList size={15} />
                                  )}
                                </span>

                                <span className="min-w-0 flex-1 pt-0.5">
                                  <span className="flex h-4 items-center gap-2">
                                    <span className="text-[7px] font-extrabold uppercase tracking-[.12em] text-[#A19890]">
                                      {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <span
                                      className={[
                                        "rounded-full px-2 py-0.5 text-[7px] font-extrabold",
                                        done
                                          ? "bg-[#EAF7F0] text-[#2E7E58]"
                                          : locked
                                            ? "bg-[#F4F1EC] text-[#857B72]"
                                            : "bg-[#FFF1E2] text-[#B95D00]",
                                      ].join(" ")}
                                    >
                                      {done ? "Орындалды" : locked ? "Жабық" : "Тапсырма"}
                                    </span>
                                  </span>

                                  <span className="mt-1.5 block truncate text-[12px] font-extrabold leading-[1.25] tracking-[-.02em] text-[#172235]">
                                    {task.title}
                                  </span>

                                  <span className="mt-1 block truncate text-[8px] font-medium leading-4 text-[#8B8179]">
                                    {task.points} ұпай
                                    {task.deadline
                                      ? " · " + new Date(task.deadline).toLocaleDateString("kk-KZ")
                                      : ""}
                                  </span>
                                </span>

                                {locked ? (
                                  <LockKeyhole size={14} className="shrink-0 text-[#B0A79F]" />
                                ) : (
                                  <ArrowRight size={15} className="shrink-0 text-[#FF8000]" />
                                )}
                              </Link>

                              <div className="flex h-8 items-center gap-2 border-t border-[#F0EBE6] bg-[#FFFCF9] px-3.5">
                                <span className="text-[7px] font-semibold text-[#9A9189]">
                                  {done ? "Тексерілді" : "Тапсырманы ашу"}
                                </span>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </section>
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
