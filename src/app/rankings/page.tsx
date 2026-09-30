import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function RankingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "MENTOR" && profile?.role !== "ADMIN" && profile?.role !== "STUDENT") {
    redirect("/dashboard");
  }

  if (profile.role === "STUDENT") {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <AppNav role="STUDENT" />
        <section className="mx-auto max-w-5xl px-6 py-10">
          <p className="text-sm font-semibold text-[var(--accent)]">RANKING</p>
          <h1 className="mt-2 text-3xl font-semibold">Рейтинг</h1>
          <p className="mt-2 text-sm text-[var(--muted)]">Рейтингті көру mentor/admin режимінен басқарылатын operational функция ретінде ашылады.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-black px-4 py-3 font-semibold text-white">Dashboard</Link>
        </section>
      </main>
    );
  }

  const { data: team } = profile.role === "MENTOR"
    ? await supabase.from("teams").select("id,name").eq("mentor_id", user.id).eq("status", "ACTIVE").maybeSingle()
    : { data: null };

  const { data: members } = team
    ? await supabase.from("team_members").select("student_id,profiles(id,full_name)").eq("team_id", team.id).eq("status", "ACTIVE")
    : { data: null };

  const studentIds = team
    ? (members ?? []).map((item) => item.student_id)
    : null;

  let studentsQuery = supabase.from("profiles").select("id,full_name,status").eq("role", "STUDENT");
  if (studentIds) {
    if (!studentIds.length) studentsQuery = studentsQuery.in("id", ["00000000-0000-0000-0000-000000000000"]);
    else studentsQuery = studentsQuery.in("id", studentIds);
  }

  const { data: students } = await studentsQuery;
  const ids = (students ?? []).map((student) => student.id);
  const { data: events } = ids.length ? await supabase.from("score_events").select("student_id,points").in("student_id", ids) : { data: [] as Array<{ student_id: string; points: number }> };

  const scores = new Map<string, number>();
  for (const event of events ?? []) scores.set(event.student_id, (scores.get(event.student_id) ?? 0) + Number(event.points ?? 0));

  const rows = (students ?? [])
    .map((student) => ({ ...student, score: scores.get(student.id) ?? 0 }))
    .sort((a, b) => b.score - a.score);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role={profile.role} />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm font-semibold text-[var(--accent)]">RANKING</p>
        <h1 className="mt-2 text-3xl font-semibold">{team ? team.name : "Марафон рейтингі"}</h1>
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <div className="grid grid-cols-[72px_1fr_120px] border-b border-[var(--border)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            <span>#</span><span>Оқушы</span><span>Ұпай</span>
          </div>
          {rows.map((row, index) => (
            <div key={row.id} className="grid grid-cols-[72px_1fr_120px] items-center border-b border-[var(--border)] px-5 py-4 last:border-b-0">
              <span className="font-semibold">{index + 1}</span>
              <div><p className="font-medium">{row.full_name}</p><p className="text-xs text-[var(--muted)]">{row.status}</p></div>
              <span className="font-semibold">{row.score}</span>
            </div>
          ))}
          {!rows.length ? <div className="p-8 text-center text-sm text-[var(--muted)]">Рейтингке әзірге оқушы жоқ.</div> : null}
        </div>
      </section>
    </main>
  );
}
