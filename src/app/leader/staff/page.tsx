import { Users } from "lucide-react";
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
            <div className="hidden grid-cols-[1.2fr_1fr_1.2fr_110px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] sm:grid">
              <span>Қызметкер</span><span>Рөл</span><span>Байланыс</span><span>Статус</span>
            </div>
            <div className="divide-y divide-[#EFE8E1]">
              {(staff ?? []).map((person) => (
                <div key={person.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.2fr_1fr_1.2fr_110px] sm:items-center sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#172235] text-white"><Users size={14} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold text-[#354153]">{person.full_name}</p>
                      <p className="mt-1 truncate text-[9px] text-[#9A9189]">{person.email}</p>
                    </div>
                  </div>
                  <p className="text-[10px] font-extrabold text-[#4B433C]">{roleLabel(person.role)}</p>
                  <div className="text-[9px] font-semibold text-[#8B8179]">
                    <p>{person.phone}</p>
                    <p className="mt-1 truncate">{person.email}</p>
                  </div>
                  <StatusPill tone={tone(person.status)}>{person.status}</StatusPill>
                </div>
              ))}
              {!staff?.length ? <div className="p-8"><EmptyState title="Staff табылмады." /></div> : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
