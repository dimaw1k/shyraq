import { AppShell } from "@/components/app/AppNav";
import { PageContainer } from "@/components/ui/ShyraqUI";
import { TaskSubmissionReviewQueue } from "@/components/staff/TaskSubmissionReviewQueue";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { getStaffTaskSubmissions } from "@/lib/staff/task-submissions";

export default async function ChiefMentorSubmissionsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const submissions = (await getStaffTaskSubmissions(supabase)).filter((submission) => submission.submitted_late || submission.status === "REJECTED");

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Проблемалы тапсырмаларды тексеру"
      
    >
      <PageContainer>
        <div className="space-y-5">
          <TaskSubmissionReviewQueue submissions={submissions} />
        </div>
      </PageContainer>
    </AppShell>
  );
}
