import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "ADMIN") redirect("/dashboard");

  const [{ count: studentCount }, { count: mentorCount }, { count: teamCount }, { count: activeAssignments }, { data: attendance }, { data: scores }] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "MENTOR"),
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("team_members").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("attendance_records").select("attendance_percent"),
    supabase.from("score_events").select("points"),
  ]);

  const averageAttendance = attendance?.length ? attendance.reduce((sum, item) => sum + Number(item.attendance_percent ?? 0), 0) / attendance.length : 0;
  const totalPoints = (scores ?? []).reduce((sum, item) => sum + Number(item.points ?? 0), 0);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role="ADMIN" />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-semibold text-[var(--accent)]">ADMIN PANEL</p>
        <h1 className="mt-2 text-3xl font-semibold">{profile.full_name}</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Students", String(studentCount ?? 0)],
            ["Mentors", String(mentorCount ?? 0)],
            ["Teams", String(teamCount ?? 0)],
            ["Assignments", String(activeAssignments ?? 0)],
            ["Attendance", averageAttendance.toFixed(1) + "%"],
          ].map(([label,value]) => (
            <div key={label} className="rounded-2xl border border-[var(--border)] bg-white p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <h2 className="text-xl font-semibold">Операциялық басқару</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <a href="/admin/teams" className="rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100"><p className="font-medium">Teams</p><p className="mt-1 text-sm text-[var(--muted)]">Командалар мен mentor assignment.</p></a>
              <a href="/admin/lessons" className="rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100"><p className="font-medium">Lessons</p><p className="mt-1 text-sm text-[var(--muted)]">Kinescope сабақтарын басқару.</p></a>
              <a href="/admin/tasks" className="rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100"><p className="font-medium">Tasks</p><p className="mt-1 text-sm text-[var(--muted)]">Марафон тапсырмалары.</p></a>
              <a href="/admin/tests" className="rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100"><p className="font-medium">Tests</p><p className="mt-1 text-sm text-[var(--muted)]">Сабақ тесттері.</p></a>
              <a href="/admin/score-rules" className="rounded-xl bg-zinc-50 p-4 hover:bg-zinc-100"><p className="font-medium">Score rules</p><p className="mt-1 text-sm text-[var(--muted)]">Ұпай ережелерін басқару.</p></a>
            </div>
          </section>
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6">
            <p className="text-sm text-[var(--muted)]">Жалпы ұпай</p>
            <p className="mt-2 text-4xl font-semibold">{totalPoints}</p>
            <p className="mt-3 text-sm text-[var(--muted)]">Score events auditable түрде сақталған.</p>
          </section>
        </div>
      </section>
    </main>
  );
}
