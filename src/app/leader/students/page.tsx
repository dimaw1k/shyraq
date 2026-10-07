import {
  CheckCircle2,
  CircleAlert,
  GraduationCap,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { MarathonDayNavigator } from "@/components/staff/MarathonDayNavigator";
import { marathonDayFromDate } from "@/lib/marathon";
import { Card, EmptyState, PageContainer, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { displayKzPhone } from "@/lib/phone";

function educationText(value: string | null) {
  if (value === "SCHOOL") return "Мектеп";
  if (value === "COLLEGE") return "Колледж";
  if (value === "UNIVERSITY") return "Университет";
  return "Басқа";
}

export default async function LeaderStudentsPage({ searchParams }: { searchParams?: Promise<{ day?: string }> }) {
  const { supabase, profile } = await getAuthenticatedStaff("LEADER");
  const selectedDay = Math.min(21, Math.max(1, Number((await searchParams)?.day ?? 1) || 1));

  const { data: students } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,status,education_type,created_at")
    .eq("role", "STUDENT")
    .order("created_at", { ascending: false })
    .limit(200);

  const studentIds = (students ?? []).map((student) => student.id);

  const [{ data: attendance }, { data: video }, { data: scores }] = await Promise.all([
    studentIds.length
      ? supabase
          .from("attendance_records")
          .select("student_id,attendance_percent,started_at,ended_at")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ student_id: string; attendance_percent: number | null; started_at: string | null; ended_at: string | null }> }),
    studentIds.length
      ? supabase
          .from("video_progress")
          .select("student_id,watched_percent,updated_at")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ student_id: string; watched_percent: number | null; updated_at: string | null }> }),
    studentIds.length
      ? supabase
          .from("score_events")
          .select("student_id,points,created_at")
          .in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ student_id: string; points: number; created_at: string | null }> }),
  ]);

  const { data: startRow } = await supabase
    .from("tasks")
    .select("starts_at")
    .eq("marathon_day", 1)
    .not("starts_at", "is", null)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  const marathonStart = startRow?.starts_at ?? null;

  const meetMap = new Map<string, number[]>();
  for (const row of attendance ?? []) {
    const stamp = row.ended_at ?? row.started_at;
    if (!stamp || !marathonStart || marathonDayFromDate(stamp, marathonStart) !== selectedDay) continue;
    meetMap.set(row.student_id, [
      ...(meetMap.get(row.student_id) ?? []),
      Number(row.attendance_percent ?? 0),
    ]);
  }

  const videoMap = new Map<string, number[]>();
  for (const row of video ?? []) {
    if (!row.updated_at || !marathonStart || marathonDayFromDate(row.updated_at, marathonStart) !== selectedDay) continue;
    videoMap.set(row.student_id, [
      ...(videoMap.get(row.student_id) ?? []),
      Number(row.watched_percent ?? 0),
    ]);
  }

  const scoreMap = new Map<string, number>();
  for (const row of scores ?? []) {
    if (!row.created_at || !marathonStart || marathonDayFromDate(row.created_at, marathonStart) !== selectedDay) continue;
    scoreMap.set(row.student_id, (scoreMap.get(row.student_id) ?? 0) + Number(row.points ?? 0));
  }

  const rows = (students ?? []).map((student) => {
    const meet = meetMap.get(student.id) ?? [];
    const clips = videoMap.get(student.id) ?? [];
    return {
      ...student,
      meet: meet.length ? meet.reduce((a, b) => a + b, 0) / meet.length : 0,
      video: clips.length ? clips.reduce((a, b) => a + b, 0) / clips.length : 0,
      score: Math.round(scoreMap.get(student.id) ?? 0),
    };
  });

  const averageMeet = rows.length
    ? rows.reduce((sum, row) => sum + row.meet, 0) / rows.length
    : 0;

  return (
    <AppShell role="LEADER" userName={profile.full_name} title="Оқушылар" description="Барлық оқушының оқу және live сабақ көрсеткіштері.">
      <PageContainer>
        <div className="space-y-4">
          <MarathonDayNavigator basePath="/leader/students" selectedDay={selectedDay} />
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["ОҚУШЫ", String(rows.length), "барлығы"],
              ["MEET ҚАТЫСУ", averageMeet ? averageMeet.toFixed(1) + "%" : "—", selectedDay + "-күн"],
              ["БЕЙНЕ КӨРУ", rows.length ? (rows.reduce((s, row) => s + row.video, 0) / rows.length).toFixed(1) + "%" : "—", selectedDay + "-күн"],
            ].map(([label, value, hint]) => (
              <Card key={label} className="p-4 sm:p-5">
                <p className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#A19890]">{label}</p>
                <p className="mt-1 text-[24px] font-extrabold tracking-[-.045em] text-[#172235]">{value}</p>
                <p className="mt-0.5 text-[9px] font-semibold text-[#8B8179]">{hint}</p>
              </Card>
            ))}
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2.5 border-b border-[#EFE8E1] bg-[#FFFCF9] p-4 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A19890]" />
                <div className="h-10 rounded-[12px] border border-[#E8E1DA] bg-white px-3 pl-9 py-3 text-[10px] font-semibold text-[#A19890]">
                  Оқушы, email немесе телефон бойынша іздеу
                </div>
              </div>
              <span className="rounded-[12px] bg-[#FFF1E2] px-3 py-2.5 text-[9px] font-extrabold text-[#B95D00]">
                {rows.length} оқушы
              </span>
            </div>

            <div className="hidden min-w-[1060px] lg:block">
              <div className="grid grid-cols-[52px_1.9fr_1.15fr_110px_110px_110px_130px] gap-3 border-b border-[#EFE8E1] bg-[#FAF8F5] px-6 py-3 text-[8px] font-extrabold uppercase tracking-[.12em] text-[#9A9189]">
                <span>№</span><span>ОҚУШЫ</span><span>БАЙЛАНЫС</span><span>MEET</span><span>БЕЙНЕ</span><span>ҰПАЙ</span><span>СТАТУС</span>
              </div>
              <div className="divide-y divide-[#EFE8E1]">
                {rows.map((student, index) => {
                  const lowMeet = student.meet > 0 && student.meet < 60;
                  return (
                    <div key={student.id} className="grid grid-cols-[52px_1.9fr_1.15fr_110px_110px_110px_130px] items-center gap-3 px-6 py-3.5 transition hover:bg-[#FFFCF9]">
                      <span className="text-[9px] font-bold text-[#A19890]">{index + 1}</span>
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#172235] text-[9px] font-extrabold text-white">
                          {student.full_name.split(" ").filter(Boolean).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join("")}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[11px] font-extrabold text-[#354153]">{student.full_name}</p>
                          <p className="mt-0.5 truncate text-[8px] font-semibold text-[#9A9189]">{educationText(student.education_type)}</p>
                        </div>
                      </div>
                      <div className="text-[8px] font-semibold text-[#8B8179]">
                        <p className="truncate">{displayKzPhone(student.phone)}</p>
                        <p className="mt-0.5 truncate">{student.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={["grid h-7 w-7 place-items-center rounded-full", lowMeet ? "bg-[#FFF0EE] text-[#BF514A]" : "bg-[#EDF8F2] text-[#2E7E58]"].join(" ")}>
                          {lowMeet ? <CircleAlert size={12} /> : <CheckCircle2 size={12} />}
                        </span>
                        <span className="text-[10px] font-extrabold text-[#334054]">{student.meet ? student.meet.toFixed(1) + "%" : "—"}</span>
                      </div>
                      <p className="text-[10px] font-extrabold text-[#334054]">{student.video ? student.video.toFixed(1) + "%" : "—"}</p>
                      <p className="text-[11px] font-extrabold text-[#172235]">{student.score || 0}</p>
                      <StatusPill tone={student.status === "ACTIVE" ? "green" : student.status === "INACTIVE" ? "red" : "orange"}>
                        {student.status === "ACTIVE" ? "Белсенді" : student.status === "INACTIVE" ? "Өшірулі" : student.status === "WAITING_FOR_TEAM" ? "Команда күтілуде" : student.status === "REGISTERED" ? "Тіркелген" : "Аяқтаған"}
                      </StatusPill>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="divide-y divide-[#EFE8E1] lg:hidden">
              {rows.map((student) => (
                <div key={student.id} className="space-y-3 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#172235] text-[10px] font-extrabold text-white">
                      {student.full_name.split(" ").filter(Boolean).slice(0, 2).map((part: string) => part[0]?.toUpperCase()).join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-extrabold text-[#354153]">{student.full_name}</p>
                      <p className="mt-1 truncate text-[8px] font-semibold text-[#9A9189]">{student.email}</p>
                    </div>
                    <StatusPill tone={student.status === "ACTIVE" ? "green" : "orange"}>{student.status}</StatusPill>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      ["Meet", student.meet ? student.meet.toFixed(1) + "%" : "—"],
                      ["Бейне", student.video ? student.video.toFixed(1) + "%" : "—"],
                      ["Ұпай", String(student.score || 0)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[12px] bg-[#FAF8F5] px-3 py-2.5">
                        <p className="text-[8px] font-extrabold uppercase tracking-[.12em] text-[#A19890]">{label}</p>
                        <p className="mt-1 text-[13px] font-extrabold text-[#334054]">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {!rows.length ? <div className="p-8"><EmptyState title="Оқушы жоқ." /></div> : null}
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
