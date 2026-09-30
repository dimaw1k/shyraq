import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RankingRow = {
  id: string;
  full_name: string;
  status: string;
  score: number;
  rank: number;
};

export default async function RankingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile?.role || !["MENTOR", "ADMIN", "STUDENT"].includes(profile.role)) redirect("/dashboard");

  const admin = createAdminSupabaseClient();
  let title = "Марафон рейтингі";
  let allowedIds: string[] | null = null;

  if (profile.role === "MENTOR") {
    const { data: team } = await admin.from("teams").select("id,name").eq("mentor_id", user.id).eq("status", "ACTIVE").maybeSingle();
    if (!team) {
      return (
        <main className="min-h-screen bg-[var(--background)]">
          <AppNav role="MENTOR" />
          <section className="mx-auto max-w-5xl px-6 py-10">
            <p className="text-sm font-semibold text-[var(--accent)]">RANKING</p>
            <h1 className="mt-2 text-3xl font-semibold">Рейтинг</h1>
            <p className="mt-2 text-sm text-[var(--muted)]">Сізге active team бекітілмеген.</p>
          </section>
        </main>
      );
    }
    title = team.name;
    const { data: members } = await admin.from("team_members").select("student_id").eq("team_id", team.id).eq("status", "ACTIVE");
    allowedIds = (members ?? []).map((member) => member.student_id);
  }

  let studentsQuery = admin.from("profiles")
    .select("id,full_name,status")
    .eq("role", "STUDENT")
    .in("status", ["WAITING_FOR_TEAM", "ACTIVE", "COMPLETED"]);

  if (allowedIds) {
    studentsQuery = studentsQuery.in("id", allowedIds);
  }

  const { data: students } = await studentsQuery;
  const ids = (students ?? []).map((student) => student.id);
  const { data: events } = ids.length
    ? await admin.from("score_events").select("student_id,points").in("student_id", ids)
    : { data: [] as Array<{ student_id: string; points: number }> };

  const scores = new Map<string, number>();
  for (const event of events ?? []) {
    scores.set(event.student_id, (scores.get(event.student_id) ?? 0) + Number(event.points ?? 0));
  }

  const rows: RankingRow[] = (students ?? [])
    .map((student) => ({ ...student, score: scores.get(student.id) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.full_name.localeCompare(b.full_name, "kk-KZ"))
    .map((student, index) => ({ ...student, rank: index + 1 }));

  const visibleRows = profile.role === "STUDENT"
    ? (() => {
        const top = rows.slice(0, 10);
        const current = rows.find((row) => row.id === user.id);
        return current && !top.some((row) => row.id === current.id) ? [...top, current] : top;
      })()
    : rows;

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role={profile.role} />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm font-semibold text-[var(--accent)]">RANKING</p>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        {profile.role === "STUDENT" ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Алғашқы 10 орын және өз позицияңыз көрсетіледі.
          </p>
        ) : null}

        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)] bg-white">
          <div className="grid grid-cols-[72px_1fr_120px] border-b border-[var(--border)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            <span>#</span><span>Оқушы</span><span>Ұпай</span>
          </div>
          {visibleRows.map((row) => (
            <div
              key={row.id}
              className={
                "grid grid-cols-[72px_1fr_120px] items-center border-b border-[var(--border)] px-5 py-4 last:border-b-0 " +
                (row.id === user.id ? "bg-orange-50/60" : "")
              }
            >
              <span className="font-semibold">{row.rank}</span>
              <div>
                <p className="font-medium">
                  {row.full_name}
                  {row.id === user.id ? " (сіз)" : ""}
                </p>
                <p className="text-xs text-[var(--muted)]">{row.status}</p>
              </div>
              <span className="font-semibold">{row.score}</span>
            </div>
          ))}
          {!visibleRows.length ? (
            <div className="p-8 text-center text-sm text-[var(--muted)]">Рейтингке әзірге оқушы жоқ.</div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
