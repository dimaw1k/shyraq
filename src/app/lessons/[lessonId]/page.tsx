import { notFound, redirect } from "next/navigation";
import { ArrowRight, CheckCircle2, ClipboardList, Clock3, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { KinescopeLessonPlayer } from "@/components/lessons/KinescopeLessonPlayer";
import { formatKzDateTime } from "@/lib/datetime";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { lessonId } = await params;
  const [{ data: profile }, { data: membership }, { data: lesson }, { data: lessonTest }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("team_members").select("team_id").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
    supabase.from("lessons").select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,published,starts_at,marathon_day,team_id,materials").eq("id", lessonId).eq("published", true).maybeSingle(),
    supabase.from("lesson_tests").select("id,title").eq("lesson_id", lessonId).eq("active", true).maybeSingle(),
  ]);

  if (!lesson) notFound();
  const role = profile?.role ?? "STUDENT";
  if (role === "STUDENT" && lesson.team_id && lesson.team_id !== membership?.team_id) notFound();
  const locked = Boolean(lesson.starts_at && new Date(lesson.starts_at).getTime() > new Date().getTime());

  if (locked) {
    return (
      <AppShell role={role} userName={profile?.full_name ?? undefined} title="Сабақ жабық">
        <main className="mx-auto w-full max-w-3xl px-3.5 py-5 sm:px-6 sm:py-8">
          <div className="rounded-[24px] border border-[#E8E1DA] bg-white p-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F6F2ED] text-[#8D837B]"><LockKeyhole size={22} /></span>
            <h2 className="mt-4 text-xl font-extrabold text-[#172235]">{lesson.title}</h2>
            <p className="mt-2 text-sm text-[#8B8179]">Сабақ әлі ашылған жоқ.</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFF0E8] px-4 py-2 text-xs font-extrabold text-[#C85E2F]"><Clock3 size={14} />{formatKzDateTime(lesson.starts_at!)}</p>
          </div>
        </main>
      </AppShell>
    );
  }

  const hasTest=Boolean(lessonTest?.id);
  const materials = Array.isArray(lesson.materials)
    ? lesson.materials.filter((item: unknown): item is { label?: string; title?: string; url?: string; type?: string; description?: string } => Boolean(
        item &&
        typeof item === "object" &&
        (typeof (item as { label?: unknown }).label === "string" || typeof (item as { title?: unknown }).title === "string")
      ))
    : [];

  const [{ data: progress }, { data: teamTasks }, { data: submissions }] = await Promise.all([
    supabase
      .from("video_progress")
      .select("watched_ranges,watched_percent,test_unlocked")
      .eq("lesson_id", lessonId)
      .eq("student_id", user.id)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id,title,description,instructions,deadline,starts_at,points,marathon_day,task_order,team_id,active")
      .eq("active", true)
      .eq("marathon_day", lesson.marathon_day)
      .order("task_order"),
    supabase
      .from("task_submissions")
      .select("task_id,status,submitted_late,submitted_at")
      .eq("student_id", user.id),
  ]);

  const visibleTasks =
    role === "STUDENT"
      ? (teamTasks ?? []).filter(
          (task) => !task.team_id || task.team_id === membership?.team_id,
        )
      : teamTasks ?? [];

  const submissionMap = new Map(
    (submissions ?? []).map((submission) => [submission.task_id, submission]),
  );

  const initialRanges = Array.isArray(progress?.watched_ranges)
    ? (progress.watched_ranges as { start: number; end: number }[])
    : [];

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title={lesson.title}
      description={
        lesson.marathon_day
          ? lesson.marathon_day + "-күн · " + (hasTest ? "бейне → тест" : "бейне сабақ")
          : hasTest
            ? "Бейне → тест"
            : "Бейне сабақ"
      }
    >
      <main className="mx-auto w-full max-w-[1280px] px-3.5 py-4 sm:px-6 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <section className="min-w-0 rounded-[20px] border border-[#E7E0D8] bg-white p-3.5 shadow-[0_10px_30px_rgba(23,34,53,.035)] sm:p-4">
            <div className="mb-3">
              <p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-[#FF8000]">
                ВИДЕО САБАҚ
              </p>
              <h1 className="mt-1 text-[18px] font-extrabold tracking-[-.035em] text-[#172235] sm:text-[20px]">
                {lesson.title}
              </h1>
              {lesson.description ? (
                <p className="mt-1.5 text-[10px] leading-5 text-[#857B72]">
                  {lesson.description}
                </p>
              ) : null}
            </div>

            <KinescopeLessonPlayer
              lessonId={lesson.id}
              videoId={lesson.kinescope_video_id}
              durationSeconds={lesson.duration_seconds}
              requiredWatchPercent={lesson.required_watch_percent}
              initialRanges={initialRanges}
              testHref={hasTest ? "/tests/lesson/" + lesson.id : undefined}
              initialTestUnlocked={Boolean(progress?.test_unlocked)}
              trackProgress={hasTest}
            />

            {materials.length ? (
              <div className="mt-3 rounded-[14px] border border-[#EEE8E2] bg-[#FFFCF9] p-3.5">
                <p className="text-[8px] font-extrabold uppercase tracking-[.13em] text-[#FF8000]">
                  МАТЕРИАЛДАР
                </p>
                <div className="mt-2 space-y-2">
                  {materials.map((material, index) => {
                    const label = material.label ?? material.title ?? "Материал";
                    return material.url ? (
                      <a
                        key={material.url + index}
                        href={material.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-[10px] bg-white px-3 py-2.5 text-[10px] font-bold text-[#4B433C] transition hover:text-[#FF8000]"
                      >
                        <span>{label}</span>
                        {material.description ? (
                          <span className="mt-1 block text-[9px] font-medium leading-4 text-[#8B8179]">
                            {material.description}
                          </span>
                        ) : null}
                      </a>
                    ) : (
                      <div key={label + index} className="rounded-[10px] bg-white px-3 py-2.5">
                        <p className="text-[10px] font-bold text-[#4B433C]">{label}</p>
                        {material.description ? (
                          <p className="mt-1 text-[9px] font-medium leading-4 text-[#8B8179]">
                            {material.description}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </section>

          <aside className="min-w-0 rounded-[20px] border border-[#E7E0D8] bg-[#FAF9F7] p-3.5 shadow-[0_10px_30px_rgba(23,34,53,.025)] lg:sticky lg:top-[72px] sm:p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[8px] font-extrabold uppercase tracking-[.15em] text-[#FF8000]">
                  БҮГІНГІ ТАПСЫРМАЛАР
                </p>
                <h2 className="mt-1 text-[18px] font-extrabold tracking-[-.035em] text-[#172235]">
                  {lesson.marathon_day}-күн
                </h2>
              </div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[8px] font-extrabold text-[#766E66] ring-1 ring-[#E8E1DA]">
                {visibleTasks.length}
              </span>
            </div>

            {visibleTasks.length ? (
              <div className="mt-3 space-y-2.5">
                {visibleTasks.map((task, index) => {
                  const locked = Boolean(
                    task.starts_at && new Date(task.starts_at).getTime() > Date.now(),
                  );
                  const submission = submissionMap.get(task.id);
                  const done = submission?.status === "REVIEWED";

                  return (
                    <Link
                      key={task.id}
                      href={locked ? "#" : "/tasks/" + task.id}
                      aria-disabled={locked}
                      className={[
                        "block rounded-[14px] border bg-white p-3.5 transition",
                        done
                          ? "border-[#CFE7D8]"
                          : "border-[#E8E1DA] hover:-translate-y-0.5 hover:border-[#F2C8A8] hover:shadow-[0_8px_20px_rgba(23,34,53,.04)]",
                        locked ? "pointer-events-none opacity-60" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#FFF1E2] text-[#B95D00]">
                          {done ? (
                            <CheckCircle2 size={15} />
                          ) : locked ? (
                            <LockKeyhole size={15} />
                          ) : (
                            <ClipboardList size={15} />
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#A19890]">
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
                              {done ? "ОРЫНДАЛДЫ" : locked ? "ЖАБЫҚ" : "ТАПСЫРМА"}
                            </span>
                          </span>

                          <span className="mt-1 block text-[12px] font-extrabold leading-5 text-[#172235]">
                            {task.title}
                          </span>

                          <span className="mt-1 block line-clamp-2 text-[9px] leading-4 text-[#8B8179]">
                            {locked
                              ? "Тапсырма әзірге ашылған жоқ."
                              : task.description || task.instructions || "Тапсырманы орындап, нәтижені жібер."
                            }
                          </span>

                          <span className="mt-2 flex items-center justify-between gap-2 text-[8px] font-semibold text-[#A19890]">
                            <span>
                              {task.points} ұпай
                              {task.deadline
                                ? " · " + new Date(task.deadline).toLocaleDateString("kk-KZ")
                                : ""}
                            </span>
                            {locked ? (
                              <LockKeyhole size={12} />
                            ) : (
                              <ArrowRight size={12} className="text-[#FF8000]" />
                            )}
                          </span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="mt-3 rounded-[14px] border border-dashed border-[#DCD4CC] bg-white px-4 py-10 text-center">
                <ClipboardList size={18} className="mx-auto text-[#B5ABA2]" />
                <p className="mt-2 text-[11px] font-extrabold text-[#172235]">
                  Бұл күнге тапсырма жоқ
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
