import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, ProgressBar, SectionHeader } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorAnalyticsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const [{ data: attendance }, { data: reports }, { data: submissions }, { data: videos }] = await Promise.all([
    supabase.from("attendance_records").select("attendance_percent"),
    supabase.from("daily_reports").select("status"),
    supabase.from("task_submissions").select("status"),
    supabase.from("video_progress").select("watched_percent"),
  ]);
  const attendanceValue=attendance?.length?attendance.reduce((sum,row)=>sum+Number(row.attendance_percent??0),0)/attendance.length:0;
  const reportValue=reports?.length?(reports.filter((row)=>row.status==="SUBMITTED").length/reports.length)*100:0;
  const submissionValue=submissions?.length?(submissions.filter((row)=>row.status==="SUBMITTED"||row.status==="REVIEWED").length/submissions.length)*100:0;
  const videoValue=videos?.length?videos.reduce((sum,row)=>sum+Number(row.watched_percent??0),0)/videos.length:0;
  return <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Аналитика"><PageContainer><div className="space-y-5"><SectionHeader eyebrow="АНАЛИТИКА" title="Операциялық аналитика" description="Нақты деректерден есептеледі."/><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><MetricCard label="ҚАТЫСУ" value={attendanceValue.toFixed(1)+"%"} hint="орташа" icon={<BarChart3 size={17}/>}/><MetricCard label="ЕСЕПТЕР" value={reportValue.toFixed(1)+"%"} hint="жіберілгені"/><MetricCard label="ТАПСЫРМАЛАР" value={submissionValue.toFixed(1)+"%"} hint="орындалуы"/><MetricCard label="БЕЙНЕ" value={videoValue.toFixed(1)+"%"} hint="орташа қарау"/></section><Card className="p-5"><div className="space-y-5"><ProgressBar value={attendanceValue} label="Қатысу"/><ProgressBar value={reportValue} label="Күндік есеп"/><ProgressBar value={submissionValue} label="Тапсырма жіберу"/><ProgressBar value={videoValue} label="Бейне прогресі"/></div></Card></div></PageContainer></AppShell>;
}
