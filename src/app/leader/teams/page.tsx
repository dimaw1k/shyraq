import { Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, ProgressBar, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function LeaderTeamsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const { data: teams } = await supabase.from("teams").select("id,name,mentor_id,capacity,status,created_at").order("created_at", { ascending: true });

  const mentorIds = [...new Set((teams ?? []).map((team) => team.mentor_id).filter(Boolean))] as string[];
  const { data: mentors } = mentorIds.length
    ? await supabase.from("profiles").select("id,full_name,email").in("id", mentorIds)
    : { data: [] as Array<{ id: string; full_name: string; email: string }> };

  const teamIds = (teams ?? []).map((team) => team.id);
  const { data: members } = teamIds.length
    ? await supabase.from("team_members").select("team_id").in("team_id", teamIds).eq("status", "ACTIVE")
    : { data: [] as Array<{ team_id: string }> };

  const mentorMap = new Map((mentors ?? []).map((mentor) => [mentor.id, mentor.full_name]));
  const memberCount = new Map<string, number>();
  for (const row of members ?? []) memberCount.set(row.team_id, (memberCount.get(row.team_id) ?? 0) + 1);

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Командалар" description="Барлық команда, mentor және capacity көрінісі.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="TEAMS" title="Командалар" description="Команда жүктемесін нақты membership деректерімен бақылау." />
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1.1fr_1fr_1fr_140px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] sm:grid">
              <span>Команда</span><span>Ментор</span><span>Жүктеме</span><span>Статус</span>
            </div>
            <div className="divide-y divide-[#EFE8E1]">
              {(teams ?? []).map((team) => {
                const count = memberCount.get(team.id) ?? 0;
                const capacity = Number(team.capacity ?? 0);
                const utilization = capacity ? Math.round((count / capacity) * 100) : 0;
                return (
                  <div key={team.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.1fr_1fr_1fr_140px] sm:items-center sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]"><Users size={14} /></span>
                      <div><p className="text-[11px] font-extrabold text-[#354153]">{team.name}</p><p className="mt-1 text-[9px] text-[#9A9189]">{count} / {capacity || "—"} оқушы</p></div>
                    </div>
                    <p className="text-[10px] font-bold text-[#4B433C]">{team.mentor_id ? mentorMap.get(team.mentor_id) ?? "Ментор табылмады" : "Ментор жоқ"}</p>
                    <ProgressBar value={utilization} label="Capacity" />
                    <StatusPill tone={team.status === "ACTIVE" ? "green" : "red"}>{team.status}</StatusPill>
                  </div>
                );
              })}
              {!teams?.length ? <div className="p-8"><EmptyState title="Команда жоқ." /></div> : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
