import Link from "next/link";
import { ArrowLeft, BarChart3, MessageCircle, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorMentorProfilePage({params}:{params:Promise<{id:string}>}){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");const {id}=await params;
 const {data:mentor}=await supabase.from("profiles").select("id,full_name,email,phone,status,created_at").eq("id",id).eq("role","MENTOR").maybeSingle();
 if(!mentor)notFound();
 const {data:teams}=await supabase.from("teams").select("id,name,capacity,status").eq("mentor_id",id).order("name");
 const teamIds=(teams??[]).map(x=>x.id);
 const [{data:members},{data:attendance},{data:reports},{data:subs}]=await Promise.all([
   teamIds.length?supabase.from("team_members").select("team_id,student_id").in("team_id",teamIds).eq("status","ACTIVE"):Promise.resolve({data:[] as Array<{team_id:string;student_id:string}>}),
   teamIds.length?supabase.from("attendance_records").select("team_id,attendance_percent").in("team_id",teamIds):Promise.resolve({data:[] as Array<{team_id:string;attendance_percent:number|null}>}),
   teamIds.length?supabase.from("daily_reports").select("id,student_id,status").in("student_id",(await supabase.from("team_members").select("student_id").in("team_id",teamIds).eq("status","ACTIVE")).data?.map(x=>x.student_id)??[]):Promise.resolve({data:[] as Array<{id:string;student_id:string;status:string}>}),
   teamIds.length?supabase.from("task_submissions").select("id,student_id,status").in("student_id",(await supabase.from("team_members").select("student_id").in("team_id",teamIds).eq("status","ACTIVE")).data?.map(x=>x.student_id)??[]):Promise.resolve({data:[] as Array<{id:string;student_id:string;status:string}>}),
 ]);
 const studentCount=(members??[]).length;
 const av=(attendance??[]).map(x=>Number(x.attendance_percent??0));
 const attendanceAvg=av.length?av.reduce((a,b)=>a+b,0)/av.length:0;
 const reviewed=(subs??[]).filter(x=>x.status==="REVIEWED").length;
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title={mentor.full_name} description="Ментор профилі және performance">
   <PageContainer><div className="space-y-5">
    <Link href="/chief-mentor/mentors" className="inline-flex items-center gap-2 text-[10px] font-extrabold text-[#7D746C]"><ArrowLeft size={13}/> Менторларға қайту</Link>
    <SectionHeader eyebrow="MENTOR PROFILE" title={mentor.full_name} description={mentor.email+" · "+(mentor.phone||"Телефон жоқ")} action={<StatusPill tone={mentor.status==="ACTIVE"?"green":"red"}>{mentor.status}</StatusPill>}/>
    <section className="grid gap-3 sm:grid-cols-3"><MetricCard label="КОМАНДА" value={String((teams??[]).length)} hint="белсенді команда" icon={<Users size={17}/>}/><MetricCard label="ОҚУШЫ" value={String(studentCount)} hint="команда мүшелері" icon={<Users size={17}/>}/><MetricCard label="ҚАТЫСУ" value={attendanceAvg?attendanceAvg.toFixed(1)+"%":"—"} hint="орташа" icon={<BarChart3 size={17}/>}/></section>
    <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <Card className="overflow-hidden"><div className="border-b border-[#EFE8E1] px-5 py-4"><p className="text-[13px] font-extrabold text-[#172235]">Командалар</p></div><div className="divide-y divide-[#EFE8E1]">{(teams??[]).map(t=><Link key={t.id} href={"/chief-mentor/teams/"+t.id} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#FFFBF6]"><div><p className="text-[11px] font-extrabold text-[#354153]">{t.name}</p><p className="mt-1 text-[9px] text-[#9A9189]">Capacity {t.capacity??"—"} · {members?.filter(m=>m.team_id===t.id).length??0} оқушы</p></div><span className="text-[9px] font-extrabold text-[var(--accent)]">Ашу →</span></Link>)}{!teams?.length?<div className="p-8 text-center text-xs text-[#8B8179]">Команда жоқ.</div>:null}</div></Card>
      <div className="grid gap-4"><Card className="p-5"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">PERFORMANCE</p><p className="mt-2 text-[24px] font-extrabold text-[#172235]">{subs?.length??0}</p><p className="text-[10px] text-[#8B8179]">submission · {reviewed} тексерілген</p></Card><Card className="p-5"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">REPORTS</p><p className="mt-2 text-[24px] font-extrabold text-[#172235]">{reports?.length??0}</p><p className="text-[10px] text-[#8B8179]">daily reports</p></Card><Link href={"/chief-mentor/messages?mentorId="+mentor.id}><Card className="flex items-center justify-between p-5"><div><p className="text-[13px] font-extrabold text-[#172235]">Ментормен сөйлесу</p><p className="mt-1 text-[9px] text-[#8B8179]">Ішкі private chat</p></div><MessageCircle size={18} className="text-[var(--accent)]"/></Card></Link></div>
    </section>
   </div></PageContainer>
 </AppShell>;
}
