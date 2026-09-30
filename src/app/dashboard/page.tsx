import { redirect } from "next/navigation";
import Link from "next/link";
import { AppNav } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

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
    supabase.from("tasks").select("id,title,deadline,points").eq("active", true).order("deadline", { ascending: true, nullsFirst: false }).limit(3),
    supabase.from("video_progress").select("watched_percent,test_unlocked").eq("student_id", user.id),
    supabase.from("daily_reports").select("report_date,status").eq("student_id", user.id).order("report_date", { ascending: false }).limit(7),
    supabase.from("score_events").select("points").eq("student_id", user.id),
  ]);

  const team = Array.isArray(membership?.teams) ? membership.teams[0] ?? null : membership?.teams;
  const score = (scores ?? []).reduce((sum, item) => sum + Number(item.points ?? 0), 0);
  const submittedReports = (reports ?? []).filter((report) => report.status === "SUBMITTED").length;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role={role} />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-semibold text-[var(--accent)]">STUDENT DASHBOARD</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{profile?.full_name ?? "Қош келдіңіз"}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{team ? "Команда: " + String(team.name) : "Сіз әлі командаға қосылған жоқсыз."}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Ұпай", String(score)],["Команда", team ? String(team.name) : "Күтілуде"],["Есептер", String(submittedReports)],["Сабақтар", String(progress?.length ?? 0)]].map(([label,value]) => (
            <div key={label} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="text-sm text-[var(--muted)]">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-semibold">Келесі тапсырмалар</h2><p className="mt-1 text-sm text-[var(--muted)]">Жақын deadline-дар.</p></div>
              <Link href="/tasks" className="text-sm font-semibold">Барлығы →</Link>
            </div>
            <div className="mt-6 space-y-3">
              {(tasks ?? []).map((task) => (
                <Link key={task.id} href={"/tasks/" + task.id} className="block rounded-xl border border-[var(--border)] p-4 hover:bg-zinc-50">
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{task.deadline ? new Date(task.deadline).toLocaleString("kk-KZ") : "Deadline жоқ"} · {task.points} ұпай</p>
                </Link>
              ))}
              {!tasks?.length ? <p className="text-sm text-[var(--muted)]">Белсенді тапсырма жоқ.</p> : null}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-xl font-semibold">Бүгін</h2>
            <div className="mt-6 space-y-3">
              <Link href="/reports" className="block rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100"><p className="font-medium">Күнделікті есеп</p><p className="mt-1 text-sm text-[var(--muted)]">Бүгінгі прогресіңізді жіберіңіз.</p></Link>
              <Link href="/lessons" className="block rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100"><p className="font-medium">Сабақтар</p><p className="mt-1 text-sm text-[var(--muted)]">Kinescope сабақтарын жалғастырыңыз.</p></Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
