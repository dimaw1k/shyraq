import { AppShell } from "@/components/app/AppNav";
import { PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { TaskSubmissionReviewQueue } from "@/components/staff/TaskSubmissionReviewQueue";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { getStaffTaskSubmissions } from "@/lib/staff/task-submissions";

export default async function MentorSubmissionsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("MENTOR");
  const submissions = await getStaffTaskSubmissions(supabase);

  return (
    <AppShell
      role="MENTOR"
      userName={profile.full_name}
      title="Тапсырмаларды тексеру"
      description="Өз командаңыздың жіберген тапсырмаларын қарап, нәтижесін бекітіңіз."
    >
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="REVIEW"
            title="Тапсырмаларды тексеру"
            description="Тексеру кезінде approve жасалса, тапсырманың ұпайы автоматты түрде бір рет есептеледі."
          />
          <TaskSubmissionReviewQueue submissions={submissions} />
        </div>
      </PageContainer>
    </AppShell>
  );
}
