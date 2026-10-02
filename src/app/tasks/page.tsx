import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ClipboardList, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MARATHON_WEEKS } from "@/lib/marathon";

export default async function TasksPage({ searchParams }: { searchParams?: Promise<{ day?: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const dayParam = (await searchParams)?.day;
  const selectedDay = dayParam ? Number(dayParam) : null;
  const [{ data: profile }, { data: tasks }, { data: submissions }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("tasks").select("id,title,description,deadline,starts_at,points,marathon_day,task_order,team_id,active").eq("active", true).order("marathon_day").order("task_order"),
    supabase.from("task_submissions").select("task_id,status,submitted_late,submitted_at").eq("student_id", user.id),
  ]);

  const role = profile?.role ?? "STUDENT";
  const now = new Date().getTime();
  const submissionMap = new Map((submissions ?? []).map((item) => [item.task_id, item]));

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Тапсырмалар" description="Ашылған тапсырмаларды орында; deadline өткен соң да тапсыруға болады.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="ЖҰМЫС" title="Тапсырмалар" description={selectedDay ? selectedDay + "-күн" : "Апта, күн және статус бойынша тапсырмаларды шол."} />
          {MARATHON_WEEKS.map((week) => {
            const weekTasks = (tasks ?? []).filter((task) => {
              const day = Number(task.marathon_day ?? 0);
              return day >= week.startDay && day <= week.endDay && (!selectedDay || day === selectedDay);
            });
            if (!weekTasks.length) return null;
            return (
              <section key={week.week} className="space-y-3">
                <div className="flex items-end justify-between">
                  <div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF6F2C]">{week.title}</p><h2 className="mt-1 text-xl font-extrabold text-[#172235]">{week.subtitle}</h2></div>
                  <Link href={"/marathon/week/" + week.week} className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#FF6F2C]">Аптаға өту <ArrowRight size={13} /></Link>
                </div>
                <div className="space-y-3">
                  {weekTasks.map((task) => {
                    const locked = Boolean(task.starts_at && new Date(task.starts_at).getTime() > now);
                    const submission = submissionMap.get(task.id);
                    return (
                      <Link key={task.id} href={locked ? "#" : "/tasks/" + task.id} aria-disabled={locked} className={locked ? "pointer-events-none block" : "block"}>
                        <Card className={"p-4 transition sm:p-5 " + (locked ? "bg-[#F8F5F1]" : "hover:-translate-y-0.5 hover:border-[#F3C7B0]")}>
                          <div className="flex items-start gap-4">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#FFF0E8] text-[#FF6F2C]">{locked ? <LockKeyhole size={17} /> : <ClipboardList size={17} />}</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-[14px] font-extrabold text-[#172235] sm:text-[15px]">{task.title}</h2>
                                {task.marathon_day ? <StatusPill tone="neutral">{task.marathon_day}-КҮН</StatusPill> : null}
                                <StatusPill tone={submission?.status === "REVIEWED" ? "green" : submission?.submitted_late ? "orange" : "neutral"}>{locked ? "КҮТІЛУДЕ" : (submission?.status ?? "ТАПСЫРЫЛМАҒАН")}</StatusPill>
                              </div>
                              <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-[#766E66]">{locked ? "Тапсырма ашылу уақытына дейін мазмұны жабық." : task.description}</p>
                              <p className="mt-3 text-[10px] font-semibold text-[#9A9189]">
                                {locked ? "Ашылады: " + new Date(task.starts_at!).toLocaleString("kk-KZ") : (task.deadline ? "Deadline: " + new Date(task.deadline).toLocaleString("kk-KZ") : "Deadline жоқ") + " · " + task.points + " ұпай"}
                                {submission?.submitted_late ? " · КЕШ ТАПСЫРЫЛДЫ" : ""}
                              </p>
                            </div>
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {!tasks?.length ? <EmptyState title="Әзірге тапсырма жоқ." /> : null}
        </div>
      </PageContainer>
    </AppShell>
  );
}
