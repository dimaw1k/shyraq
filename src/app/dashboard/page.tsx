import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Trophy,
} from "lucide-react";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formatDeadline(value?: string | null) {
  if (!value) return "Мерзімі көрсетілмеген";
  return new Date(value).toLocaleString("kk-KZ", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function todayInAlmaty() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Almaty",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
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
  if (role === "ADMIN") redirect("/admin");

  const [{ data: membership }, { data: tasks }, { data: progress }, { data: reports }, { data: scores }] =
    await Promise.all([
      supabase
        .from("team_members")
        .select("team_id,teams(id,name)")
        .eq("student_id", user.id)
        .eq("status", "ACTIVE")
        .maybeSingle(),
      supabase
        .from("tasks")
        .select("id,title,description,deadline,points")
        .eq("active", true)
        .order("deadline", { ascending: true, nullsFirst: false })
        .limit(5),
      supabase
        .from("video_progress")
        .select("watched_percent")
        .eq("student_id", user.id),
      supabase
        .from("daily_reports")
        .select("report_date,status")
        .eq("student_id", user.id)
        .order("report_date", { ascending: false })
        .limit(30),
      supabase
        .from("score_events")
        .select("points")
        .eq("student_id", user.id),
    ]);

  const team = Array.isArray(membership?.teams) ? membership.teams[0] ?? null : membership?.teams;
  const totalScore = (scores ?? []).reduce((sum, item) => sum + Number(item.points ?? 0), 0);
  const lessonProgress = progress?.length
    ? Math.round(progress.reduce((sum, item) => sum + Number(item.watched_percent ?? 0), 0) / progress.length)
    : 0;
  const today = todayInAlmaty();
  const reportDates = (reports ?? []).map((item) => item.report_date);
  const streak = calculateStreak(reportDates);
  const todayReport = (reports ?? []).find((item) => item.report_date === today);
  const firstName = profile?.full_name?.split(" ")[0] ?? "досым";

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Басты бет"
      description="Бүгінгі оқу жоспарыңыз."
      right={<UserChip name={profile?.full_name ?? undefined} role={role} />}
    >
      <main className="mx-auto w-full max-w-[1320px] px-4 py-4 sm:px-6 lg:px-7">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-4">
            <section className="rounded-[20px] border border-[#E7EBF0] bg-white px-5 py-5 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#FF6F2C]">БҮГІН</p>
                  <h2 className="mt-1.5 text-[25px] font-extrabold tracking-[-.045em] text-[#172235] sm:text-[29px]">
                    Сәлем, {firstName}
                  </h2>
                  <p className="mt-1.5 max-w-xl text-xs font-medium leading-5 text-[#7E8A9B]">
                    Бүгін ең маңызды тапсырмадан бастаңыз. Қалғанын біртіндеп орындайсыз.
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <Link
                    href="/tasks"
                    className="inline-flex items-center gap-1.5 rounded-[11px] bg-[#FF6F2C] px-4 py-2.5 text-[11px] font-extrabold text-white transition hover:bg-[#F26120]"
                  >
                    Тапсырмалар
                    <ArrowRight size={14} />
                  </Link>
                  <Link
                    href="/lessons"
                    className="inline-flex items-center gap-1.5 rounded-[11px] border border-[#E4E9EF] bg-white px-4 py-2.5 text-[11px] font-extrabold text-[#405067] transition hover:bg-[#F7F9FB]"
                  >
                    Сабақтар
                  </Link>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[15px] border border-[#E7EBF0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]">
                    <Flame size={16} />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#A1ACBA]">STREAK</span>
                </div>
                <p className="mt-3 text-[20px] font-extrabold text-[#172235]">{streak} күн</p>
                <p className="mt-0.5 text-[10px] font-medium text-[#8995A7]">күн сайынғы белсенділік</p>
              </div>

              <div className="rounded-[15px] border border-[#E7EBF0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#EFF4FF] text-[#4975CF]">
                    <BookOpen size={16} />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#A1ACBA]">САБАҚ</span>
                </div>
                <p className="mt-3 text-[20px] font-extrabold text-[#172235]">{lessonProgress}%</p>
                <p className="mt-0.5 text-[10px] font-medium text-[#8995A7]">орташа көру прогресі</p>
              </div>

              <div className="rounded-[15px] border border-[#E7EBF0] bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#EEF9F4] text-[#2E9168]">
                    <Trophy size={16} />
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[.12em] text-[#A1ACBA]">ҰПАЙ</span>
                </div>
                <p className="mt-3 text-[20px] font-extrabold text-[#172235]">{totalScore}</p>
                <p className="mt-0.5 text-[10px] font-medium text-[#8995A7]">жиналған ұпай</p>
              </div>
            </section>

            <section className="rounded-[20px] border border-[#E7EBF0] bg-white p-5 sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#FF6F2C]">ТӘРТІП</p>
                  <h2 className="mt-1.5 text-[19px] font-extrabold tracking-[-.03em] text-[#172235]">Соңғы 7 күн</h2>
                </div>
                <span className="text-[10px] font-semibold text-[#98A4B2]">Оқу ритмі</span>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, index) => {
                  const date = shiftDate(today, index - 6);
                  const report = (reports ?? []).find((item) => item.report_date === date);
                  const submitted = report?.status === "SUBMITTED";
                  const started = Boolean(report);

                  return (
                    <div key={date} className="flex flex-col items-center gap-1.5">
                      <span
                        className={[
                          "grid h-9 w-9 place-items-center rounded-[10px] text-[9px] font-extrabold sm:h-10 sm:w-10",
                          submitted
                            ? "bg-[#FF6F2C] text-white"
                            : started
                              ? "bg-[#FFF0E8] text-[#FF6F2C]"
                              : "bg-[#F5F7FA] text-[#A7B1BE]",
                        ].join(" ")}
                      >
                        {new Date(date + "T00:00:00").toLocaleDateString("kk-KZ", { weekday: "short" }).replace(".", "")}
                      </span>
                      <span className="text-[9px] font-semibold text-[#9DA8B6]">
                        {new Date(date + "T00:00:00").getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[20px] border border-[#E7EBF0] bg-white">
              <div className="flex items-center justify-between border-b border-[#EEF1F4] px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#FF6F2C]">ТАПСЫРМАЛАР</p>
                  <h2 className="mt-1 text-[19px] font-extrabold tracking-[-.03em] text-[#172235]">Келесі тапсырмалар</h2>
                </div>
                <Link href="/tasks" className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#FF6F2C]">
                  Барлығы
                  <ChevronRight size={13} />
                </Link>
              </div>

              <div className="divide-y divide-[#EEF1F4]">
                {(tasks ?? []).slice(0, 4).map((task) => (
                  <Link
                    key={task.id}
                    href={"/tasks/" + task.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-[#FBFCFD] sm:px-6"
                  >
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#F3F5F8] text-[#66758A]">
                      <CheckCircle2 size={16} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-bold text-[#27364B]">{task.title}</p>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-[#929DAD]">
                        {task.deadline ? formatDeadline(task.deadline) : "Мерзімі көрсетілмеген"}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] font-extrabold text-[#FF6F2C]">{task.points} ұпай</span>
                  </Link>
                ))}

                {!tasks?.length ? (
                  <div className="px-6 py-10 text-center">
                    <p className="text-sm font-bold text-[#27364B]">Қазір белсенді тапсырма жоқ.</p>
                    <p className="mt-1 text-[11px] font-medium text-[#99A4B2]">Жаңа тапсырма шыққанда осы жерден көрінеді.</p>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section className="rounded-[18px] border border-[#E7EBF0] bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="text-[14px] font-extrabold text-[#27364B]">Бүгін</h2>
                <span className="text-[10px] font-semibold text-[#99A5B4]">
                  {todayReport ? "Есеп дайын" : "Есеп жоқ"}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                <Link href="/reports" className="flex items-center gap-3 rounded-[12px] bg-[#FAFBFC] p-3 transition hover:bg-[#F5F7FA]">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#EEF9F4] text-[#2E9168]">
                    <Clock3 size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#314158]">Күнделікті есеп</p>
                    <p className="mt-0.5 text-[9px] font-medium text-[#929DAD]">
                      {todayReport ? "Бүгінгі есеп жіберілген" : "Бүгінгі прогресті белгілеңіз"}
                    </p>
                  </div>
                </Link>

                <Link href="/lessons" className="flex items-center gap-3 rounded-[12px] bg-[#FAFBFC] p-3 transition hover:bg-[#F5F7FA]">
                  <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[#EFF4FF] text-[#4975CF]">
                    <BookOpen size={14} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[#314158]">Сабақты жалғастыру</p>
                    <p className="mt-0.5 text-[9px] font-medium text-[#929DAD]">{lessonProgress}% орташа прогресс</p>
                  </div>
                </Link>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#E7EBF0] bg-[#172235] p-4 text-white">
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-white/40">КОМАНДА</p>
              <h2 className="mt-2 text-[16px] font-extrabold">{team ? String(team.name) : "Команда күтілуде"}</h2>
              <p className="mt-1.5 text-[10px] font-medium leading-5 text-white/55">
                {team ? "Командаңдағы нәтижеңді рейтингтен көр." : "Ментор командаға қосқанда осы жерде көрінеді."}
              </p>
              <Link href="/rankings" className="mt-3 inline-flex items-center gap-1 text-[10px] font-extrabold text-[#FF9A72]">
                Рейтингті ашу
                <ArrowRight size={12} />
              </Link>
            </section>

            <section className="rounded-[18px] border border-[#F6D7C5] bg-[#FFF5EF] p-4">
              <p className="text-[9px] font-bold uppercase tracking-[.16em] text-[#D55B22]">SHYRAQ</p>
              <p className="mt-2 text-[13px] font-extrabold leading-5 text-[#27364B]">
                Күнде аздап. Бірақ тұрақты.
              </p>
              <p className="mt-1.5 text-[10px] font-medium leading-5 text-[#8B786D]">
                Бүгінгі маңызды істі аяқтап, күнді бос жібермеңіз.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
