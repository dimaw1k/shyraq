import { AppShell } from "@/components/app/AppNav";
import { Card, MetricCard, PageContainer, SectionHeader, StatusPill } from "@/components/ui/ShyraqUI";
import { ChiefMentorMeetManager } from "@/components/staff/ChiefMentorMeetManager";
import { MarathonDayNavigator } from "@/components/staff/MarathonDayNavigator";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { marathonDayFromDate } from "@/lib/marathon";

export default async function ChiefMentorMeetPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const selectedDay = Math.min(21, Math.max(1, Number((await searchParams)?.day ?? 1) || 1));

  const [{ data: teams }, { data: spaces }, { data: attendance }, { data: startRow }] = await Promise.all([
    supabase.from("teams").select("id,name,capacity").eq("status", "ACTIVE").order("name"),
    supabase.from("meet_spaces").select("id,team_id,display_name,meeting_url,external_space_id,active").order("created_at", { ascending: false }),
    supabase.from("attendance_records").select("team_id,student_id,attendance_percent,attended_seconds,meeting_duration_seconds,status,started_at,ended_at").order("imported_at", { ascending: false }).limit(1000),
    supabase.from("tasks").select("starts_at").eq("marathon_day", 1).not("starts_at", "is", null).order("starts_at", { ascending: true }).limit(1).maybeSingle(),
  ]);

  const teamNames = new Map((teams ?? []).map((team) => [team.id, team.name]));
  const spaceRows = (spaces ?? []).map((space) => ({ ...space, team_name: teamNames.get(space.team_id) ?? "Команда" }));
  const marathonStart = startRow?.starts_at ?? null;
  const dailyAttendance = (attendance ?? []).filter((row) => {
    const stamp = row.ended_at ?? row.started_at;
    return Boolean(stamp && marathonStart && marathonDayFromDate(stamp, marathonStart) === selectedDay);
  });
  const avg = dailyAttendance.length
    ? dailyAttendance.reduce((sum, row) => sum + Number(row.attendance_percent ?? 0), 0) / dailyAttendance.length
    : 0;
  const attended = dailyAttendance.filter((row) => ["ATTENDED", "FULL", "PRESENT"].includes(row.status)).length;

  return (
    <AppShell role="CHIEF_MENTOR" userName={profile.full_name} title="Кездесулер" hideHeader>
      <PageContainer>
        <div className="space-y-5">
          <MarathonDayNavigator basePath="/chief-mentor/meet" selectedDay={selectedDay} />
          <SectionHeader eyebrow="КЕЗДЕСУ" title={selectedDay + "-күн — кездесулер"} description="Meet статистикасы әр күн бойынша бөлек есептеледі." />
          <section className="grid gap-3 sm:grid-cols-3">
            <MetricCard label="КЕЗДЕСУ БӨЛМЕСІ" value={String(spaceRows.length)} hint="команда" />
            <MetricCard label="ҚАТЫСУ" value={avg ? avg.toFixed(1) + "%" : "—"} hint={selectedDay + "-күн"} />
            <MetricCard label="ҚАТЫСҚАНДАР" value={String(attended)} hint="жазба" />
          </section>
          <ChiefMentorMeetManager teams={teams ?? []} initialSpaces={spaceRows} />
          <Card className="overflow-hidden">
            <div className="border-b border-[#EFE8E1] px-5 py-4">
              <p className="text-[13px] font-extrabold text-[#172235]">{selectedDay}-күннің қатысу тарихы</p>
            </div>
            <div className="divide-y divide-[#EFE8E1]">
              {dailyAttendance.slice(0, 100).map((row, index) => (
                <div key={String(row.student_id ?? "") + "-" + index} className="grid gap-2 px-5 py-3.5 sm:grid-cols-[1.1fr_1fr_110px_130px]">
                  <p className="text-[10px] font-semibold text-[#4B433C]">{teamNames.get(row.team_id ?? "") ?? "Команда"}</p>
                  <p className="text-[10px] font-semibold text-[#6E655D]">Қатысу жазбасы</p>
                  <p className="text-[10px] font-extrabold text-[#172235]">{Number(row.attendance_percent ?? 0).toFixed(1)}%</p>
                  <StatusPill tone={row.status === "FULL" || row.status === "ATTENDED" || row.status === "PRESENT" ? "green" : row.status === "ABSENT" ? "red" : "orange"}>
                    {row.status}
                  </StatusPill>
                </div>
              ))}
              {!dailyAttendance.length ? <div className="p-8 text-center text-xs font-semibold text-[#8B8179]">Бұл күнге Meet жазбасы жоқ.</div> : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
