import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, CompactStat, UserChip } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "ADMIN") redirect("/dashboard");

  const [{ count: studentCount }, { count: mentorCount }, { count: teamCount }, { count: activeAssignments }, { data: attendance }, { data: scores }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "MENTOR"),
      supabase.from("teams").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
      supabase.from("team_members").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
      supabase.from("attendance_records").select("attendance_percent"),
      supabase.from("score_events").select("points"),
    ]);

  const averageAttendance = attendance?.length
    ? attendance.reduce((sum, item) => sum + Number(item.attendance_percent ?? 0), 0) / attendance.length
    : 0;
  const totalPoints = (scores ?? []).reduce((sum, item) => sum + Number(item.points ?? 0), 0);

  const shortcuts = [
    ["Оқушылар", "/admin/users", "Student, mentor және admin аккаунттарын басқару."],
    ["Командалар", "/admin/teams", "Команда, mentor және capacity."],
    ["Сабақтар", "/admin/lessons", "Kinescope сабақтарын жариялау."],
    ["Тапсырмалар", "/admin/tasks", "Марафон тапсырмаларын жасау."],
    ["Тесттер", "/admin/tests", "Сабақ тесттерін қосу."],
    ["Ұпай ережелері", "/admin/score-rules", "Score rules салмағын өзгерту."],
  ];

  return (
    <AppShell role="ADMIN" userName={profile?.full_name ?? undefined} title="Басқару панелі" description="Марафонның негізгі операциялық көрсеткіштері." right={<UserChip name={profile?.full_name ?? undefined} role="ADMIN" />}>
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <CompactStat label="Оқушылар" value={String(studentCount ?? 0)} hint="Барлық student" />
          <CompactStat label="Менторлар" value={String(mentorCount ?? 0)} hint="Барлық mentor" />
          <CompactStat label="Командалар" value={String(teamCount ?? 0)} hint="Active teams" />
          <CompactStat label="Мүшелік" value={String(activeAssignments ?? 0)} hint="Белсенді team membership" />
          <CompactStat label="Attendance" value={averageAttendance.toFixed(1) + "%"} hint="Орташа қатысу" />
        </section>

        <section className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.65fr]">
          <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-soft sm:p-5">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">OPERATIONS</p>
              <h2 className="mt-1 text-sm font-semibold tracking-tight text-gray-900">Басқару бөлімдері</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {shortcuts.map(([title, href, description]) => (
                <Link key={href} href={href} className="group rounded-xl bg-[#FAFAFA] p-3.5 transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:bg-white hover:shadow-soft">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-[#C25100] transition-colors duration-300">{title}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-100 bg-[#FAFAFA] p-4 sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">SCORE</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{totalPoints}</p>
            <p className="mt-1 text-xs leading-5 text-gray-500">Барлық student score events қосындысы.</p>
          </section>
        </section>
      </main>
    </AppShell>
  );
}
