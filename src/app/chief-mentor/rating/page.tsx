import { Crown, Trophy } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorRatingPage(){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const [{data:mentors},{data:teams},{data:members},{data:scores}]=await Promise.all([
   supabase.from("profiles").select("id,full_name").eq("role","MENTOR").eq("status","ACTIVE").order("full_name"),
   supabase.from("teams").select("id,name,mentor_id").eq("status","ACTIVE").order("name"),
   supabase.from("team_members").select("team_id,student_id").eq("status","ACTIVE"),
   supabase.from("score_events").select("student_id,team_id,points"),
 ]);
 const scoreByStudent=new Map<string,number>();for(const row of scores??[])scoreByStudent.set(row.student_id,(scoreByStudent.get(row.student_id)??0)+Number(row.points??0));
 const studentRows=[...(members??[])].map(member=>({...member,score:scoreByStudent.get(member.student_id)??0})).sort((a,b)=>b.score-a.score);
 const studentIds=studentRows.map(row=>row.student_id);
 const {data:students}=studentIds.length?await supabase.from("profiles").select("id,full_name").in("id",studentIds):{data:[] as Array<{id:string;full_name:string}>};
 const studentNames=new Map((students??[]).map(row=>[row.id,row.full_name]));
 const teamRows=(teams??[]).map(team=>{const ms=studentRows.filter(row=>row.team_id===team.id);const score=ms.reduce((sum,row)=>sum+row.score,0);return{...team,score,students:ms.length};}).sort((a,b)=>b.score-a.score);
 const mentorRows=(mentors??[]).map(mentor=>{const ts=teamRows.filter(team=>team.mentor_id===mentor.id);return{...mentor,score:ts.reduce((sum,team)=>sum+team.score,0),teams:ts.length};}).sort((a,b)=>b.score-a.score);
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Рейтинг" description="Ментор, команда және оқушы нәтижелері."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="РЕЙТИНГ" title="Нәтиже рейтингі" description="Ұпайлар бойынша нәтиже рейтингі."/><div className="grid gap-5 xl:grid-cols-3">{[
  {title:"Ментор",items:mentorRows.map(row=>({id:row.id,name:row.full_name,score:row.score,meta:row.teams+" команда"}))},
  {title:"Команда",items:teamRows.map(row=>({id:row.id,name:row.name,score:row.score,meta:row.students+" оқушы"}))},
  {title:"Оқушы",items:studentRows.slice(0,50).map(row=>({id:row.student_id,name:studentNames.get(row.student_id)??"Оқушы",score:row.score,meta:"Команда"}))}
].map(block=><Card key={block.title} className="overflow-hidden"><div className="border-b border-[#EFE8E1] px-5 py-4 flex items-center justify-between"><p className="text-[13px] font-extrabold text-[#172235]">{block.title}</p><Trophy size={16} className="text-[var(--accent)]"/></div><div className="divide-y divide-[#EFE8E1]">{block.items.map((row,index)=><div key={row.id} className="grid grid-cols-[34px_1fr_90px] gap-3 px-5 py-4 sm:grid-cols-[38px_1fr_100px]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#FFF1E2] text-[9px] font-extrabold text-[#B95D00]">{String(index+1).padStart(2,"0")}</span><div><p className="truncate text-[10px] font-extrabold text-[#354153]">{row.name}</p><p className="mt-1 text-[8px] text-[#9A9189]">{row.meta}</p></div><p className="text-[10px] font-extrabold text-[#4B433C]">{row.score} ұпай</p></div>)}{!block.items.length?<div className="p-8 text-center text-xs text-[#8B8179]">Дерек жоқ.</div>:null}</div></Card>)}</div></div></PageContainer></AppShell>;
}
