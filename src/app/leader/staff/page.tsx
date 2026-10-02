import { AppShell } from "@/components/app/AppNav";
import { LeaderStaffManager } from "@/components/staff/LeaderStaffManager";
import { Card, PageContainer } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function LeaderStaffPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const { data: staff } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,role,status,created_at")
    .in("role", ["MENTOR", "CHIEF_MENTOR", "LEADER"])
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <AppShell
      role="LEADER"
      userName={profile.full_name}
      title="Қызметкерлер"
    >
      <PageContainer>
        <div className="space-y-5">
          <Card className="overflow-visible">
            <div className="hidden grid-cols-[1.15fr_170px_1fr_185px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] sm:grid">
              <span>Қызметкер</span><span>Рөл</span><span>Байланыс</span><span>Статус</span>
            </div>
            <LeaderStaffManager initialStaff={staff ?? []} />
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
