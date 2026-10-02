import { Activity, BarChart3, CheckCircle2, Video } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, ProgressBar, SectionHeader } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorAnalyticsPage(){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const [{data:attendance},{data:reports},{data:subs},{data:video}]=await Promise.all([
  supabase.from("attendance_records").select("attendance_percent"),
  supabase.from("daily_reports").select("status"),
  supabase.from("task_submissions").select("status"),
  supabase.from("video_progress").select("watched_percent"),
 ]);
 const avg=(rows:Array<Record<string,unknown>>,key:string)=>rows.length?rows.reduce((a,r)=>a+Number(r[key]??0),0)/rows.length:0;
 const attendanceValue=avg(attendance??[],"attendance_percent");
 const reportValue=(reports??[]).length?((reports??[]).filter(r=>r.status==="SUBMITTED"||r.status==="REVIEWED").length/(reports??[]).length)*100:0;
 const submissionValue=(subs??[]).length?((subs??[]).filter(r=>r.status==="SUBMITTED"||r.status==="REVIEWED").length/(subs??[]).length)*100:0;
 const videoValue=avg(video??[],"watched_percent");
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Аналитика" description="Оқу процесінің KPI және салыстырмалы көрсеткіштері."><PageContainer><div className="space-y-5">
  <SectionHeader eyebrow="АНАЛИТИКА" title="Операциялық аналитика" description="Нақты деректерден есептелетін негізгі performance көрсеткіштері."/>
  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="ҚАТЫСУ" value={attendanceValue.toFixed(1)+"%"} hint="average" icon={<Activity size={17}/>}/><MetricCard label="ЕСЕП" value={reportValue.toFixed(1)+"%"} hint="жіберілген/қаралған" icon={<CheckCircle2 size={17}/>}/><MetricCard label="ТАПСЫРМА" value={submissionValue.toFixed(1)+"%"} hint="submission activity" icon={<BarChart3 size={17}/>}/><MetricCard label="БЕЙНЕ" value={videoValue.toFixed(1)+"%"} hint="орташа қарау" icon={<Video size={17}/>}/></section>
  <Card className="p-5"><div className="space-y-5"><ProgressBar value={attendanceValue} label="Attendance"/><ProgressBar value={reportValue} label="Daily report"/><ProgressBar value={submissionValue} label="Task submission"/><ProgressBar value={videoValue} label="Video progress"/></div></Card>
  <section className="grid gap-4 md:grid-cols-2"><Card className="p-5"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">АПТА</p><p className="mt-2 text-[22px] font-extrabold text-[#172235]">Апталық салыстыру</p><p className="mt-1 text-[10px] text-[#8B8179]">Негізгі KPI-ді кезең бойынша салыстыруға арналған бөлім.</p></Card><Card className="p-5"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">ЭКСПОРТ</p><p className="mt-2 text-[22px] font-extrabold text-[#172235]">CSV / Excel</p><p className="mt-1 text-[10px] text-[#8B8179]">Деректерді экспорттауға арналған бөлік.</p></Card></section>
 </div></PageContainer></AppShell>;
}
