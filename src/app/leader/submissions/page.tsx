import { AppShell } from "@/components/app/AppNav";
import { PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
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
      description="Барлық командалар бойынша тапсырма submission-дарының бақылау орталығы."
    >
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="REVIEW"
            title="Тапсырма тексеруі"
            description="Лидер барлық submission нәтижесін көреді және қажет жағдайда review жасай алады."
          />
          <TaskSubmissionReviewQueue submissions={submissions} />
        </div>
      </PageContainer>
    </AppShell>
  );
}
