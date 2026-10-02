import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { uiLabel } from "@/lib/ui-labels";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Crown, Medal, Trophy } from "lucide-react";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";

type RankingRow = { id: string; full_name: string; status: string; score: number; rank: number };

export default async function RankingsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  const allowedRoles = ["MENTOR", "CHIEF_MENTOR", "LEADER", "STUDENT"];
  if (!profile?.role || !allowedRoles.includes(profile.role)) redirect("/dashboard");

  const admin = createAdminSupabaseClient();
  let title = profile.role === "STUDENT" ? "Рейтинг" : "Жалпы рейтинг";
  let allowedIds: string[] | null = null;

  if (profile.role === "MENTOR") {
    const { data: team } = await admin
      .from("teams")
      .select("id,name")
      .eq("mentor_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (!team) {
      return (
        <AppShell role="MENTOR" userName={profile.full_name} title="Рейтинг">
          <PageContainer>
            <Card className="p-10 text-center">
              <p className="text-sm font-extrabold text-[#3F3832]">Белсенді команда бекітілмеген.</p>
              <p className="mt-1 text-xs text-[#9A9189]">Рейтинг команда тағайындалғаннан кейін көрсетіледі.</p>
            </Card>
          </PageContainer>
        </AppShell>
      );
    }

    title = team.name;
    const { data: members } = await admin
      .from("team_members")
      .select("student_id")
      .eq("team_id", team.id)
      .eq("status", "ACTIVE");

    allowedIds = (members ?? []).map((member) => member.student_id);
  }

  let studentsQuery = admin
    .from("profiles")
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
  for (const event of events ?? []) {
    scores.set(event.student_id, (scores.get(event.student_id) ?? 0) + Number(event.points ?? 0));
  }

  const rows: RankingRow[] = (students ?? [])
    .map((student) => ({ ...student, score: scores.get(student.id) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.full_name.localeCompare(b.full_name, "kk-KZ"))
    .map((student, index) => ({ ...student, rank: index + 1 }));

  const visibleRows =
    profile.role === "STUDENT"
      ? (() => {
          const top = rows.slice(0, 10);
          const current = rows.find((row) => row.id === user.id);
          return current && !top.some((row) => row.id === current.id) ? [...top, current] : top;
        })()
      : rows;

  const description =
    profile.role === "STUDENT"
      ? "Алғашқы 10 орын және өз позицияң көрсетіледі."
      : profile.role === "MENTOR"
        ? "Командаңыздағы оқушылардың нәтижесі."
        : "Барлық оқушылардың жинаған ұпайы бойынша рейтинг.";

  return (
    <AppShell role={profile.role} userName={profile.full_name} title={title} description="Ұпайлар бойынша марафон позициясы.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="МАРАФОН" title={title} description={description} />
          <Card className="overflow-hidden">
            <div className="grid grid-cols-[56px_1fr_80px] border-b border-[#EFE8E1] bg-[#FFFCF9] px-4 py-3 text-[9px] font-extrabold uppercase tracking-[.13em] text-[#9A9189] sm:grid-cols-[72px_1fr_100px]">
              <span>#</span>
              <span>Оқушы</span>
              <span>Ұпай</span>
            </div>

            {visibleRows.map((row) => {
              const mine = row.id === user.id;
              const Icon = row.rank === 1 ? Crown : row.rank <= 3 ? Medal : Trophy;

              return (
                <div
                  key={row.id}
                  className={`grid grid-cols-[56px_1fr_80px] items-center border-b border-[#EFE8E1] px-4 py-4 last:border-b-0 sm:grid-cols-[72px_1fr_100px] ${mine ? "bg-[#FFF0E8]" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon size={14} className={row.rank <= 3 ? "text-[#FF6F2C]" : "text-[#B4A9A0]"} />
                    <span className="text-xs font-extrabold text-[#172235]">{row.rank}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-extrabold text-[#172235]">
                      {row.full_name}
                      {mine ? " · сіз" : ""}
                    </p>
                    <p className="mt-0.5 text-[9px] font-medium text-[#9A9189]">{uiLabel(row.status)}</p>
                  </div>
                  <span className="text-[12px] font-extrabold text-[#172235]">{row.score}</span>
                </div>
              );
            })}

            {!visibleRows.length ? (
              <div className="p-10 text-center text-xs font-medium text-[#9A9189]">
                Рейтингке әзірге оқушы жоқ.
              </div>
            ) : null}
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
