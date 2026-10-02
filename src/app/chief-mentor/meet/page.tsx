import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { ChiefMentorMeetManager } from "@/components/staff/ChiefMentorMeetManager";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorMeetPage(){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const [{data:teams},{data:spaces},{data:attendance}]=await Promise.all([
   supabase.from("teams").select("id,name,capacity").eq("status","ACTIVE").order("name"),
   supabase.from("meet_spaces").select("id,team_id,display_name,meeting_url,external_space_id,active").order("created_at",{ascending:false}),
   supabase.from("attendance_records").select("attendance_percent,attended_seconds,meeting_duration_seconds,status").order("imported_at",{ascending:false}).limit(500),
 ]);
 const teamNames=new Map((teams??[]).map(t=>[t.id,t.name]));
 const spaceRows=(spaces??[]).map(s=>({...s,team_name:teamNames.get(s.team_id)??"Команда"}));
 const avg=(attendance??[]).length?(attendance??[]).reduce((a,r)=>a+Number(r.attendance_percent??0),0)/(attendance??[]).length:0;
 const attended=(attendance??[]).filter(r=>["ATTENDED","FULL"].includes(r.status)).length;
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Кездесулер" description="Google Meet, attendance және history.">
  <PageContainer><div className="space-y-5">
   <SectionHeader eyebrow="MEET" title="Кездесулер" description="Барлық командадағы Meet space және қатысу статистикасы."/>
   <section className="grid gap-3 sm:grid-cols-3"><MetricCard label="MEET SPACE" value={String(spaceRows.length)} hint="команда" /><MetricCard label="ҚАТЫСУ" value={avg?avg.toFixed(1)+"%":"—"} hint="орташа" /><MetricCard label="ATTENDED" value={String(attended)} hint="жазба"/></section>
   <ChiefMentorMeetManager teams={teams??[]} initialSpaces={spaceRows}/>
   <Card className="overflow-hidden"><div className="border-b border-[#EFE8E1] px-5 py-4"><p className="text-[13px] font-extrabold text-[#172235]">Attendance history</p></div><div className="divide-y divide-[#EFE8E1]">{(attendance??[]).slice(0,100).map((r,i)=><div key={i} className="grid grid-cols-[1fr_110px_130px] gap-3 px-5 py-3.5 sm:grid-cols-[1.3fr_110px_130px]"><p className="text-[10px] font-semibold text-[#4B433C]">Қатысу жазбасы #{i+1}</p><p className="text-[10px] font-extrabold text-[#172235]">{Number(r.attendance_percent??0).toFixed(1)}%</p><StatusPill tone={r.status==="FULL"||r.status==="ATTENDED"?"green":r.status==="ABSENT"?"red":"orange"}>{r.status}</StatusPill></div>)}{!(attendance??[]).length?<div className="p-8 text-center text-xs text-[#8B8179]">Attendance history жоқ.</div>:null}</div></Card>
  </div></PageContainer>
 </AppShell>;
}
