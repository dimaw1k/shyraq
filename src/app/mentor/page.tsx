import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { MentorTeamManager } from "@/components/mentor/MentorTeamManager";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MentorPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "MENTOR") redirect("/dashboard");

  const { data: team } = await supabase.from("teams").select("id,name,capacity,status").eq("mentor_id", user.id).eq("status", "ACTIVE").maybeSingle();
  if (!team) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <AppNav role="MENTOR" />
        <section className="mx-auto max-w-5xl px-6 py-10"><h1 className="text-3xl font-semibold">Mentor panel</h1><p className="mt-3 text-sm text-[var(--muted)]">Сізге әлі active team бекітілмеген.</p></section>
      </main>
    );
  }

  const [{ data: members }, { data: attendance }] = await Promise.all([
    supabase.from("team_members").select("student_id,assigned_at,profiles(id,full_name,phone,email,status)").eq("team_id", team.id).eq("status", "ACTIVE"),
    supabase.from("attendance_records").select("attendance_percent").eq("team_id", team.id),
  ]);

  const averageAttendance = attendance?.length
    ? attendance.reduce((sum, row) => sum + Number(row.attendance_percent ?? 0), 0) / attendance.length
    : 0;

  const students = (members ?? []).map((row) => Array.isArray(row.profiles) ? row.profiles[0] : row.profiles).filter(Boolean);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role="MENTOR" />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-semibold text-[var(--accent)]">MENTOR PANEL</p>
        <h1 className="mt-2 text-3xl font-semibold">{profile.full_name}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{team.name}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Оқушылар", String(students.length) + "/" + String(team.capacity ?? "—")],
            ["Attendance", averageAttendance.toFixed(1) + "%"],
            ["Meet", "Қосу қажет"],
          ].map(([label,value]) => (
            <div key={label} className="rounded-2xl border border-[var(--border)] bg-white p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>
          ))}
        </div>

        <div className="mt-8"><MentorTeamManager teamId={team.id} students={students} /></div>
      </section>
    </main>
  );
}
