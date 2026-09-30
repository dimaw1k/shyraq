import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, CompactStat, UserChip } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
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
      supabase.from("team_members").select("team_id,teams(id,name)").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
      supabase.from("tasks").select("id,title,deadline,points").eq("active", true).order("deadline", { ascending: true, nullsFirst: false }).limit(3),
      supabase.from("video_progress").select("watched_percent,test_unlocked").eq("student_id", user.id),
      supabase.from("daily_reports").select("report_date,status").eq("student_id", user.id).order("report_date", { ascending: false }).limit(7),
      supabase.from("score_events").select("points").eq("student_id", user.id),
    ]);

  const team = Array.isArray(membership?.teams) ? membership.teams[0] ?? null : membership?.teams;
  const score = (scores ?? []).reduce((sum, item) => sum + Number(item.points ?? 0), 0);
  const submittedReports = (reports ?? []).filter((report) => report.status === "SUBMITTED").length;

  return (
    <AppShell
      role={role}
      userName={profile?.full_name ?? undefined}
      title="Басты бет"
      description="Оқу прогресіңізді бір жерден бақылаңыз."
      right={<UserChip name={profile?.full_name ?? undefined} role={role} />}
    >
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
        <section className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#C25100]">SHYRAQ</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
            Қош келдіңіз, {profile?.full_name ?? "оқушы"}.
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {team ? `Команда: ${String(team.name)}` : "Ментор сізді командаға қосқанын күтіңіз."}
          </p>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CompactStat label="Ұпай" value={String(score)} hint="Жалпы нәтиже" />
          <CompactStat label="Команда" value={team ? String(team.name) : "Күтілуде"} hint="Белсенді команда" />
          <CompactStat label="Есептер" value={String(submittedReports)} hint="Жіберілген есеп" />
          <CompactStat label="Оқу прогресі" value={String(progress?.length ?? 0)} hint="Басталған сабақ" />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold tracking-tight text-gray-900">Келесі тапсырмалар</h3>
                <p className="mt-0.5 text-xs text-gray-500">Жақын deadline-дар.</p>
              </div>
              <Link href="/tasks" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#C25100] transition-all duration-300 ease-in-out hover:bg-[#C25100]/10">
                Барлығы
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {(tasks ?? []).map((task) => (
                <Link
                  key={task.id}
                  href={"/tasks/" + task.id}
                  className="flex items-center justify-between gap-4 rounded-xl bg-[#FAFAFA] p-3.5 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-white hover:shadow-soft"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{task.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {task.deadline ? new Date(task.deadline).toLocaleString("kk-KZ") : "Deadline жоқ"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-[#C25100]">{task.points} ұпай</span>
                </Link>
              ))}
              {!tasks?.length ? <p className="px-1 py-3 text-xs text-gray-500">Белсенді тапсырма жоқ.</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-4 sm:p-5">
            <h3 className="text-sm font-semibold tracking-tight text-gray-900">Бүгін</h3>
            <p className="mt-0.5 text-xs text-gray-500">Ең маңызды екі әрекет.</p>
            <div className="mt-4 space-y-2">
              <Link href="/reports" className="block rounded-xl bg-white p-3.5 shadow-soft transition-all duration-300 ease-in-out hover:-translate-y-0.5">
                <p className="text-sm font-medium text-gray-900">Күнделікті есеп</p>
                <p className="mt-1 text-xs text-gray-500">Бүгінгі прогресті жіберіңіз.</p>
              </Link>
              <Link href="/lessons" className="block rounded-xl bg-white p-3.5 shadow-soft transition-all duration-300 ease-in-out hover:-translate-y-0.5">
                <p className="text-sm font-medium text-gray-900">Сабақты жалғастыру</p>
                <p className="mt-1 text-xs text-gray-500">Kinescope сабақтарын ашыңыз.</p>
              </Link>
            </div>
          </section>
        </section>
      </main>
    </AppShell>
  );
}
