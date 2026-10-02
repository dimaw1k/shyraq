import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, BookOpen, ClipboardList, FileText, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMarathonWeek } from "@/lib/marathon";

export default async function MarathonWeekPage({ params }: { params: Promise<{ week: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { week: rawWeek } = await params;
  const weekNumber = Number(rawWeek);
  if (!Number.isInteger(weekNumber)) notFound();
  const week = getMarathonWeek(weekNumber);
  if (!week) notFound();

  const [{ data: profile }, { data: lessons }, { data: tasks }, { data: ілгерілеу }, { data: submissions }, { data: reports }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("lessons")
      .select("id,title,duration_seconds,required_watch_percent,starts_at,marathon_day,lesson_order,published")
      .eq("published", true)
      .gte("marathon_day", week.startDay)
      .lte("marathon_day", week.endDay)
      .order("marathon_day")
      .order("lesson_order"),
    supabase.from("tasks")
      .select("id,title,description,points,starts_at,deadline,marathon_day,task_order,team_id,active")
      .eq("active", true)
      .gte("marathon_day", week.startDay)
      .lte("marathon_day", week.endDay)
      .order("marathon_day")
      .order("task_order"),
    supabase.from("video_ілгерілеу").select("lesson_id,watched_percent,test_unlocked").eq("student_id", user.id),
    supabase.from("task_submissions").select("task_id,status,submitted_late,submitted_at").eq("student_id", user.id),
    supabase.from("daily_reports").select("marathon_day,status,report_date").eq("student_id", user.id).gte("marathon_day", week.startDay).lte("marathon_day", week.endDay),
  ]);

  const now = new Date().getTime();
  const ілгерілеуByLesson = new Map((ілгерілеу ?? []).map((item) => [item.lesson_id, item]));
  const submissionByTask = new Map((submissions ?? []).map((item) => [item.task_id, item]));
  const reportByDay = new Map((reports ?? []).map((item) => [Number(item.marathon_day), item]));
  const role = profile?.role ?? "STUDENT";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title={week.title} description={week.subtitle}>
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="МАРАФОН"
            title={week.subtitle}
            description="Күнді ашып, сабақтарды қарап, тесттерді орындап, тапсырма мен отчетты жібер."
          />

          <div className="grid gap-4">
            {Array.from({ length: week.endDay - week.startDay + 1 }, (_, index) => week.startDay + index).map((day) => {
              const dayLessons = (lessons ?? []).filter((item) => Number(item.marathon_day) === day);
              const dayTasks = (tasks ?? []).filter((item) => Number(item.marathon_day) === day);
              const report = reportByDay.get(day);
              const lessonDone = dayLessons.length > 0 && dayLessons.every((lesson) => Boolean(ілгерілеуByLesson.get(lesson.id)?.test_unlocked));
              const taskDone = dayTasks.length > 0 && dayTasks.every((task) => submissionByTask.get(task.id)?.status === "REVIEWED");
              const reportDone = report?.status === "REVIEWED";
              const weightedProgress = (lessonDone ? 25 : 0) + (taskDone ? 45 : 0) + (reportDone ? 30 : 0);

              return (
                <Card key={day} className="overflow-hidden p-0">
                  <div className="flex flex-col gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF6F2C]">ШЫРАҚ</p>
                      <h2 className="mt-1 text-xl font-extrabold tracking-[-.03em] text-[#172235]">{day}-күн</h2>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-extrabold text-[#7A7068] ring-1 ring-[#E8E1DA]">{weightedProgress}% ілгерілеу</span>
                  </div>

                  <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
                    {dayLessons.map((lesson) => {
                      const locked = Boolean(lesson.starts_at && new Date(lesson.starts_at).getTime() > now);
                      const itemProgress = ілгерілеуByLesson.get(lesson.id);
                      return (
                        <Link key={lesson.id} href={locked ? "#" : "/lessons/" + lesson.id} aria-disabled={locked} className={locked ? "pointer-events-none" : "block"}>
                          <div className={"h-full rounded-[18px] border p-4 " + (locked ? "border-[#EEE7E1] bg-[#F8F5F1]" : "border-[#E8E1DA] bg-white transition hover:border-[#F3C7B0]")}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#FFF0E8] text-[#FF6F2C]"><BookOpen size={16} /></span>
                              {locked ? <LockKeyhole size={15} className="text-[#9A9189]" /> : <StatusPill tone={itemProgress?.test_unlocked ? "green" : "orange"}>{itemProgress?.test_unlocked ? "ТЕСТ АШЫҚ" : "САБАҚ"}</StatusPill>}
                            </div>
                            <h3 className="mt-4 text-[13px] font-extrabold text-[#172235]">{lesson.title}</h3>
                            <p className="mt-1 text-[10px] font-semibold text-[#9A9189]">{locked ? "Ашылады: " + new Date(lesson.starts_at!).toLocaleString("kk-KZ") : Math.ceil(lesson.duration_seconds / 60) + " мин · " + lesson.required_watch_percent + "% көру"}</p>
                          </div>
                        </Link>
                      );
                    })}

                    {dayTasks.map((task) => {
                      const locked = Boolean(task.starts_at && new Date(task.starts_at).getTime() > now);
                      const submission = submissionByTask.get(task.id);
                      return (
                        <Link key={task.id} href={locked ? "#" : "/tasks/" + task.id} aria-disabled={locked} className={locked ? "pointer-events-none" : "block"}>
                          <div className={"h-full rounded-[18px] border p-4 " + (locked ? "border-[#EEE7E1] bg-[#F8F5F1]" : "border-[#E8E1DA] bg-white transition hover:border-[#F3C7B0]")}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#F3F6FB] text-[#172235]"><ClipboardList size={16} /></span>
                              {locked ? <LockKeyhole size={15} className="text-[#9A9189]" /> : <StatusPill tone={submission?.status === "REVIEWED" ? "green" : submission?.submitted_late ? "orange" : "neutral"}>{submission?.status ?? "ТАПСЫРЫЛМАҒАН"}</StatusPill>}
                            </div>
                            <h3 className="mt-4 text-[13px] font-extrabold text-[#172235]">{task.title}</h3>
                            <p className="mt-1 text-[10px] font-semibold text-[#9A9189]">{locked ? "Ашылады: " + new Date(task.starts_at!).toLocaleString("kk-KZ") : (task.deadline ? "Соңғы мерзім: " + new Date(task.deadline).toLocaleString("kk-KZ") : "Deadline жоқ") + " · " + task.points + " ұпай"}</p>
                          </div>
                        </Link>
                      );
                    })}

                    <Link href={"/reports?day=" + day}>
                      <div className="h-full rounded-[18px] border border-[#E8E1DA] bg-white p-4 transition hover:border-[#F3C7B0]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="grid h-9 w-9 place-items-center rounded-[12px] bg-[#EEF9F3] text-[#318562]"><FileText size={16} /></span>
                          <StatusPill tone={reportDone ? "green" : "neutral"}>{report?.status ?? "ЖІБЕРІЛМЕГЕН"}</StatusPill>
                        </div>
                        <h3 className="mt-4 text-[13px] font-extrabold text-[#172235]">Күндік есеп</h3>
                        <p className="mt-1 text-[10px] font-semibold text-[#9A9189]">{report?.report_date ? new Date(report.report_date).toLocaleDateString("kk-KZ") : "Осы күннің прогресі"}</p>
                      </div>
                    </Link>
                  </div>

                  {!dayLessons.length && !dayTasks.length ? <div className="px-5 pb-5 text-xs font-semibold text-[#9A9189]">Бұл күнге контент әлі қосылмаған.</div> : null}

                  <div className="flex items-center justify-end border-t border-[#EFE8E1] px-5 py-3">
                    <Link href={"/tasks?day=" + day} className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#FF6F2C]">Осы күннің тапсырмалары <ArrowRight size={13} /></Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
