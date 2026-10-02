import Link from "next/link";
import { Activity, BarChart3, CheckCircle2, Download, Video } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, ProgressBar, SectionHeader } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorAnalyticsPage({searchParams}:{searchParams:Promise<{range?:string}>}){
 const {supabase,profile}=await getAuthenticatedStaff("CHIEF_MENTOR");
 const params=await searchParams;const days=7;const start=new Date(Date.now()-days*86400000).toISOString();
 const [{data:attendance},{data:reports},{data:subs},{data:video}]=await Promise.all([
  supabase.from("attendance_records").select("attendance_percent").gte("imported_at",start),
  supabase.from("daily_reports").select("status").gte("report_date",start.slice(0,10)),
  supabase.from("task_submissions").select("status").gte("submitted_at",start),
  supabase.from("video_progress").select("watched_percent").gte("updated_at",start),
 ]);
 const avg=(rows:any[],key:string)=>rows.length?rows.reduce((a,r)=>a+Number(r[key]??0),0)/rows.length:0;
 const attendanceValue=avg(attendance??[],"attendance_percent");
 const reportValue=(reports??[]).length?((reports??[]).filter(r=>r.status==="SUBMITTED"||r.status==="REVIEWED").length/(reports??[]).length)*100:0;
 const submissionValue=(subs??[]).length?((subs??[]).filter(r=>r.status==="SUBMITTED"||r.status==="REVIEWED").length/(subs??[]).length)*100:0;
 const videoValue=avg(video??[],"watched_percent");
 return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Аналитика" description="Оқу процесінің KPI және кезеңдік фильтрі."><PageContainer><div className="space-y-5">
  <SectionHeader eyebrow="АНАЛИТИКА" title="Операциялық аналитика" description={days+" күндік дерек бойынша есептелді."} action={<div className="flex flex-wrap gap-2"><Link href="/chief-mentor/analytics?range=7" className={["rounded-[10px] px-3 py-2 text-[9px] font-extrabold",days===7?"bg-[#172235] text-white":"border border-[#E8E1DA] bg-white text-[#4B433C]"].join(" ")}>7 күн</Link><a href="/api/chief-mentor/analytics/export?range=7" className="inline-flex items-center gap-2 rounded-[10px] bg-[var(--accent)] px-3 py-2 text-[9px] font-extrabold text-white"><Download size={12}/> CSV</a></div>}/>
  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="ҚАТЫСУ" value={attendanceValue.toFixed(1)+"%"} hint="орташа" icon={<Activity size={17}/>}/><MetricCard label="ЕСЕП" value={reportValue.toFixed(1)+"%"} hint="жіберілген/қаралған" icon={<CheckCircle2 size={17}/>}/><MetricCard label="ТАПСЫРМА" value={submissionValue.toFixed(1)+"%"} hint="submission activity" icon={<BarChart3 size={17}/>}/><MetricCard label="БЕЙНЕ" value={videoValue.toFixed(1)+"%"} hint="орташа қарау" icon={<Video size={17}/>}/></section>
  <Card className="p-5"><div className="space-y-5"><ProgressBar value={attendanceValue} label="Attendance"/><ProgressBar value={reportValue} label="Daily report"/><ProgressBar value={submissionValue} label="Task submission"/><ProgressBar value={videoValue} label="Video progress"/></div></Card>
  <Card className="p-5"><p className="text-[9px] font-extrabold uppercase tracking-[.14em] text-[var(--accent)]">КЕЗЕҢ</p><p className="mt-2 text-[13px] font-extrabold text-[#172235]">Фильтр және экспорт</p><p className="mt-1 text-[9px] text-[#8B8179]">CSV файлын Excel арқылы да аша аласыз.</p></Card>
 </div></PageContainer></AppShell>;
}
