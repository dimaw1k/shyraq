import Link from "next/link";
import {
  AlertCircle,
  Clock3,
  FileCheck2,
  Send,
  Users,
  UsersRound,
} from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, PageContainer } from "@/components/ui/ShyraqUI";
import { DashboardBanner } from "@/components/student/DashboardBanner";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { todayInTimezone } from "@/lib/streak";

type TeamRow = {
  id: string;
  name: string;
  mentorName: string;
  mentorAvatarUrl: string | null;
  activeStudents: number;
  attendedStudents: number;
  attendancePercent: number;
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "M"
  );
}

export default async function ChiefMentorPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const today = todayInTimezone("Asia/Almaty");
  const admin = createAdminSupabaseClient();

  const [
    { count: mentorCount },
    { count: studentCount },
    { count: teamCount },
    { data: teams },
    { data: reports },
    { data: banners },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "MENTOR")
      .eq("status", "ACTIVE"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("role", "STUDENT"),
    supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE"),
    supabase
      .from("teams")
      .select("id,name,mentor_id,status")
      .eq("status", "ACTIVE")
      .order("name"),
    supabase
      .from("daily_reports")
      .select("student_id,status,report_date,submitted_at,reviewed_at")
      .eq("report_date", today)
      .neq("status", "DRAFT"),
    admin
      .from("marathon_banners")
      .select("id,title,description,image_path,href,published,starts_at,ends_at,sort_order")
      .eq("published", true)
      .order("sort_order")
      .limit(8),
  ]);

  const now = Date.now();
  const bannerItems = (
    await Promise.all(
      (banners ?? [])
        .filter((banner) => {
          const startsOk = !banner.starts_at || new Date(banner.starts_at).getTime() <= now;
          const endsOk = !banner.ends_at || new Date(banner.ends_at).getTime() >= now;
          return Boolean(banner.image_path) && startsOk && endsOk;
        })
        .map(async (banner) => {
          const { data } = await admin.storage
            .from("banners")
            .createSignedUrl(banner.image_path!, 60 * 60);
          return {
            id: banner.id,
            title: banner.title,
            description: banner.description,
            href: banner.href,
            imageUrl: data?.signedUrl ?? null,
          };
        }),
    )
  ).filter((banner) => Boolean(banner.imageUrl));

  const teamIds = (teams ?? []).map((team) => team.id);
  const mentorIds = (teams ?? []).map((team) => team.mentor_id).filter(Boolean) as string[];

  const [
    { data: mentorProfiles },
    { data: members },
    { data: attendance },
  ] = await Promise.all([
    mentorIds.length
      ? supabase
          .from("profiles")
          .select("id,full_name,avatar_path")
          .in("id", mentorIds)
      : Promise.resolve({ data: [] as Array<{ id: string; full_name: string; avatar_path: string | null }> }),
    teamIds.length
      ? supabase
          .from("team_members")
          .select("team_id,student_id,status")
          .in("team_id", teamIds)
          .eq("status", "ACTIVE")
      : Promise.resolve({ data: [] as Array<{ team_id: string; student_id: string; status: string }> }),
    teamIds.length
      ? supabase
          .from("attendance_records")
          .select("team_id,student_id,attendance_percent,started_at,ended_at,imported_at")
          .in("team_id", teamIds)
      : Promise.resolve({
          data: [] as Array<{
            team_id: string;
            student_id: string;
            attendance_percent: number | null;
            started_at: string | null;
            ended_at: string | null;
            imported_at: string;
          }>,
        }),
  ]);

  const mentorMap = new Map(
    (mentorProfiles ?? []).map((mentor) => [
      mentor.id,
      {
        name: mentor.full_name,
        avatarUrl: mentor.avatar_path
          ? admin.storage.from("avatars").getPublicUrl(mentor.avatar_path).data.publicUrl
          : null,
      },
    ]),
  );

  const studentsByTeam = new Map<string, Set<string>>();
  for (const member of members ?? []) {
    const set = studentsByTeam.get(member.team_id) ?? new Set<string>();
    set.add(member.student_id);
    studentsByTeam.set(member.team_id, set);
  }

  const todayAttendance = (attendance ?? []).filter((row) => {
    const stamp = row.ended_at ?? row.started_at ?? row.imported_at;
    if (!stamp) return false;
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Almaty",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(stamp)) === today;
  });

  const latestAttendanceByStudent = new Map<string, (typeof todayAttendance)[number]>();
  for (const row of todayAttendance) {
    const key = row.team_id + ":" + row.student_id;
    const current = latestAttendanceByStudent.get(key);
    const rowTime = Date.parse(row.ended_at ?? row.started_at ?? row.imported_at);
    const currentTime = current
      ? Date.parse(current.ended_at ?? current.started_at ?? current.imported_at)
      : -1;
    if (!current || rowTime >= currentTime) latestAttendanceByStudent.set(key, row);
  }

  const meetRows: TeamRow[] = (teams ?? []).map((team) => {
    const students = studentsByTeam.get(team.id) ?? new Set<string>();
    const values = [...students].map((studentId) => {
      const row = latestAttendanceByStudent.get(team.id + ":" + studentId);
      return Number(row?.attendance_percent ?? 0);
    });
    const attendedStudents = values.filter((value) => value > 0).length;
    const attendancePercent = students.size
      ? values.reduce((sum, value) => sum + value, 0) / students.size
      : 0;

    return {
      id: team.id,
      name: team.name,
      mentorName: team.mentor_id ? mentorMap.get(team.mentor_id)?.name ?? "Ментор бекітілмеген" : "Ментор бекітілмеген",
      mentorAvatarUrl: team.mentor_id ? mentorMap.get(team.mentor_id)?.avatarUrl ?? null : null,
      activeStudents: students.size,
      attendedStudents,
      attendancePercent: Number(attendancePercent.toFixed(1)),
    };
  });

  const reportMap = new Map<string, string>();
  for (const report of reports ?? []) {
    const priority = report.status === "REVIEWED" ? 3 : report.status === "SUBMITTED" ? 2 : 1;
    const current = reportMap.get(report.student_id);
    const currentPriority = current === "REVIEWED" ? 3 : current === "SUBMITTED" ? 2 : current ? 1 : 0;
    if (!current || priority > currentPriority) reportMap.set(report.student_id, report.status);
  }

  const submittedCount = [...reportMap.values()].filter((status) => status === "REVIEWED").length;
  const reviewingCount = [...reportMap.values()].filter((status) => status === "SUBMITTED").length;
  const reportStudentIds = new Set(reportMap.keys());
  const allStudentCount = studentCount ?? 0;
  const missingCount = Math.max(0, allStudentCount - reportStudentIds.size);

  const attentionRows = [
    {
      key: "submitted",
      icon: <FileCheck2 size={16} />,
      title: "Есеп жіберілді",
      value: submittedCount,
      tone: "green" as const,
    },
    {
      key: "reviewing",
      icon: <Clock3 size={16} />,
      title: "Есеп тексерілуде",
      value: reviewingCount,
      tone: "orange" as const,
    },
    {
      key: "missing",
      icon: <AlertCircle size={16} />,
      title: "Есеп жібермеді",
      value: missingCount,
      tone: "red" as const,
    },
  ];

  return (
    <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="" hideHeader>
      <PageContainer>
        <div className="space-y-3">
          <section className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_250px]">
            <div className="min-w-0">
              <DashboardBanner banners={bannerItems} />
            </div>

            <aside className="grid gap-2 xl:sticky xl:top-[72px]">
              <Card className="p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-[7px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">
                      МЕНТОР
                    </p>
                    <p className="mt-0.5 text-[19px] leading-none font-extrabold tracking-[-.045em] text-[var(--foreground)]">
                      {mentorCount ?? 0}
                    </p>
                    <p className="mt-1 text-[8px] font-medium text-[#8B8179]">белсенді</p>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Users size={14} />
                  </span>
                </div>
              </Card>

              <Card className="p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-[7px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">
                      КОМАНДА
                    </p>
                    <p className="mt-0.5 text-[19px] leading-none font-extrabold tracking-[-.045em] text-[var(--foreground)]">
                      {teamCount ?? 0}
                    </p>
                    <p className="mt-1 text-[8px] font-medium text-[#8B8179]">белсенді</p>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)]">
                    <UsersRound size={14} />
                  </span>
                </div>
              </Card>

              <Card className="p-2.5 sm:p-3">
                <div className="flex items-center justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-[7px] font-extrabold uppercase tracking-[.14em] text-[#9A9189]">
                      ОҚУШЫ
                    </p>
                    <p className="mt-0.5 text-[19px] leading-none font-extrabold tracking-[-.045em] text-[var(--foreground)]">
                      {studentCount ?? 0}
                    </p>
                    <p className="mt-1 text-[8px] font-medium text-[#8B8179]">барлығы</p>
                  </div>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent)]">
                    <Users size={14} />
                  </span>
                </div>
              </Card>
            </aside>
          </section>

          <section className="grid gap-3 xl:grid-cols-[1.2fr_.8fr]">
            <Card className="overflow-hidden">
              <div className="border-b border-[#EFE8E1] px-5 py-3.5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[.15em] text-[var(--accent)]">
                      БҮГІНГІ MEET
                    </p>
                    <h2 className="mt-1 text-[18px] font-extrabold tracking-[-.035em] text-[#172235]">
                      Қатысу жағдайы
                    </h2>
                  </div>
                  <Link
                    href="/chief-mentor/meet"
                    className="text-[10px] font-extrabold text-[var(--accent)]"
                  >
                    Барлығын көру
                  </Link>
                </div>
              </div>

              <div className="divide-y divide-[#EFE8E1]">
                <div className="grid grid-cols-[1.2fr_110px_130px] gap-3 bg-[#FFFCF9] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[.08em] text-[#81766D] sm:px-6">
                  <span>Ментор / команда</span>
                  <span>Оқушы</span>
                  <span>Қатысу пайызы</span>
                </div>

                {meetRows.slice(0, 8).map((row) => (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1.2fr_110px_130px] items-center gap-3 px-5 py-3 sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-[#FFF1E2] text-[10px] font-extrabold text-[#B95D00]">
                        {row.mentorAvatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.mentorAvatarUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          initials(row.mentorName)
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-extrabold text-[#263247]">
                          {row.mentorName}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] font-semibold text-[#8F857D]">
                          {row.name}
                        </p>
                      </div>
                    </div>

                    <p className="text-[14px] font-extrabold text-[#354153]">
                      {row.attendedStudents}/{row.activeStudents}
                    </p>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-extrabold text-[#354153]">
                          {row.attendancePercent}%
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#EFEAE4]">
                        <div
                          className="h-full rounded-full bg-[var(--accent)] transition-[width]"
                          style={{ width: Math.max(0, Math.min(100, row.attendancePercent)) + "%" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {!meetRows.length ? (
                  <div className="px-6 py-6 text-center text-[11px] font-semibold text-[#8B8179]">
                    Белсенді команда жоқ.
                  </div>
                ) : null}
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="border-b border-[#EFE8E1] px-5 py-3.5">
                <h2 className="text-[18px] font-extrabold tracking-[-.035em] text-[#172235]">
                  Бүгінгі есептер
                </h2>
              </div>

              <div className="divide-y divide-[#EFE8E1]">
                {attentionRows.map((item) => (
                  <div key={item.key} className="flex items-center gap-3 px-5 py-3">
                    <span
                      className={[
                        "grid h-9 w-9 shrink-0 place-items-center rounded-[11px]",
                        item.tone === "green"
                          ? "bg-[#EDF8F2] text-[#2E7E58]"
                          : item.tone === "orange"
                            ? "bg-[#FFF1E2] text-[#B95D00]"
                            : "bg-[#FFF0EE] text-[#BF514A]",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-extrabold text-[#263247]">
                        {item.title}
                      </p>
                    </div>
                    <span className="text-[26px] font-extrabold tracking-[-.05em] text-[#172235]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#EFE8E1] px-5 py-3">
                <Link
                  href="/chief-mentor/reports"
                  className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-[var(--accent)]"
                >
                  <Send size={12} />
                  Есептерді басқару
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
