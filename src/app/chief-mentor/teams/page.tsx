import Link from "next/link";
import { Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, ProgressBar, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateTeamForm } from "@/components/staff/StaffCreateTeamForm";
import { StaffTeamEditForm } from "@/components/staff/StaffTeamEditForm";

export default async function ChiefMentorTeamsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { data: teams } = await supabase
    .from("teams")
    .select("id,name,mentor_id,capacity,status")
    .order("name");

  const [{ data: mentors }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,role").eq("role", "MENTOR").order("full_name"),
    (teams ?? []).length
      ? supabase
          .from("team_members")
          .select("team_id")
          .in("team_id", (teams ?? []).map((team) => team.id))
          .eq("status", "ACTIVE")
      : Promise.resolve({ data: [] as Array<{ team_id: string }> }),
  ]);

  const mentorMap = new Map((mentors ?? []).map((mentor) => [mentor.id, mentor.full_name]));
  const counts = new Map<string, number>();
  for (const member of members ?? []) counts.set(member.team_id, (counts.get(member.team_id) ?? 0) + 1);

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Командалар"
      description="Барлық ментор командаларын басқару."
      right={<StaffCreateTeamForm />}
    >
      <PageContainer>
        <div className="space-y-5">
          {(teams ?? []).length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(teams ?? []).map((team) => {
                const count = counts.get(team.id) ?? 0;
                const capacity = Number(team.capacity ?? 0);
                const percent = capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0;
                const mentor = mentorMap.get(team.mentor_id ?? "") ?? "Ментор жоқ";

                return (
                  <Card key={team.id} className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F3C7B0]">
                    <div className="flex items-start justify-between gap-3">
                      <Link href={"/chief-mentor/teams/" + team.id} className="flex min-w-0 items-center gap-3">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#FFF1E2] text-[#FF8000]">
                          <Users size={16} />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate text-[14px] font-extrabold text-[#172235]">{team.name}</h2>
                          <p className="mt-1 truncate text-[10px] font-semibold text-[#91877F]">{mentor}</p>
                        </div>
                      </Link>
                      <StatusPill tone={team.status === "ACTIVE" ? "green" : "red"}>{team.status}</StatusPill>
                    </div>

                    <div className="mt-5 rounded-[14px] bg-[#FFFCF9] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">ОҚУШЫЛАР</span>
                        <span className="text-[11px] font-extrabold text-[#172235]">{count} / {capacity || "—"}</span>
                      </div>
                      <div className="mt-2"><ProgressBar value={percent} /></div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <StaffTeamEditForm
                        team={team}
                        mentors={(mentors ?? []).map((mentorItem) => ({
                          id: mentorItem.id,
                          full_name: mentorItem.full_name,
                        }))}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <EmptyState title="Команда жоқ." description="Жоғарыдағы «Команда қосу» батырмасы арқылы жаңа команда жасаңыз." />
          )}
        </div>
      </PageContainer>
    </AppShell>
  );
}
