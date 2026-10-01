import { Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, ProgressBar, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateTeamForm } from "@/components/staff/StaffCreateTeamForm";

export default async function ChiefMentorTeamsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { data: teams } = await supabase.from("teams").select("id,name,mentor_id,capacity,status").eq("status", "ACTIVE").order("name");
  const mentorIds = [...new Set((teams ?? []).map((team) => team.mentor_id).filter(Boolean))] as string[];
  const [{ data: mentors }, { data: members }] = await Promise.all([
    mentorIds.length ? supabase.from("profiles").select("id,full_name").in("id", mentorIds) : Promise.resolve({ data: [] as Array<{ id: string; full_name: string }> }),
    (teams ?? []).length ? supabase.from("team_members").select("team_id").in("team_id", (teams ?? []).map((team) => team.id)).eq("status", "ACTIVE") : Promise.resolve({ data: [] as Array<{ team_id: string }> }),
  ]);
  const mentorMap = new Map((mentors ?? []).map((mentor) => [mentor.id, mentor.full_name]));
  const counts = new Map<string, number>();
  for (const member of members ?? []) counts.set(member.team_id, (counts.get(member.team_id) ?? 0) + 1);

  return (
    <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Командалар" description="Барлық mentor team-дерінің операциялық күйі.">
      <PageContainer><div className="space-y-5"><SectionHeader eyebrow="TEAMS" title="Командалар" description="Ментор жүктемесі мен команда capacity." />
          <StaffCreateTeamForm mentors={(mentors ?? []).map((mentor) => ({ id: mentor.id, full_name: mentor.full_name }))} /><Card className="overflow-hidden"><div className="divide-y divide-[#EFE8E1]">{(teams ?? []).map((team) => { const count=counts.get(team.id)??0; const cap=Number(team.capacity??0); const pct=cap?Math.round(count/cap*100):0; return <div key={team.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.1fr_1fr_1fr_120px] sm:items-center sm:px-6"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E8] text-[#FF6F2C]"><Users size={14}/></span><div><p className="text-[11px] font-extrabold text-[#354153]">{team.name}</p><p className="mt-1 text-[9px] text-[#9A9189]">{mentorMap.get(team.mentor_id ?? "") ?? "Ментор жоқ"}</p></div></div><ProgressBar value={pct} label={`${count}/${cap||"—"} оқушы`} /><p className="text-[10px] font-bold text-[#4B433C]">{cap||"—"} орын</p><StatusPill tone="green">{team.status}</StatusPill></div>})}{!teams?.length?<div className="p-8"><EmptyState title="Команда жоқ."/></div>:null}</div></Card></div></PageContainer>
    </AppShell>
  );
}
