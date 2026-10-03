import { CalendarDays, ExternalLink, Video } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, StatusPill } from "@/components/ui/ShyraqUI";
import { MarathonDayNavigator } from "@/components/staff/MarathonDayNavigator";
import { MentorMeetSync } from "@/components/mentor/MentorMeetSync";
import { getMentorPageData } from "@/lib/mentor/auth";
import { marathonDayFromDate } from "@/lib/marathon";

export default async function MentorMeetPage({
  searchParams,
}: {
  searchParams?: Promise<{ day?: string }>;
}) {
  const { profile, workspace, supabase } = await getMentorPageData();
  const selectedDay = Math.min(21, Math.max(1, Number((await searchParams)?.day ?? 1) || 1));

  if (!workspace) {
    return (
      <AppShell role="MENTOR" userName={profile.full_name} title="Кездесу" hideHeader>
        <PageContainer><Card className="p-8 text-center"><EmptyState title="Команда бекітілмеген." /></Card></PageContainer>
      </AppShell>
    );
  }

  const studentIds = workspace.students.map((student) => student.id);
  const [{ data: attendance }, { data: marathonStartRow }] = await Promise.all([
    studentIds.length
      ? supabase
          .from("attendance_records")
          .select("student_id,attendance_percent,attended_seconds,status,started_at,ended_at")
          .eq("team_id", workspace.team.id)
          .in("student_id", studentIds)
          .order("started_at", { ascending: false })
      : Promise.resolve({ data: [] as Array<{ student_id: string; attendance_percent: number | null; attended_seconds: number | null; status: string; started_at: string | null; ended_at: string | null }> }),
    supabase
      .from("tasks")
      .select("starts_at")
      .eq("marathon_day", 1)
      .not("starts_at", "is", null)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const marathonStart = marathonStartRow?.starts_at ?? null;
  const dayAttendance = (attendance ?? []).filter((row) => {
    const stamp = row.ended_at ?? row.started_at;
    return Boolean(stamp && marathonStart && marathonDayFromDate(stamp, marathonStart) === selectedDay);
  });

  const perStudent = new Map<string, number[]>();
  for (const row of dayAttendance) {
    const values = perStudent.get(row.student_id) ?? [];
    values.push(Number(row.attendance_percent ?? 0));
    perStudent.set(row.student_id, values);
  }

  return (
    <AppShell role="MENTOR" userName={profile.full_name} title="Кездесу" hideHeader>
      <PageContainer>
        <div className="space-y-5">
          <MarathonDayNavigator basePath="/mentor/meet" selectedDay={selectedDay} />

          <section className="grid gap-4 lg:grid-cols-[1.05fr_.95fr]">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[.16em] text-[#FF8000]">БЕЙНЕ КЕЗДЕСУ</p>
                  <h2 className="mt-1 text-[20px] font-extrabold text-[#172235]">{workspace.meetSpace?.display_name ?? "Кездесу кеңістігі"}</h2>
                  <p className="mt-1 text-[10px] font-semibold text-[#9A9189]">{selectedDay}-күннің Meet қатысуы бөлек есептеледі.</p>
                </div>
                <StatusPill tone={workspace.meetSpace?.active ? "green" : "red"}>{workspace.meetSpace?.active ? "Белсенді" : "Қосылмаған"}</StatusPill>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {workspace.meetSpace?.meeting_url ? (
                  <a href={workspace.meetSpace.meeting_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-[12px] bg-[#FF8000] px-4 py-2.5 text-[10px] font-extrabold text-white"><Video size={14} /> Кездесуге кіру</a>
                ) : null}
                <MentorMeetSync teamId={workspace.team.id} googleConnected={workspace.googleConnected} />
                {workspace.meetSpace?.meeting_url ? (
                  <a href={workspace.meetSpace.meeting_url} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-[12px] border border-[#E8E3DD] bg-white px-4 py-2.5 text-[10px] font-extrabold text-[#3F3832]"><ExternalLink size={13} /> Сілтемені ашу</a>
                ) : null}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF0E2] text-[#FF8000]"><CalendarDays size={16} /></span>
                <div>
                  <p className="text-[13px] font-extrabold text-[#172235]">Қатысу</p>
                  <p className="text-[9px] font-semibold text-[#9A9189]">{selectedDay}-күн</p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                {workspace.students.map((student) => {
                  const values = perStudent.get(student.id) ?? [];
                  const dailyMeet = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
                  return (
                    <div key={student.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-[#EFE8E1] bg-[#FFFCF9] px-3.5 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-[10px] font-extrabold text-[#263247]">{student.full_name}</p>
                        <p className="mt-0.5 text-[8px] font-semibold text-[#9A9189]">{dailyMeet == null ? "Бұл күнге жазба жоқ" : dailyMeet.toFixed(1) + "%"}</p>
                      </div>
                      <StatusPill tone={dailyMeet == null ? "neutral" : dailyMeet > 0 ? "green" : "red"}>
                        {dailyMeet == null ? "Жазба жоқ" : dailyMeet > 0 ? "Қатысты" : "Қатыспады"}
                      </StatusPill>
                    </div>
                  );
                })}
                {!workspace.students.length ? <p className="py-5 text-center text-[9px] text-[#9A9189]">Оқушы жоқ.</p> : null}
              </div>
            </Card>
          </section>
        </div>
      </PageContainer>
    </AppShell>
  );
}
