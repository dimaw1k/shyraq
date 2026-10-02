import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorTeamProfilePage({params}:{params:Promise<{id:string}>}){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");const {id}=await params;
 const {data:team}=await supabase.from("teams").select("id,name,mentor_id,capacity,status,created_at").eq("id",id).maybeSingle();
 if(!team)notFound();
 const [{data:members},{data:mentor}]=await Promise.all([
   supabase.from("team_members").select("student_id").eq("team_id",id).eq("status","ACTIVE"),
   team.mentor_id?supabase.from("profiles").select("id,full_name,phone,email").eq("id",team.mentor_id).maybeSingle():Promise.resolve({data:null})
 ]);
 const ids=(members??[]).map(x=>x.student_id);
 const {data:students}=ids.length?await supabase.from("profiles").select("id,full_name,email,phone,status").in("id",ids).order("full_name"):{data:[] as Array<{id:string;full_name:string;email:string;phone:string;status:string}>};
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title={team.name} description="Команда бейіні">
  <PageContainer><div className="space-y-5">
   <Link href="/chief-mentor/teams" className="inline-flex items-center gap-2 text-[10px] font-extrabold text-[#7D746C]"><ArrowLeft size={13}/> Командаларға қайту</Link>
   <SectionHeader eyebrow="КОМАНДА БЕЙІНІ" title={team.name} description={(mentor?.full_name??"Ментор бекітілмеген")+" · "+(members?.length??0)+"/"+(team.capacity??"—")+" оқушы"} action={<StatusPill tone={team.status==="ACTIVE"?"green":"red"}>{team.status}</StatusPill>}/>
   <Card className="overflow-hidden"><div className="border-b border-[#EFE8E1] px-5 py-4 flex items-center justify-between"><div><p className="text-[13px] font-extrabold text-[#172235]">Оқушылар</p><p className="text-[9px] text-[#8B8179]">Командадағы барлық белсенді мүшелер</p></div><Users size={17} className="text-[var(--accent)]"/></div><div className="divide-y divide-[#EFE8E1]">{(students??[]).map(s=><Link key={s.id} href="/chief-mentor/students" className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-[#FFFBF6]"><div className="min-w-0"><p className="truncate text-[11px] font-extrabold text-[#354153]">{s.full_name}</p><p className="mt-1 truncate text-[9px] text-[#9A9189]">{s.email} · {s.phone}</p></div><StatusPill tone={s.status==="ACTIVE"?"green":"orange"}>{s.status}</StatusPill></Link>)}{!students?.length?<div className="p-8 text-center text-xs font-semibold text-[#8B8179]">Командада оқушы жоқ.</div>:null}</div></Card>
  </div></PageContainer>
 </AppShell>;
}
