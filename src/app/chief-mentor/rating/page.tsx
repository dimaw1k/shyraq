import { Crown, Trophy } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorRatingPage(){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const [{data:mentors},{data:teams},{data:members},{data:scores},{data:attendance}]=await Promise.all([
   supabase.from("profiles").select("id,full_name").eq("role","MENTOR").eq("status","ACTIVE").order("full_name"),
   supabase.from("teams").select("id,name,mentor_id").eq("status","ACTIVE").order("name"),
   supabase.from("team_members").select("team_id,student_id").eq("status","ACTIVE"),
   supabase.from("score_events").select("student_id,team_id,points"),
   supabase.from("attendance_records").select("student_id,team_id,attendance_percent"),
 ]);
 const scoreByStudent=new Map<string,number>();for(const r of scores??[])scoreByStudent.set(r.student_id,(scoreByStudent.get(r.student_id)??0)+Number(r.points??0));
 const attByStudent=new Map<string,number[]>();for(const r of attendance??[])attByStudent.set(r.student_id,[...(attByStudent.get(r.student_id)??[]),Number(r.attendance_percent??0)]);
 const studentRows=[...(members??[])].map(m=>{const a=attByStudent.get(m.student_id)??[];return{...m,score:scoreByStudent.get(m.student_id)??0,attendance:a.length?a.reduce((x,y)=>x+y,0)/a.length:0};}).sort((a,b)=>b.score-a.score);
 const studentIds=studentRows.map(x=>x.student_id);
 const {data:students}=studentIds.length?await supabase.from("profiles").select("id,full_name").in("id",studentIds):{data:[] as Array<{id:string;full_name:string}>};
 const studentNames=new Map((students??[]).map(x=>[x.id,x.full_name]));
 const teamRows=(teams??[]).map(t=>{const ms=studentRows.filter(x=>x.team_id===t.id);const score=ms.length?ms.reduce((a,b)=>a+b.score,0):0;const att=ms.length?ms.reduce((a,b)=>a+b.attendance,0)/ms.length:0;return{...t,score,attendance:att,students:ms.length};}).sort((a,b)=>b.score-a.score);
 const mentorRows=(mentors??[]).map(m=>{const ts=teamRows.filter(t=>t.mentor_id===m.id);return{...m,score:ts.reduce((a,b)=>a+b.score,0),attendance:ts.length?ts.reduce((a,b)=>a+b.attendance,0)/ts.length:0,teams:ts.length};}).sort((a,b)=>b.score-a.score);
 const block=(title:string,items:Array<{id:string;name:string;score:number;attendance:number;meta:string}>)=><Card className="overflow-hidden"><div className="border-b border-[#EFE8E1] px-5 py-4 flex items-center justify-between"><p className="text-[13px] font-extrabold text-[#172235]">{title}</p><Trophy size={16} className="text-[var(--accent)]"/></div><div className="divide-y divide-[#EFE8E1]">{items.map((x,i)=><div key={x.id} className="grid grid-cols-[34px_1fr_90px_90px] gap-3 px-5 py-4 sm:grid-cols-[38px_1fr_100px_100px]"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#172235] text-[9px] font-extrabold text-white">{String(i+1).padStart(2,"0")}</span><div><p className="truncate text-[10px] font-extrabold text-[#354153]">{x.name}</p><p className="mt-1 text-[8px] text-[#9A9189]">{x.meta}</p></div><p className="text-[10px] font-extrabold text-[#4B433C]">{x.score} ұпай</p><StatusPill tone={x.attendance>=85?"green":x.attendance>=60?"orange":"red"}>{x.attendance.toFixed(0)}%</StatusPill></div>)}{!items.length?<div className="p-8 text-center text-xs text-[#8B8179]">Дерек жоқ.</div>:null}</div></Card>;
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Рейтинг" description="Ментор, команда және оқушы нәтижелері."><PageContainer><div className="space-y-5"><SectionHeader eyebrow="РЕЙТИНГ" title="Нәтиже рейтингі" description="Формула: қатысу + тапсырма/есептерден жиналған ұпай + бейне/тест нәтижелерінің ұпайлары."/><div className="grid gap-5 xl:grid-cols-3">{block("Ментор",mentorRows.map(x=>({id:x.id,name:x.full_name,score:x.score,attendance:x.attendance,meta:x.teams+" команда"})))}{block("Команда",teamRows.map(x=>({id:x.id,name:x.name,score:x.score,attendance:x.attendance,meta:x.students+" оқушы"})))}{block("Оқушы",studentRows.slice(0,50).map(x=>({id:x.student_id,name:studentNames.get(x.student_id)??"Оқушы",score:x.score,attendance:x.attendance,meta:"Команда"})))}</div></div></PageContainer></AppShell>;
}
