import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Clock3, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MARATHON_WEEKS } from "@/lib/marathon";

export default async function LessonsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: lessons }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("lessons").select("id,title,description,duration_seconds,required_watch_percent,marathon_day,lesson_order,starts_at,published").eq("published", true).order("marathon_day").order("lesson_order").limit(100),
  ]);

  const role = profile?.role ?? "STUDENT";
  const now = Date.now();

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Сабақтар" description="Сабақтар апта және күн құрылымымен орналасқан.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="ОҚУ" title="Сабақтар" description="Қажетті күнді ашып, видео мен тестті ретімен орында." />
          {MARATHON_WEEKS.map((week) => {
            const weekLessons = (lessons ?? []).filter((lesson) => {
              const day = Number(lesson.marathon_day ?? 0);
              return day >= week.startDay && day <= week.endDay;
            });
            if (!weekLessons.length) return null;
            return (
              <section key={week.week} className="space-y-3">
                <div className="flex items-end justify-between">
                  <div><p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[#FF6F2C]">{week.title}</p><h2 className="mt-1 text-xl font-extrabold text-[#172235]">{week.subtitle}</h2></div>
                  <Link href={"/marathon/week/" + week.week} className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#FF6F2C]">Аптаға өту <ArrowRight size={13} /></Link>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {weekLessons.map((lesson) => {
                    const locked = Boolean(lesson.starts_at && new Date(lesson.starts_at).getTime() > now);
                    return (
                      <Link key={lesson.id} href={locked ? "#" : "/lessons/" + lesson.id} aria-disabled={locked} className={locked ? "pointer-events-none" : ""}>
                        <Card className={"h-full p-5 transition " + (locked ? "bg-[#F8F5F1]" : "hover:-translate-y-0.5 hover:border-[#F3C7B0]")}>
                          <div className="flex items-center justify-between gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]"><BookOpen size={16} /></span>
                            {locked ? <LockKeyhole size={15} className="text-[#9A9189]" /> : <StatusPill tone="orange">{lesson.marathon_day}-КҮН</StatusPill>}
                          </div>
                          <h3 className="mt-4 text-[14px] font-extrabold text-[#172235]">{lesson.title}</h3>
                          <p className="mt-1 text-xs font-medium leading-5 text-[#766E66]">{locked ? "Сабақ әлі ашылған жоқ." : (lesson.description ?? "Сабақты ашып, видеоны баста.")}</p>
                          <p className="mt-4 inline-flex items-center gap-1 text-[10px] font-semibold text-[#9A9189]"><Clock3 size={12} />{locked ? "Ашылады: " + new Date(lesson.starts_at!).toLocaleString("kk-KZ") : Math.ceil(lesson.duration_seconds / 60) + " мин · " + lesson.required_watch_percent + "% gate"}</p>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {!lessons?.length ? <EmptyState title="Жарияланған сабақ жоқ." /> : null}
        </div>
      </PageContainer>
    </AppShell>
  );
}
