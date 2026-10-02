import { AppShell } from "@/components/app/AppNav";
import { PageContainer } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { MentorTaskRequestQueue } from "@/components/staff/MentorTaskRequestQueue";

export default async function LeaderTasksPage() {
  const { profile } = await getAuthenticatedStaff("LEADER");

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Тапсырмалар">
      <PageContainer>
        <MentorTaskRequestQueue />
      </PageContainer>
    </AppShell>
  );
}
