import Link from "next/link";
import { BarChart3, BookOpen, CalendarCheck2, ClipboardCheck, FileClock, FileText, Mail, Settings, Trophy, Users, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, SectionHeader } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

const modules = [
  ["Менторлар", "/chief-mentor/mentors", "Менторларды қосу, статусы және performance.", Users],
  ["Командалар", "/chief-mentor/teams", "Команда, сыйымдылық және ментор байланысы.", UsersRound],
  ["Оқушылар", "/chief-mentor/students", "Барлық оқушының ілгерілеуі және командасы.", Users],
  ["Сабақтар", "/chief-mentor/lessons", "Сабақ, бейне және тест материалдары.", BookOpen],
  ["Тапсырмалар", "/chief-mentor/tasks", "Тапсырмалар және ментор сұраныстары.", ClipboardCheck],
  ["Есептер", "/chief-mentor/reports", "Күндік есептерді бақылау.", FileText],
  ["Кездесулер", "/chief-mentor/meet", "Google Meet және қатысу.", CalendarCheck2],
  ["Рейтинг", "/chief-mentor/rating", "Ментор, команда және оқушы нәтижесі.", Trophy],
  ["Аналитика", "/chief-mentor/analytics", "Негізгі көрсеткіштер, графиктер және салыстыру.", BarChart3],
  ["Хабарламалар", "/chief-mentor/messages", "Менторлармен ішкі байланыс.", Mail],
  ["Журнал", "/chief-mentor/audit", "Өзгеріске дейінгі және кейінгі әрекет тарихы.", FileClock],
  ["Қолдау", "/chief-mentor/support", "Оқушы өтініштері.", FileText],
  ["Баптаулар", "/chief-mentor/settings", "Операциялық марафон баптаулары.", Settings],
] as const;

export default async function ChiefMentorPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const [
    { count: mentorCount },
    { count: studentCount },
    { count: teamCount },
    { data: attendance },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "MENTOR").eq("status", "ACTIVE"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("attendance_records").select("attendance_percent"),
  ]);

  const averageAttendance = attendance?.length
    ? attendance.reduce((sum, row) => sum + Number(row.attendance_percent ?? 0), 0) / attendance.length
    : 0;

  return (
    <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Басты бет" description="Бас ментордың операциялық кабинеті.">
      <PageContainer>
        <div className="space-y-6">
          <SectionHeader
            eyebrow="БАС МЕНТОР"
            title="Басқару"
            description="Менторлар, командалар және оқу процесінің негізгі көрсеткіштері."
          />
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="МЕНТОР" value={String(mentorCount ?? 0)} hint="белсенді" icon={<Users size={17} />} />
            <MetricCard label="КОМАНДА" value={String(teamCount ?? 0)} hint="белсенді" icon={<UsersRound size={17} />} />
            <MetricCard label="ОҚУШЫ" value={String(studentCount ?? 0)} hint="барлығы" icon={<Users size={17} />} />
            <MetricCard label="ҚАТЫСУ" value={averageAttendance ? averageAttendance.toFixed(1) + "%" : "—"} hint="орташа қатысу" icon={<BarChart3 size={17} />} />
          </section>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map(([title, href, description, Icon]) => (
              <Link key={href} href={href} className="group">
                <Card className="h-full p-5 transition duration-200 group-hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h2 className="text-[13px] font-extrabold text-[#172235]">{title}</h2>
                      <p className="mt-1.5 text-[9px] font-semibold leading-5 text-[#8B8179]">{description}</p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-[var(--accent-soft)] text-[var(--accent)]">
                      <Icon size={17} />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
