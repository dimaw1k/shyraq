import { BarChart3, Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, ProgressBar, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorMentorsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { data: mentors } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,role,status")
    .in("role", ["MENTOR", "CHIEF_MENTOR"])
    .order("role", { ascending: false })
    .order("full_name", { ascending: true });

  const mentorIds = (mentors ?? []).map((item) => item.id);
  const { data: teams } = mentorIds.length
    ? await supabase.from("teams").select("id,name,mentor_id,capacity,status").in("mentor_id", mentorIds).eq("status", "ACTIVE")
    : { data: [] as Array<{ id: string; name: string; mentor_id: string | null; capacity: number | null; status: string }> };

  const teamIds = (teams ?? []).map((item) => item.id);
  const { data: members } = teamIds.length
    ? await supabase.from("team_members").select("team_id,student_id").in("team_id", teamIds).eq("status", "ACTIVE")
    : { data: [] as Array<{ team_id: string; student_id: string }> };

  const teamCount = new Map<string, number>();
  for (const team of teams ?? []) teamCount.set(team.mentor_id ?? "", (teamCount.get(team.mentor_id ?? "") ?? 0) + 1);

  const studentCount = new Map<string, number>();
  for (const member of members ?? []) studentCount.set(member.team_id, (studentCount.get(member.team_id) ?? 0) + 1);

  return (
    <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Менторлар">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="МЕНТОРЛАР" title="Менторлар штабы" description="Менторлар мен командаларды бақылау." />
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1.2fr_120px_1fr_120px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] sm:grid">
              <span>Ментор</span><span>Команда</span><span>Жүктеме</span><span>Статус</span>
            </div>
            <div className="divide-y divide-[#EFE8E1]">
              {(mentors ?? []).map((mentor) => {
                const mentorTeams = (teams ?? []).filter((team) => team.mentor_id === mentor.id);
                const load = mentorTeams.reduce((sum, team) => sum + (studentCount.get(team.id) ?? 0), 0);
                const capacity = mentorTeams.reduce((sum, team) => sum + Number(team.capacity ?? 0), 0);
                const utilization = capacity ? Math.round((load / capacity) * 100) : 0;
                return (
                  <div key={mentor.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.2fr_120px_1fr_120px] sm:items-center sm:px-6">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#172235] text-white"><Users size={14} /></span>
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-extrabold text-[#354153]">{mentor.full_name}</p>
                        <p className="mt-1 truncate text-[9px] text-[#9A9189]">{mentor.role === "CHIEF_MENTOR" ? "Аға ментор" : mentor.email}</p>
                      </div>
                    </div>
                    <p className="text-[10px] font-extrabold text-[#4B433C]">{teamCount.get(mentor.id) ?? 0}</p>
                    <div><ProgressBar value={utilization} label={`${load} оқушы / ${capacity || "—"} орын`} /></div>
                    <StatusPill tone={mentor.status === "ACTIVE" ? "green" : "orange"}>{mentor.status}</StatusPill>
                  </div>
                );
              })}
              {!mentors?.length ? <div className="p-8"><EmptyState title="Ментор жоқ." /></div> : null}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#FFF0E8] text-[#FF6F2C]"><BarChart3 size={17} /></span>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">БАҚЫЛАУ</p>
                <p className="mt-1 text-sm font-extrabold text-[#172235]">Ментор жүктемесі нақты деректерден есептеледі.</p>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
