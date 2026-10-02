import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  FileClock,
  GraduationCap,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import {
  Card,
  EmptyState,
  MetricCard,
  PageContainer,
  PrimaryLink,
  SectionHeader,
  StatusPill,
} from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function LeaderPage() {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");

  const [
    { count: studentCount },
    { count: activeStudentCount },
    { count: staffCount },
    { count: mentorCount },
    { count: teamCount },
    { count: activeMemberCount },
    { data: attendance },
    { count: submittedReports },
    { count: lessonCount },
    { count: taskCount },
    { data: audit },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT").eq("status", "ACTIVE"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).in("role", ["MENTOR", "CHIEF_MENTOR", "LEADER"]),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "MENTOR"),
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("team_members").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("attendance_records").select("attendance_percent"),
    supabase.from("daily_reports").select("*", { count: "exact", head: true }).eq("status", "SUBMITTED"),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("audit_logs").select("id,actor_role,action,entity_type,created_at").order("created_at", { ascending: false }).limit(6),
  ]);

  const averageAttendance = attendance?.length
    ? attendance.reduce((sum, item) => sum + Number(item.attendance_percent ?? 0), 0) / attendance.length
    : 0;

  const modules = [
    ["Қызметкерлер", "/leader/staff", "Менторлар мен бас менторларды басқару.", Users],
    ["Оқушылар", "/leader/students", "Барлық оқушыны, статусты және команданы бақылау.", GraduationCap],
    ["Командалар", "/leader/teams", "Командалар мен ментор бекітулерін басқару.", Users],
    ["Контент", "/leader/content", "Сабақтар мен тапсырмалардың жалпы күйі.", BookOpen],
    ["Аналитика", "/leader/analytics", "Қатысу, есептер және белсенділік.", BarChart3],
    ["Журнал", "/leader/audit", "Маңызды қызметкер әрекеттерінің журналы.", FileClock],
  ] as const;

  return (
    <AppShell
      role="LEADER"
      userName={profile.full_name}
      title="Лидер басқару орталығы"
      description="Марафонның барлық операциялық деңгейі бір жерден бақыланады."
    >
      <PageContainer>
        <div className="space-y-6">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow="ЖЕТЕКШІ"
              title="Марафонның толық көрінісі"
              description="Лидер — Главный ментордан жоғары деңгей. Мұнда барлық staff, команда, оқушы және контент деректері жинақталады."
            />
            <PrimaryLink href="/leader/staff">Қызметкерлерді ашу</PrimaryLink>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="ОҚУШЫ" value={String(studentCount ?? 0)} hint={`${activeStudentCount ?? 0} белсенді`} icon={<GraduationCap size={17} />} />
            <MetricCard label="ҚЫЗМЕТКЕРЛЕР" value={String(staffCount ?? 0)} hint={`${mentorCount ?? 0} ментор`} icon={<ShieldCheck size={17} />} />
            <MetricCard label="КОМАНДА" value={String(teamCount ?? 0)} hint={`${activeMemberCount ?? 0} белсенді мүшелік`} icon={<Users size={17} />} />
            <MetricCard label="ҚАТЫСУ" value={averageAttendance.toFixed(1) + "%"} hint="барлық қатысу" icon={<BarChart3 size={17} />} />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {modules.map(([title, href, description, Icon]) => (
              <Link key={href} href={href} className="group">
                <Card className="h-full p-5 transition-transform duration-200 group-hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold text-[#172235]">{title}</p>
                      <p className="mt-2 text-[11px] font-medium leading-5 text-[#8B8179]">{description}</p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[#FFF0E8] text-[#FF6F2C]">
                      <Icon size={17} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">КОНТЕНТ</p>
                  <h2 className="mt-1 text-[18px] font-extrabold text-[#172235]">Платформадағы контент</h2>
                </div>
                <Settings size={17} className="text-[#9A9189]" />
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">
                <MetricCard label="САБАҚ" value={String(lessonCount ?? 0)} hint="барлығы" />
                <MetricCard label="ТАПСЫРМА" value={String(taskCount ?? 0)} hint="белсенді" />
                <MetricCard label="ЕСЕП" value={String(submittedReports ?? 0)} hint="submitted" />
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#EFE8E1] px-5 py-4 sm:px-6">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF6F2C]">ЖУРНАЛ</p>
                  <h2 className="mt-1 text-[18px] font-extrabold text-[#172235]">Соңғы әрекеттер</h2>
                </div>
                <Link href="/leader/audit" className="text-[10px] font-extrabold text-[#FF6F2C]">Толық журнал</Link>
              </div>
              <div className="divide-y divide-[#EFE8E1]">
                {(audit ?? []).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 sm:px-6">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#F6F2ED] text-[#6F665E]">
                      <FileClock size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-extrabold text-[#354153]">{item.action}</p>
                      <p className="mt-1 text-[9px] text-[#9A9189]">{item.entity_type} · {item.actor_role ?? "SYSTEM"}</p>
                    </div>
                    <StatusPill tone="neutral">{new Date(item.created_at).toLocaleDateString("kk-KZ", { day: "2-digit", month: "short" })}</StatusPill>
                  </div>
                ))}
                {!audit?.length ? <div className="p-8"><EmptyState title="Әзірге журнал жоқ." /></div> : null}
              </div>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
