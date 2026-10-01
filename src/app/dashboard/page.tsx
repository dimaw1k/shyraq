import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Flame,
  PlayCircle,
  Target,
  Trophy,
} from "lucide-react";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function formatDate(value?: string | null) {
  if (!value) return "Мерзімі көрсетілмеген";
  return new Date(value).toLocaleString("kk-KZ", {
    day: "numeric",
    month: "long",
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

function shiftDate(dateString: string, delta: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function calculateStreak(reportDates: string[]) {
  if (!reportDates.length) return 0;

  const uniqueDates = new Set(reportDates);
  const today = todayInAlmaty();

  if (!uniqueDates.has(today)) return 0;

  let streak = 1;
  while (uniqueDates.has(shiftDate(today, -streak))) {
    streak += 1;
  }

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
        .limit(4),
      supabase
        .from("video_progress")
        .select("watched_percent,test_unlocked")
        .eq("student_id", user.id),
      supabase
        .from("daily_reports")
        .select("report_date,status,study_minutes,completed_task_count")
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
  const averageProgress = progress?.length
    ? Math.round(progress.reduce((sum, item) => sum + Number(item.watched_percent ?? 0), 0) / progress.length)
    : 0;

  const reportDates = (reports ?? []).map((item) => item.report_date);
  const streak = calculateStreak(reportDates);
  const today = todayInAlmaty();
  const todayReport = (reports ?? []).find((item) => item.report_date === today);
  const submittedReports = (reports ?? []).filter((report) => report.status === "SUBMITTED").length;
  const nextTask = tasks?.[0] ?? null;
  const firstName = profile?.full_name?.split(" ")[0] ?? "досым";

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Бүгінгі оқу"
      description="Оқу, тәртіп және прогресті бір жерден бақыла."
      right={<UserChip name={profile?.full_name ?? undefined} role={role} />}
    >
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-5 sm:px-6 sm:pt-7 lg:px-8">
        <section className="grid gap-4 xl:grid-cols-[1.55fr_.85fr]">
          <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#FFF0E8] via-[#FFDCCB] to-[#FFB58F] p-6 shadow-[0_28px_70px_rgba(114,47,17,.12)] sm:p-8">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/30 blur-3xl" />
            <div className="absolute bottom-[-90px] left-[28%] h-48 w-48 rounded-full bg-[#FF6F2C]/15 blur-3xl" />

            <div className="relative">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/65 px-3.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[.18em] text-[#6E625A] backdrop-blur">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF6F2C]" />
                  БҮГІНГІ КҮН
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#172235] px-3 py-1.5 text-[10px] font-bold text-white">
                  <Flame size={12} />
                  {streak} күн streak
                </span>
              </div>

              <h2 className="mt-5 max-w-2xl text-[39px] font-extrabold leading-[1.02] tracking-[-.06em] text-[#172235] sm:text-5xl">
                Сәлем, {firstName}.
                <span className="block text-[#FF6F2C]">Бүгін де бір қадам.</span>
              </h2>

              <p className="mt-4 max-w-xl text-sm font-medium leading-6 text-[#6F6259] sm:text-[15px]">
                Үлкен нәтиже бір күнде келмейді. Бүгінгі міндет — жоспардағы ең маңызды іске уақыт бөлу және оны соңына дейін жеткізу.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={nextTask ? "/tasks/" + nextTask.id : "/tasks"}
                  className="inline-flex items-center gap-2 rounded-full bg-[#FF6F2C] px-5 py-3 text-xs font-extrabold text-white shadow-[0_14px_30px_rgba(255,111,44,.22)] transition hover:-translate-y-0.5"
                >
                  {nextTask ? "Келесі тапсырманы ашу" : "Тапсырмаларды көру"}
                  <ArrowRight size={15} />
                </Link>

                <Link
                  href="/lessons"
                  className="inline-flex items-center gap-2 rounded-full bg-white/80 px-5 py-3 text-xs font-extrabold text-[#172235] shadow-sm transition hover:-translate-y-0.5"
                >
                  <PlayCircle size={15} />
                  Сабаққа өту
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-bold text-[#796E65]">
                {["Тапсырмалар", "Сабақтар", "Есеп", "Прогресс"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check size={11} className="text-[#FF6F2C]" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-[32px] bg-[#172235] p-6 text-white shadow-[0_28px_70px_rgba(23,34,53,.18)] sm:p-7">
            <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-white/40">ЖАЛПЫ НӘТИЖЕ</p>
            <div className="mt-3 flex items-end justify-between gap-4">
              <div>
                <p className="text-5xl font-extrabold tracking-[-.06em]">{totalScore}</p>
                <p className="mt-1 text-xs font-semibold text-white/50">жиналған ұпай</p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-[20px] bg-[#FF6F2C] shadow-[0_12px_26px_rgba(255,111,44,.22)]">
                <Trophy size={25} />
              </div>
            </div>

            <div className="mt-7">
              <div className="flex items-center justify-between text-[10px] font-bold text-white/55">
                <span>Сабақ прогресі</span>
                <span className="text-white">{averageProgress}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#FF6F2C] transition-all"
                  style={{ width: Math.min(100, Math.max(0, averageProgress)) + "%" }}
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-2">
              <div className="rounded-[18px] bg-white/[.05] p-3">
                <p className="text-[9px] font-bold uppercase tracking-[.13em] text-white/35">Команда</p>
                <p className="mt-1.5 truncate text-xs font-extrabold text-white">{team ? String(team.name) : "Күтілуде"}</p>
              </div>
              <div className="rounded-[18px] bg-white/[.05] p-3">
                <p className="text-[9px] font-bold uppercase tracking-[.13em] text-white/35">Есептер</p>
                <p className="mt-1.5 text-xs font-extrabold text-white">{submittedReports} жіберілді</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[24px] border border-[#EEE8E0] bg-white p-4 shadow-[0_12px_30px_rgba(35,23,15,.04)]">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF0E8] text-[#FF6F2C]"><Flame size={17} /></span>
              <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#B0A79D]">STREAK</span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-[#172235]">{streak} күн</p>
            <p className="mt-1 text-[10px] font-semibold text-[#8D857D]">қатарынан белсенділік</p>
          </div>

          <div className="rounded-[24px] border border-[#EEE8E0] bg-white p-4 shadow-[0_12px_30px_rgba(35,23,15,.04)]">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#F0EEFF] text-[#6E63D6]"><BookOpen size={17} /></span>
              <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#B0A79D]">САБАҚ</span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-[#172235]">{averageProgress}%</p>
            <p className="mt-1 text-[10px] font-semibold text-[#8D857D]">орташа көру прогресі</p>
          </div>

          <div className="rounded-[24px] border border-[#EEE8E0] bg-white p-4 shadow-[0_12px_30px_rgba(35,23,15,.04)]">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#EAF8F2] text-[#2E8A68]"><BarChart3 size={17} /></span>
              <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#B0A79D]">ЕСЕП</span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-[#172235]">{todayReport ? "Дайын" : "Жоқ"}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#8D857D]">бүгінгі есеп</p>
          </div>

          <div className="rounded-[24px] border border-[#EEE8E0] bg-white p-4 shadow-[0_12px_30px_rgba(35,23,15,.04)]">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FFF7DC] text-[#BE8B12]"><Target size={17} /></span>
              <span className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[#B0A79D]">МАҚСАТ</span>
            </div>
            <p className="mt-4 text-2xl font-extrabold tracking-[-.04em] text-[#172235]">{tasks?.length ?? 0}</p>
            <p className="mt-1 text-[10px] font-semibold text-[#8D857D]">белсенді тапсырма</p>
          </div>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
          <section className="rounded-[30px] border border-[#EEE8E0] bg-white p-5 shadow-[0_15px_40px_rgba(35,23,15,.045)] sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#FF6F2C]">КЕЛЕСІ ҚАДАМ</p>
                <h2 className="mt-2 text-2xl font-extrabold tracking-[-.05em] text-[#172235]">Бүгін нені орындау керек?</h2>
              </div>
              <Link href="/tasks" className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#FF6F2C] hover:underline">
                Барлық тапсырма
                <ChevronRight size={13} />
              </Link>
            </div>

            <div className="mt-5 space-y-2.5">
              {(tasks ?? []).map((task, index) => (
                <Link
                  key={task.id}
                  href={"/tasks/" + task.id}
                  className="group flex items-center gap-3 rounded-[20px] border border-[#F0EBE5] bg-[#FCFBF9] p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FFD4BE] hover:bg-white hover:shadow-[0_12px_26px_rgba(35,23,15,.055)]"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#172235] text-[10px] font-extrabold text-white">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold text-[#172235]">{task.title}</p>
                    <p className="mt-1 truncate text-[10px] font-semibold text-[#938A81]">{task.deadline ? formatDate(task.deadline) : "Deadline белгіленбеген"}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-[10px] font-extrabold text-[#FF6F2C]">{task.points} ұпай</p>
                    <p className="mt-1 text-[9px] font-semibold text-[#B0A79D]">орындау керек</p>
                  </div>
                  <ArrowRight size={15} className="shrink-0 text-[#B0A79D] transition group-hover:translate-x-0.5 group-hover:text-[#FF6F2C]" />
                </Link>
              ))}

              {!tasks?.length ? (
                <div className="rounded-[22px] border border-dashed border-[#E9E1D8] bg-[#FCFBF9] p-10 text-center">
                  <p className="text-sm font-extrabold text-[#172235]">Қазір белсенді тапсырма жоқ.</p>
                  <p className="mt-1 text-xs font-semibold text-[#9B9187]">Жаңа тапсырмалар шыққанда осы жерден көрінеді.</p>
                </div>
              ) : null}
            </div>
          </section>

          <div className="grid gap-4">
            <section className="rounded-[30px] bg-[#172235] p-5 text-white shadow-[0_18px_42px_rgba(23,34,53,.16)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-white/35">БҮГІНГІ ЕСЕП</p>
                  <h2 className="mt-2 text-2xl font-extrabold tracking-[-.045em]">Күніңді бекіт.</h2>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#FF6F2C]"><Clock3 size={17} /></span>
              </div>
              <p className="mt-3 text-sm font-medium leading-6 text-white/60">Бүгін қанша уақыт оқығаныңды, не орындағаныңды және келесі қадамыңды белгіле.</p>
              <Link
                href="/reports"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#172235] transition hover:-translate-y-0.5"
              >
                {todayReport ? "Есепті қарау" : "Есепті жіберу"}
                <ArrowRight size={13} />
              </Link>
            </section>

            <section className="rounded-[30px] border border-[#EEE8E0] bg-gradient-to-br from-[#FFF7F0] to-[#F1EEFF] p-5 shadow-[0_15px_38px_rgba(35,23,15,.04)] sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#FF6F2C]">КОМАНДА</p>
                  <h2 className="mt-2 text-xl font-extrabold tracking-[-.04em] text-[#172235]">{team ? String(team.name) : "Команда күтілуде"}</h2>
                </div>
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-[#172235] shadow-sm"><Trophy size={17} /></span>
              </div>
              <p className="mt-3 text-sm font-medium leading-6 text-[#7C726A]">
                {team
                  ? "Командаңдағы қозғалысты жалғастыр. Әр күнгі нәтиже ортақ прогреске қосылады."
                  : "Ментор сізді командаға қосқанда мұнда команданың аты мен прогресі көрінеді."}
              </p>
              <Link href="/rankings" className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[#172235] hover:text-[#FF6F2C]">
                Рейтингті көру
                <ChevronRight size={13} />
              </Link>
            </section>
          </div>
        </section>

        <section className="mt-4 rounded-[30px] border border-[#EEE8E0] bg-white p-5 shadow-[0_15px_40px_rgba(35,23,15,.04)] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-extrabold uppercase tracking-[.2em] text-[#FF6F2C]">ШЫРАҚ РИТМІ</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-.05em] text-[#172235]">Күн сайын аздап. Бірақ тұрақты.</h2>
            </div>
            <p className="text-[10px] font-semibold text-[#9C9288]">Соңғы 7 күн</p>
          </div>

          <div className="mt-5 grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }).map((_, index) => {
              const date = shiftDate(today, index - 6);
              const report = (reports ?? []).find((item) => item.report_date === date);
              const active = Boolean(report);
              const complete = report?.status === "SUBMITTED";
              const weekday = new Date(date + "T00:00:00").toLocaleDateString("kk-KZ", { weekday: "short" }).replace(".", "");

              return (
                <div key={date} className="flex flex-col items-center gap-2">
                  <span
                    className={[
                      "grid h-10 w-10 place-items-center rounded-2xl text-[9px] font-extrabold sm:h-11 sm:w-11",
                      complete
                        ? "bg-[#172235] text-white"
                        : active
                          ? "bg-[#FFF0E8] text-[#FF6F2C]"
                          : "border border-[#EEE8E0] bg-[#FCFBF9] text-[#B5ACA2]",
                    ].join(" ")}
                  >
                    {weekday}
                  </span>
                  <span className="text-[9px] font-bold text-[#AAA198]">{new Date(date + "T00:00:00").getDate()}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] font-bold text-[#9D948B]">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#172235]" /> Жіберілді</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#FF6F2C]" /> Басталды</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full border border-[#DED5CC] bg-[#FCFBF9]" /> Есеп жоқ</span>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
