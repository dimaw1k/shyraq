import { Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, ProgressBar, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateTeamForm } from "@/components/staff/StaffCreateTeamForm";
import { StaffTeamEditForm } from "@/components/staff/StaffTeamEditForm";

export default async function LeaderTeamsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const { data: teams } = await supabase
    .from("teams")
    .select("id,name,mentor_id,capacity,status,created_at")
    .order("created_at", { ascending: true });

  const { data: mentors } = await supabase
    .from("profiles")
    .select("id,full_name,email")
    .eq("role", "MENTOR")
    .order("full_name");

  const teamIds = (teams ?? []).map((team) => team.id);
  const { data: members } = teamIds.length
    ? await supabase.from("team_members").select("team_id").in("team_id", teamIds).eq("status", "ACTIVE")
    : { data: [] as Array<{ team_id: string }> };

  const mentorMap = new Map((mentors ?? []).map((mentor) => [mentor.id, mentor.full_name]));
  const memberCount = new Map<string, number>();
  for (const row of members ?? []) memberCount.set(row.team_id, (memberCount.get(row.team_id) ?? 0) + 1);

  return (
    <AppShell
      role="LEADER"
      userName={profile.full_name}
      title="Командалар"
      description="Командаларды басқару және жүктемесін бақылау."
      right={<StaffCreateTeamForm />}
    >
      <PageContainer>
        {(teams ?? []).length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(teams ?? []).map((team) => {
              const count = memberCount.get(team.id) ?? 0;
              const capacity = Number(team.capacity ?? 0);
              const utilization = capacity ? Math.min(100, Math.round((count / capacity) * 100)) : 0;

              return (
                <Card key={team.id} className="p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#F3C7B0]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#FFF1E2] text-[#FF8000]">
                        <Users size={16} />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate text-[14px] font-extrabold text-[#172235]">{team.name}</h2>
                        <p className="mt-1 truncate text-[10px] font-semibold text-[#91877F]">
                          {team.mentor_id ? mentorMap.get(team.mentor_id) ?? "Ментор табылмады" : "Ментор жоқ"}
                        </p>
                      </div>
                    </div>
                    <StatusPill tone={team.status === "ACTIVE" ? "green" : "red"}>{team.status}</StatusPill>
                  </div>

                  <div className="mt-5 rounded-[14px] bg-[#FFFCF9] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">ОҚУШЫЛАР</span>
                      <span className="text-[11px] font-extrabold text-[#172235]">{count} / {capacity || "—"}</span>
                    </div>
                    <div className="mt-2"><ProgressBar value={utilization} /></div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <StaffTeamEditForm
                      team={team}
                      mentors={(mentors ?? []).map((mentor) => ({
                        id: mentor.id,
                        full_name: mentor.full_name,
                      }))}
                    />
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState title="Команда жоқ." description="«Команда қосу» батырмасы арқылы жаңа команда жасаңыз." />
        )}
      </PageContainer>
    </AppShell>
  );
}
