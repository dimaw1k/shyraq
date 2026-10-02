import { Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { ChiefMentorMentorManager } from "@/components/staff/ChiefMentorMentorManager";

export default async function ChiefMentorMentorsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { data: mentors } = await supabase.from("profiles")
    .select("id,full_name,email,phone,status")
    .eq("role","MENTOR")
    .order("full_name");

  const mentorIds=(mentors??[]).map(x=>x.id);
  const { data: teams }=mentorIds.length
    ? await supabase.from("teams").select("id,mentor_id").in("mentor_id",mentorIds).eq("status","ACTIVE")
    : {data:[] as Array<{id:string;mentor_id:string|null}>};
  const teamIds=(teams??[]).map(x=>x.id);
  const [{data:members},{data:attendance}] = await Promise.all([
    teamIds.length ? supabase.from("team_members").select("team_id,student_id").in("team_id",teamIds).eq("status","ACTIVE") : Promise.resolve({data:[] as Array<{team_id:string;student_id:string}>}),
    teamIds.length ? supabase.from("attendance_records").select("team_id,attendance_percent").in("team_id",teamIds) : Promise.resolve({data:[] as Array<{team_id:string;attendance_percent:number|null}>}),
  ]);

  const teamByMentor=new Map<string,string[]>();
  for(const team of teams??[]) if(team.mentor_id) teamByMentor.set(team.mentor_id,[...(teamByMentor.get(team.mentor_id)??[]),team.id]);
  const studentCounts=new Map<string,number>();
  for(const member of members??[]){
    const mentor=teams?.find(team=>team.id===member.team_id)?.mentor_id;
    if(mentor) studentCounts.set(mentor,(studentCounts.get(mentor)??0)+1);
  }
  const attendanceByMentor=new Map<string,number[]>();
  for(const row of attendance??[]){
    const mentor=teams?.find(team=>team.id===row.team_id)?.mentor_id;
    if(mentor) attendanceByMentor.set(mentor,[...(attendanceByMentor.get(mentor)??[]),Number(row.attendance_percent??0)]);
  }

  const rows=(mentors??[]).map(m=>{
    const values=attendanceByMentor.get(m.id)??[];
    return {
      ...m,
      team_count:(teamByMentor.get(m.id)??[]).length,
      student_count:studentCounts.get(m.id)??0,
      attendance:values.length?values.reduce((a,b)=>a+b,0)/values.length:0,
      reports_reviewed:0,
    };
  });

  return (
    <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Менторлар" description="Менторларды қосу, басқару және performance бақылау.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="МЕНТОРЛАР" title="Менторлар штабы" description="Статус, команда, оқушы саны және attendance." action={<Users size={18} className="text-[var(--accent)]"/>}/>
          <Card className="overflow-visible">
            <div className="hidden grid-cols-[1.25fr_110px_110px_120px_170px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] lg:grid">
              <span>Ментор</span><span>Команда</span><span>Оқушы</span><span>Қатысу</span><span className="text-right">Статус</span>
            </div>
            <ChiefMentorMentorManager initialMentors={rows}/>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
