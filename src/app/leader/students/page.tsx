import { GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function LeaderStudentsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const { data: students } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,status,education_type,created_at")
    .eq("role", "STUDENT")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Оқушылар">
      <PageContainer>
        <div className="space-y-4">
          <SectionHeader eyebrow="ОҚУШЫЛАР" title="Оқушылар" description="Статус пен команданы бақылау." />
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1.2fr_1.25fr_140px_130px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] sm:grid">
              <span>Оқушы</span><span>Байланыс</span><span>Білім</span><span>Статус</span>
            </div>
            <div className="divide-y divide-[#EFE8E1]">
              {(students ?? []).map((student) => (
                <div key={student.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.2fr_1.25fr_140px_130px] sm:items-center sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF1E2] text-[#FF8000]"><GraduationCap size={14} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold text-[#354153]">{student.full_name}</p>
                      <p className="mt-1 truncate text-[9px] text-[#9A9189]">{student.email}</p>
                    </div>
                  </div>
                  <div className="text-[9px] font-semibold text-[#8B8179]">
                    <p>{student.phone}</p>
                    <p className="mt-1 truncate">{student.email}</p>
                  </div>
                  <p className="text-[10px] font-extrabold text-[#4B433C]">
                    {student.education_type === "SCHOOL" ? "Мектеп" : student.education_type === "COLLEGE" ? "Колледж" : student.education_type === "UNIVERSITY" ? "Университет" : "Басқа"}
                  </p>
                  <StatusPill tone={student.status === "ACTIVE" ? "green" : student.status === "INACTIVE" ? "red" : "orange"}>
                    {student.status === "ACTIVE" ? "Белсенді" : student.status === "INACTIVE" ? "Өшірулі" : student.status === "WAITING_FOR_TEAM" ? "Команда күтілуде" : student.status === "REGISTERED" ? "Тіркелген" : "Аяқтаған"}
                  </StatusPill>
                </div>
              ))}
              {!students?.length ? <div className="p-8"><EmptyState title="Оқушы жоқ." /></div> : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
