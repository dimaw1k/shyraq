import { Users } from "lucide-react";
import { LeaderStaffManager } from "@/components/staff/LeaderStaffManager";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

function roleLabel(role: string) {
  return role === "LEADER" ? "Лидер" : role === "CHIEF_MENTOR" ? "Главный ментор" : "Ментор";
}

function tone(status: string): "neutral" | "orange" | "green" | "red" {
  return status === "ACTIVE" ? "green" : status === "INACTIVE" ? "red" : "orange";
}

export default async function LeaderStaffPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const { data: staff } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,role,status,created_at")
    .in("role", ["MENTOR", "CHIEF_MENTOR", "LEADER"])
    .order("role", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Қызметкерлер" description="Лидердің staff басқару бөлімі.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="STAFF" title="Қызметкерлер" description="Иерархия: Лидер → Главный ментор → Ментор." />
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1.2fr_1fr_1.15fr_115px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] sm:grid">
              <span>Қызметкер</span><span>Рөл</span><span>Байланыс</span><span>Статус</span>
            </div>
            <LeaderStaffManager initialStaff={staff ?? []} />
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
