import Link from "next/link";
import { BarChart3, BookOpen, ClipboardCheck, Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, PrimaryLink, SectionHeader } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";

export default async function ChiefMentorPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");

  const [
    { count: mentorCount },
    { count: studentCount },
    { count: teamCount },
    { count: activeMembers },
    { count: submittedReports },
    { data: attendance },
    { count: lessonCount },
    { count: taskCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "MENTOR"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "STUDENT"),
    supabase.from("teams").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("team_members").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("daily_reports").select("*", { count: "exact", head: true }).eq("status", "SUBMITTED"),
    supabase.from("attendance_records").select("attendance_percent"),
    supabase.from("lessons").select("*", { count: "exact", head: true }),
    supabase.from("tasks").select("*", { count: "exact", head: true }).eq("active", true),
  ]);

  const averageAttendance = attendance?.length
    ? attendance.reduce((sum, item) => sum + Number(item.attendance_percent ?? 0), 0) / attendance.length
    : 0;

  const cards = [
    ["Менторлар", "/chief-mentor/mentors", "Барлық ментордың жұмысын бақылау.", Users],
    ["Командалар", "/chief-mentor/teams", "Команда көлемі мен ментор жүктемесі.", Users],
    ["Сабақтар", "/chief-mentor/lessons", "Контентті жариялау және реттеу.", BookOpen],
    ["Тапсырмалар", "/chief-mentor/tasks", "Марафон тапсырмаларын басқару.", ClipboardCheck],
    ["Есептер", "/chief-mentor/reports", "Күнделікті есептердің орындалуын бақылау.", ClipboardCheck],
    ["Аналитика", "/chief-mentor/analytics", "Жалпы mentor/team/student нәтижелері.", BarChart3],
  ] as const;

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Главный ментор"
      description="Барлық менторлар мен командалардың операциялық кабинеті."
    >
      <PageContainer>
        <div className="space-y-6">
          <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader
              eyebrow="CHIEF MENTOR"
              title="Менторлар штабын басқар"
              description="Лидерден төмен, бірақ барлық менторлар мен командаларды басқаруға арналған толық операциялық деңгей."
            />
            <PrimaryLink href="/chief-mentor/mentors">Менторларды ашу</PrimaryLink>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="МЕНТОР" value={String(mentorCount ?? 0)} hint="активті staff" icon={<Users size={17} />} />
            <MetricCard label="ОҚУШЫ" value={String(studentCount ?? 0)} hint="барлық студент" icon={<Users size={17} />} />
            <MetricCard label="КОМАНДА" value={String(teamCount ?? 0)} hint={`${activeMembers ?? 0} membership`} icon={<Users size={17} />} />
            <MetricCard label="ATTENDANCE" value={averageAttendance.toFixed(1) + "%"} hint="жалпы орташа" icon={<BarChart3 size={17} />} />
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cards.map(([title, href, description, Icon]) => (
              <Link key={href} href={href} className="group">
                <Card className="h-full p-5 transition-transform duration-200 group-hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-extrabold text-[#172235]">{title}</p>
                      <p className="mt-2 text-[11px] leading-5 text-[#8B8179]">{description}</p>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-[#FFF0E8] text-[#FF6F2C]"><Icon size={17} /></span>
                  </div>
                </Card>
              </Link>
            ))}
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="REPORTS" value={String(submittedReports ?? 0)} hint="submitted daily reports" />
            <MetricCard label="LESSONS" value={String(lessonCount ?? 0)} hint="контент көлемі" />
            <MetricCard label="TASKS" value={String(taskCount ?? 0)} hint="active tasks" />
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
