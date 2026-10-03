import { AppShell } from "@/components/app/AppNav";
import { PageContainer } from "@/components/ui/ShyraqUI";
import { TaskSubmissionReviewQueue } from "@/components/staff/TaskSubmissionReviewQueue";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { getStaffTaskSubmissions } from "@/lib/staff/task-submissions";
import { MarathonDayNavigator } from "@/components/staff/MarathonDayNavigator";

export default async function LeaderSubmissionsPage({ searchParams }: { searchParams?: Promise<{ day?: string }> }) {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const selectedDay = Math.min(21, Math.max(1, Number((await searchParams)?.day ?? 1) || 1));
  const submissions = (await getStaffTaskSubmissions(supabase)).filter((submission) => submission.task_marathon_day === selectedDay);

  return (
    <AppShell
      role="LEADER"
      userName={profile.full_name}
      title="Тапсырма тексеруі"
      
    >
      <PageContainer>
        <div className="space-y-5">
          <MarathonDayNavigator basePath="/leader/submissions" selectedDay={selectedDay} />
          <TaskSubmissionReviewQueue submissions={submissions} />
        </div>
      </PageContainer>
    </AppShell>
  );
}
