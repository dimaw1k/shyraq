import Link from "next/link";
import { Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { ChiefMentorStudentsManager } from "@/components/staff/ChiefMentorStudentsManager";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorStudentsPage(){
  const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
  const [{data:students},{data:teams}]=await Promise.all([
    supabase.from("profiles").select("id,full_name,email,phone,status").eq("role","STUDENT").order("full_name"),
    supabase.from("teams").select("id,name,capacity,status").eq("status","ACTIVE").order("name")
  ]);
  const studentIds=(students??[]).map(x=>x.id);
  const teamIds=(teams??[]).map(x=>x.id);
  const [{data:members},{data:scores},{data:reports},{data:taskSubs},{data:video}]=await Promise.all([
    studentIds.length?supabase.from("team_members").select("student_id,team_id").in("student_id",studentIds).eq("status","ACTIVE"):Promise.resolve({data:[] as Array<{student_id:string;team_id:string}>}),
    studentIds.length?supabase.from("score_events").select("student_id,points").in("student_id",studentIds):Promise.resolve({data:[] as Array<{student_id:string;points:number}>}),
    studentIds.length?supabase.from("daily_reports").select("student_id,id").in("student_id",studentIds):Promise.resolve({data:[] as Array<{student_id:string;id:string}>}),
    studentIds.length?supabase.from("task_submissions").select("student_id,id").in("student_id",studentIds):Promise.resolve({data:[] as Array<{student_id:string;id:string}>}),
    studentIds.length?supabase.from("video_progress").select("student_id,watched_percent").in("student_id",studentIds):Promise.resolve({data:[] as Array<{student_id:string;watched_percent:number|null}>}),
  ]);
  const membershipMap=new Map((members??[]).map(x=>[x.student_id,x.team_id]));
  const teamMap=new Map((teams??[]).map(x=>[x.id,x]));
  const mentorByTeam=new Map<string,string>();
  if(teamIds.length){
    const {data:teamRows}=await supabase.from("teams").select("id,mentor_id").in("id",teamIds);
    for(const t of teamRows??[])if(t.mentor_id)mentorByTeam.set(t.id,t.mentor_id);
  }
  const mentorUserIds=[...mentorByTeam.values()];
  const {data:mentorProfiles}=mentorUserIds.length?await supabase.from("profiles").select("id,full_name").in("id",mentorUserIds):{data:[] as Array<{id:string;full_name:string}>};
  const mentorMap=new Map((mentorProfiles??[]).map(x=>[x.id,x.full_name]));
  const avg=new Map<string,number[]>();for(const x of attendance??[])avg.set(x.student_id,[...(avg.get(x.student_id)??[]),Number(x.attendance_percent??0)]);
  const score=new Map<string,number>();for(const x of scores??[])score.set(x.student_id,(score.get(x.student_id)??0)+Number(x.points??0));
  const reportCount=new Map<string,number>();for(const x of reports??[])reportCount.set(x.student_id,(reportCount.get(x.student_id)??0)+1);
  const taskCount=new Map<string,number>();for(const x of taskSubs??[])taskCount.set(x.student_id,(taskCount.get(x.student_id)??0)+1);
  const videoAvg=new Map<string,number[]>();for(const x of video??[])videoAvg.set(x.student_id,[...(videoAvg.get(x.student_id)??[]),Number(x.watched_percent??0)]);

  const initialStudents=(students??[]).map(s=>{
    const teamId=membershipMap.get(s.id);const values=avg.get(s.id)??[];const vv=videoAvg.get(s.id)??[];
    const mentorId=teamId?mentorByTeam.get(teamId):undefined;
    return { ...s,team_id:teamId??null,team_name:teamId?teamMap.get(teamId)?.name??null:null,mentor_name:mentorId?mentorMap.get(mentorId)??null:null,score:Math.round(score.get(s.id)??0),report_count:reportCount.get(s.id)??0,task_count:taskCount.get(s.id)??0,video:vv.length?vv.reduce((a,b)=>a+b,0)/vv.length:0 };
  });
  const initialTeams=(teams??[]).map(t=>({id:t.id,name:t.name,capacity:t.capacity,count:(members??[]).filter(m=>m.team_id===t.id).length}));
  return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Оқушылар" description="Оқушының ілгерілеуі, командасы және оқу нәтижелері.">
    <PageContainer><div className="space-y-5">
      <SectionHeader eyebrow="ОҚУШЫЛАР" title="Барлық оқушылар" description="Іздеу, сүзгі және команда ауыстыру." action={<Link href="/chief-mentor/teams" className="inline-flex min-h-10 items-center gap-2 rounded-[12px] border border-[#E8E1DA] bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#3F3832]"><Users size={14}/> Командалар</Link>}/>
      <Card className="overflow-hidden"><div className="hidden grid-cols-[1.45fr_1fr_100px_100px_110px_190px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] lg:grid"><span>Оқушы</span><span>Команда</span><span>Ұпай</span><span>Қатысу</span><span>Статус</span><span className="text-right">Команданы өзгерту</span></div><ChiefMentorStudentsManager initialStudents={initialStudents} teams={initialTeams}/></Card>
    </div></PageContainer>
  </AppShell>;
}
