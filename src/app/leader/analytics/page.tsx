import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, ProgressBar, SectionHeader } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function LeaderAnalyticsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const [{ data: attendance }, { count: reports }, { data: submissions }, { data: videos }] = await Promise.all([
    supabase.from("attendance_records").select("attendance_percent"),
    supabase.from("daily_reports").select("*", { count: "exact", head: true }).eq("status", "SUBMITTED"),
    supabase.from("task_submissions").select("status"),
    supabase.from("video_progress").select("watched_percent"),
  ]);

  const attendanceValue = attendance?.length ? attendance.reduce((sum, row) => sum + Number(row.attendance_percent ?? 0), 0) / attendance.length : 0;
  const submitted = submissions?.filter((row) => row.status === "SUBMITTED").length ?? 0;
  const reviewed = submissions?.filter((row) => row.status === "REVIEWED").length ?? 0;
  const submissionValue = submissions?.length ? ((submitted + reviewed) / submissions.length) * 100 : 0;
  const videoValue = videos?.length ? videos.reduce((sum, row) => sum + Number(row.watched_percent ?? 0), 0) / videos.length : 0;

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Аналитика" description="Марафонның жалпы learning және operations көрсеткіштері.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="ANALYTICS" title="Жалпы аналитика" description="Көрсеткіштер тікелей attendance, reports, submissions және video progress кестелерінен есептеледі." />
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="ATTENDANCE" value={attendanceValue.toFixed(1) + "%"} hint="орташа" icon={<BarChart3 size={17} />} />
            <MetricCard label="REPORTS" value={String(reports ?? 0)} hint="submitted" />
            <MetricCard label="SUBMISSIONS" value={submissionValue.toFixed(1) + "%"} hint="submitted + reviewed" />
            <MetricCard label="VIDEO" value={videoValue.toFixed(1) + "%"} hint="average watched" />
          </section>
          <Card className="p-5">
            <div className="space-y-5">
              <ProgressBar value={attendanceValue} label="Attendance" />
              <ProgressBar value={submissionValue} label="Task submission lifecycle" />
              <ProgressBar value={videoValue} label="Video progress" />
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
