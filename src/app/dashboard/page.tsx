import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, CheckCircle2, ChevronRight, Clock3, Flame, Trophy } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, PrimaryLink, ProgressBar, SectionHeader, SecondaryLink } from "@/components/ui/ShyraqUI";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formatDeadline(value?: string | null) {
  if (!value) return "Мерзімі көрсетілмеген";
  return new Date(value).toLocaleString("kk-KZ", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function todayInAlmaty() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Almaty", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function shiftDate(value: string, delta: number) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function calculateStreak(reportDates: string[]) {
  const dates = new Set(reportDates);
  const today = todayInAlmaty();
  if (!dates.has(today)) return 0;
  let streak = 1;
  while (dates.has(shiftDate(today, -streak))) streak += 1;
  return streak;
}

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  const role = profile?.role ?? "STUDENT";
  if (role === "MENTOR") redirect("/mentor");
  if (role === "ADMIN") redirect("/admin");

  const [{ data: membership }, { data: tasks }, { data: progress }, { data: reports }, { data: scores }] = await Promise.all([
    supabase.from("team_members").select("team_id,teams(id,name)").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
    supabase.from("tasks").select("id,title,description,deadline,points").eq("active", true).order("deadline", { ascending: true, nullsFirst: false }).limit(5),
    supabase.from("video_progress").select("watched_percent").eq("student_id", user.id),
    supabase.from("daily_reports").select("report_date,status").eq("student_id", user.id).order("report_date", { ascending: false }).limit(30),
    supabase.from("score_events").select("points").eq("student_id", user.id),
  ]);

  const team = Array.isArray(membership?.teams) ? membership.teams[0] ?? null : membership?.teams;
  const totalScore = (scores ?? []).reduce((sum, item) => sum + Number(item.points ?? 0), 0);
  const lessonProgress = progress?.length ? Math.round(progress.reduce((sum, item) => sum + Number(item.watched_percent ?? 0), 0) / progress.length) : 0;
  const today = todayInAlmaty();
  const reportDates = (reports ?? []).map((item) => item.report_date);
  const streak = calculateStreak(reportDates);
  const todayReport = (reports ?? []).find((item) => item.report_date === today);
  const firstName = profile?.full_name?.split(" ")[0] ?? "досым";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Басты бет" hideHeader>
      <PageContainer>
        <div className="space-y-5">
          <Card className="overflow-hidden p-5 sm:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <SectionHeader
                eyebrow="БҮГІН"
                title={`Сәлем, ${firstName}`}
                description="Бүгінгі ең маңызды істі аяқта. Қалғаны біртіндеп орындалады."
              />
              <div className="flex flex-wrap gap-2">
                <PrimaryLink href="/tasks">Тапсырмалар <ArrowRight size={14} /></PrimaryLink>
                <SecondaryLink href="/lessons">Сабақтар</SecondaryLink>
              </div>
            </div>
          </Card>

          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="STREAK" value={`${streak} күн`} hint="күн сайынғы белсенділік" icon={<Flame size={17} />} />
            <MetricCard label="САБАҚ" value={`${lessonProgress}%`} hint="орташа көру прогресі" icon={<BookOpen size={17} />} />
            <MetricCard label="ҰПАЙ" value={String(totalScore)} hint="жиналған ұпай" icon={<Trophy size={17} />} />
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="space-y-5">
              <Card className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">ТӘРТІП</p>
                    <h2 className="mt-1.5 text-[18px] font-extrabold tracking-[-.03em] text-[#172235]">Соңғы 7 күн</h2>
                  </div>
                  <span className="text-[10px] font-semibold text-[#9A9189]">Оқу ритмі</span>
                </div>
                <div className="mt-5 grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, index) => {
                    const date = shiftDate(today, index - 6);
                    const report = (reports ?? []).find((item) => item.report_date === date);
                    const submitted = report?.status === "SUBMITTED";
                    const started = Boolean(report);
                    return (
                      <div key={date} className="flex flex-col items-center gap-1.5">
                        <span className={[`grid h-9 w-9 place-items-center rounded-[12px] text-[9px] font-extrabold sm:h-10 sm:w-10`, submitted ? "bg-[#FF6F2C] text-white" : started ? "bg-[#FFF0E8] text-[#FF6F2C]" : "bg-[#F6F2ED] text-[#A69C93]"].join(" ")}>
                          {new Date(date + "T00:00:00").toLocaleDateString("kk-KZ", { weekday: "short" }).replace(".", "")}
                        </span>
                        <span className="text-[9px] font-semibold text-[#9A9189]">{new Date(date + "T00:00:00").getDate()}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">КЕЛЕСІ</p>
                    <h2 className="mt-1 text-[18px] font-extrabold tracking-[-.03em] text-[#172235]">Тапсырмалар</h2>
                  </div>
                  <Link href="/tasks" className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#FF6F2C]">Барлығы <ChevronRight size={13} /></Link>
                </div>
                <div className="divide-y divide-[#EFE8E1]">
                  {(tasks ?? []).slice(0, 4).map((task) => (
                    <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#FFFCF9] sm:px-6">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-[#F6F2ED] text-[#766E66]"><CheckCircle2 size={16} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-extrabold text-[#2D3848]">{task.title}</p>
                        <p className="mt-1 truncate text-[10px] font-medium text-[#9A9189]">{formatDeadline(task.deadline)}</p>
                      </div>
                      <span className="shrink-0 text-[10px] font-extrabold text-[#FF6F2C]">{task.points} ұпай</span>
                    </Link>
                  ))}
                  {!tasks?.length ? <div className="px-6 py-10 text-center"><p className="text-sm font-extrabold text-[#3F3832]">Қазір белсенді тапсырма жоқ.</p><p className="mt-1 text-xs text-[#9A9189]">Жаңа тапсырма шыққанда осы жерден көрінеді.</p></div> : null}
                </div>
              </Card>
            </div>

            <aside className="space-y-5">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-[15px] font-extrabold text-[#172235]">Бүгін</h2>
                  <span className="text-[10px] font-semibold text-[#9A9189]">{todayReport ? "Дайын" : "Жіберілмеген"}</span>
                </div>
                <div className="mt-4 space-y-2.5">
                  <Link href="/reports" className="flex items-center gap-3 rounded-[14px] bg-[#FFFCF9] p-3 transition hover:bg-[#F6F2ED]">
                    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#EEF9F3] text-[#318562]"><Clock3 size={15} /></span>
                    <div><p className="text-[11px] font-extrabold text-[#354153]">Күндік есеп</p><p className="mt-0.5 text-[9px] text-[#9A9189]">{todayReport ? "Есеп жіберілді" : "Прогресті белгіле"}</p></div>
                  </Link>
                  <Link href="/lessons" className="flex items-center gap-3 rounded-[14px] bg-[#FFFCF9] p-3 transition hover:bg-[#F6F2ED]">
                    <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]"><BookOpen size={15} /></span>
                    <div><p className="text-[11px] font-extrabold text-[#354153]">Сабақты жалғастыру</p><p className="mt-0.5 text-[9px] text-[#9A9189]">{lessonProgress}% прогресс</p></div>
                  </Link>
                </div>
                <div className="mt-5"><ProgressBar value={lessonProgress} label="Сабақ прогресі" /></div>
              </Card>

              <Card dark className="p-5">
                <p className="text-[9px] font-extrabold uppercase tracking-[.16em] text-white/45">КОМАНДА</p>
                <h2 className="mt-2 text-[17px] font-extrabold">{team ? String(team.name) : "Команда күтілуде"}</h2>
                <p className="mt-1.5 text-[10px] leading-5 text-white/55">{team ? "Командаңдағы нәтижені рейтингтен көр." : "Ментор командаға қосқанда осы жерде көрінеді."}</p>
                <Link href="/rankings" className="mt-4 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#FF9A72]">Рейтингті ашу <ArrowRight size={12} /></Link>
              </Card>
            </aside>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
