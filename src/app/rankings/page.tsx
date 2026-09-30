import { redirect } from "next/navigation";
import { AppShell, UserChip } from "@/components/app/AppNav";
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

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  if (!profile?.role || !["MENTOR", "ADMIN", "STUDENT"].includes(profile.role)) redirect("/dashboard");

  const admin = createAdminSupabaseClient();
  let title = "Марафон рейтингі";
  let allowedIds: string[] | null = null;

  if (profile.role === "MENTOR") {
    const { data: team } = await admin.from("teams").select("id,name").eq("mentor_id", user.id).eq("status", "ACTIVE").maybeSingle();
    if (!team) {
      return (
        <AppShell role="MENTOR" title="Рейтинг" description="Командаңыздың нәтижесі." right={<UserChip name={profile.full_name} role="MENTOR" />}>
          <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
            <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] p-8 text-center">
              <p className="text-sm font-semibold text-gray-900">Белсенді команда бекітілмеген.</p>
              <p className="mt-1 text-xs text-gray-500">Рейтинг команда тағайындалғаннан кейін көрсетіледі.</p>
            </div>
          </main>
        </AppShell>
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

  if (allowedIds) studentsQuery = studentsQuery.in("id", allowedIds);

  const { data: students } = await studentsQuery;
  const ids = (students ?? []).map((student) => student.id);
  const { data: events } = ids.length
    ? await admin.from("score_events").select("student_id,points").in("student_id", ids)
    : { data: [] as Array<{ student_id: string; points: number }> };

  const scores = new Map<string, number>();
  for (const event of events ?? []) scores.set(event.student_id, (scores.get(event.student_id) ?? 0) + Number(event.points ?? 0));

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
    <AppShell role={profile.role} userName={profile.full_name} title={title} description="Ұпайлар бойынша марафон позициясы." right={<UserChip name={profile.full_name} role={profile.role} />}>
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        {profile.role === "STUDENT" ? <p className="mb-4 text-xs text-gray-500">Алғашқы 10 орын және өз позицияңыз көрсетіледі.</p> : null}
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
          <div className="grid grid-cols-[56px_1fr_90px] border-b border-gray-100 bg-[#FAFAFA] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 sm:grid-cols-[72px_1fr_120px]">
            <span>#</span><span>Оқушы</span><span>Ұпай</span>
          </div>
          {visibleRows.map((row) => (
            <div
              key={row.id}
              className={"grid grid-cols-[56px_1fr_90px] items-center border-b border-gray-100 px-4 py-3.5 last:border-b-0 sm:grid-cols-[72px_1fr_120px] " + (row.id === user.id ? "bg-[#C25100]/5" : "")}
            >
              <span className="text-sm font-semibold text-gray-900">{row.rank}</span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{row.full_name}{row.id === user.id ? " · сіз" : ""}</p>
                <p className="mt-0.5 text-[10px] text-gray-400">{row.status}</p>
              </div>
              <span className="text-sm font-semibold text-gray-900">{row.score}</span>
            </div>
          ))}
          {!visibleRows.length ? <div className="p-8 text-center text-sm text-gray-500">Рейтингке әзірге оқушы жоқ.</div> : null}
        </div>
      </main>
    </AppShell>
  );
}
