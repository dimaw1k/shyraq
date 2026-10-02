import { Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, ProgressBar, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
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
      
    >
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="TEAMS"
            title="Командалар"
            
          />

          <StaffCreateTeamForm />

          <Card className="overflow-visible">
            <div className="hidden grid-cols-[1.1fr_1fr_1fr_140px_330px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] lg:grid">
              <span>Команда</span>
              <span>Ментор</span>
              <span>Жүктеме</span>
              <span>Статус</span>
              <span className="text-right">Басқару</span>
            </div>

            <div className="divide-y divide-[#EFE8E1]">
              {(teams ?? []).map((team) => {
                const count = memberCount.get(team.id) ?? 0;
                const capacity = Number(team.capacity ?? 0);
                const utilization = capacity ? Math.round((count / capacity) * 100) : 0;

                return (
                  <div
                    key={team.id}
                    className="grid gap-4 px-5 py-4 lg:grid-cols-[1.1fr_1fr_1fr_140px_330px] lg:items-center lg:px-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
                        <Users size={14} />
                      </span>
                      <div>
                        <p className="text-[11px] font-extrabold text-[#354153]">{team.name}</p>
                        <p className="mt-1 text-[9px] text-[#9A9189]">
                          {count} / {capacity || "—"} оқушы
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] font-bold text-[#4B433C]">
                      {team.mentor_id ? mentorMap.get(team.mentor_id) ?? "Ментор табылмады" : "Ментор жоқ"}
                    </p>

                    <ProgressBar value={Math.min(utilization, 100)} label="Capacity" />

                    <StatusPill tone={team.status === "ACTIVE" ? "green" : "red"}>{team.status}</StatusPill>

                    <div className="lg:justify-self-end">
                      <StaffTeamEditForm
                        team={team}
                        mentors={(mentors ?? []).map((mentor) => ({
                          id: mentor.id,
                          full_name: mentor.full_name,
                        }))}
                      />
                    </div>
                  </div>
                );
              })}

              {!teams?.length ? (
                <div className="p-8">
                  <EmptyState title="Команда жоқ." />
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
