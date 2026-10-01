import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function LeaderStudentsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const { data: students } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,status,education_place,created_at")
    .eq("role", "STUDENT")
    .order("created_at", { ascending: false })
    .limit(200);

  const ids = (students ?? []).map((item) => item.id);
  const { data: memberships } = ids.length
    ? await supabase.from("team_members").select("student_id,team_id,teams(name)").in("student_id", ids).eq("status", "ACTIVE")
    : { data: [] as Array<{ student_id: string; team_id: string; teams: unknown }> };

  const teamMap = new Map<string, string>();
  for (const item of memberships ?? []) {
    const team = Array.isArray(item.teams) ? item.teams[0] : item.teams;
    if (team && typeof team === "object" && "name" in team) teamMap.set(item.student_id, String(team.name));
  }

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Оқушылар" description="Студенттердің status және team байланысын бақылау.">
      <PageContainer>
        <div className="space-y-5">
          <SectionHeader eyebrow="STUDENTS" title="Оқушылар" description="Барлық студенттердің қазіргі статусы мен командасы." />
          <Card className="overflow-hidden">
            <div className="hidden grid-cols-[1.2fr_1.2fr_1fr_130px] gap-3 border-b border-[#EFE8E1] bg-[#FFFCF9] px-6 py-3 text-[9px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] sm:grid">
              <span>Оқушы</span><span>Байланыс</span><span>Команда</span><span>Статус</span>
            </div>
            <div className="divide-y divide-[#EFE8E1]">
              {(students ?? []).map((student) => (
                <div key={student.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.2fr_1.2fr_1fr_130px] sm:items-center sm:px-6">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-[#FFF0E8] text-[#FF6F2C]"><GraduationCap size={14} /></span>
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-extrabold text-[#354153]">{student.full_name}</p>
                      <p className="mt-1 truncate text-[9px] text-[#9A9189]">{student.education_place}</p>
                    </div>
                  </div>
                  <div className="text-[9px] font-semibold text-[#8B8179]">
                    <p>{student.phone}</p>
                    <p className="mt-1 truncate">{student.email}</p>
                  </div>
                  <Link href="/leader/teams" className="text-[10px] font-extrabold text-[#172235] hover:text-[#FF6F2C]">{teamMap.get(student.id) ?? "Команда жоқ"}</Link>
                  <StatusPill tone={student.status === "ACTIVE" ? "green" : student.status === "INACTIVE" ? "red" : "orange"}>{student.status}</StatusPill>
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
