import { AppShell } from "@/components/app/AppNav";
import { PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { TaskSubmissionReviewQueue } from "@/components/staff/TaskSubmissionReviewQueue";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { getStaffTaskSubmissions } from "@/lib/staff/task-submissions";

export default async function ChiefMentorSubmissionsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const submissions = await getStaffTaskSubmissions(supabase);

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Тапсырмаларды тексеру"
      description="Барлық mentor командаларынан келген тапсырма submission-дарын бақылау."
    >
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="REVIEW"
            title="Тапсырмаларды тексеру"
            description="Главный ментор барлық командалардың submission сапасын тексеріп, нәтижені бекітеді."
          />
          <TaskSubmissionReviewQueue submissions={submissions} />
        </div>
      </PageContainer>
    </AppShell>
  );
}
