import { AppShell } from "@/components/app/AppNav";
import { PageContainer } from "@/components/ui/ShyraqUI";
import { TaskSubmissionReviewQueue } from "@/components/staff/TaskSubmissionReviewQueue";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { getStaffTaskSubmissions } from "@/lib/staff/task-submissions";

export default async function LeaderSubmissionsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const submissions = await getStaffTaskSubmissions(supabase);

  return (
    <AppShell
      role="LEADER"
      userName={profile.full_name}
      title="Тапсырма тексеруі"
      
    >
      <PageContainer>
        <div className="space-y-5">
          <TaskSubmissionReviewQueue submissions={submissions} />
        </div>
      </PageContainer>
    </AppShell>
  );
}
