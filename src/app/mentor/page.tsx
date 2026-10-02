import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MentorTeamManager } from "@/components/mentor/MentorTeamManager";
import { ArrowRight } from "lucide-react";
import { Card, MetricCard, PageContainer, PrimaryLink, SectionHeader } from "@/components/ui/ShyraqUI";

export default async function MentorPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "MENTOR") redirect("/dashboard");

  const { data: team } = await supabase.from("teams").select("id,name,capacity,status").eq("mentor_id", user.id).eq("status", "ACTIVE").maybeSingle();

  if (!team) {
    return (
      <AppShell role="MENTOR" userName={profile.full_name} title="Ментор панелі" >
        <PageContainer>
          <Card className="p-10 text-center">
            <p className="text-sm font-extrabold text-[#3F3832]">Белсенді команда бекітілмеген.</p>
            <p className="mt-1.5 text-xs font-medium text-[#9A9189]">Админ команда тағайындағаннан кейін оқушылар осы жерде көрінеді.</p>
          </Card>
        </PageContainer>
      </AppShell>
    );
  }

  const [{ data: members }, { data: attendance }, { data: meetSpace }] = await Promise.all([
    supabase.from("team_members").select("student_id,assigned_at,profiles(id,full_name,phone,email,status)").eq("team_id", team.id).eq("status", "ACTIVE"),
    supabase.from("attendance_records").select("student_id,attendance_percent").eq("team_id", team.id),
    supabase.from("meet_spaces").select("id,meeting_url,display_name,active").eq("team_id", team.id).eq("active", true).maybeSingle(),
  ]);

  const baseStudents = (members ?? []).map((row) => {
    const p = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return p ? { ...p, assigned_at: row.assigned_at } : null;
  }).filter(Boolean) as Array<{ id:string; full_name:string; phone:string; email:string; status:string; assigned_at:string }>;

  const studentIds = baseStudents.map((student) => student.id);
  const [{ data: reports }, { data: taskSubmissions }, { data: videoProgress }, { data: scoreEvents }] = await Promise.all([
    studentIds.length ? supabase.from("daily_reports").select("student_id,status").in("student_id", studentIds) : Promise.resolve({ data: [] as Array<{ student_id:string; status:string }> }),
    studentIds.length ? supabase.from("task_submissions").select("student_id,status").in("student_id", studentIds) : Promise.resolve({ data: [] as Array<{ student_id:string; status:string }> }),
    studentIds.length ? supabase.from("video_progress").select("student_id,watched_percent,test_unlocked").in("student_id", studentIds) : Promise.resolve({ data: [] as Array<{ student_id:string; watched_percent:number; test_unlocked:boolean }> }),
    studentIds.length ? supabase.from("score_events").select("student_id,points").in("student_id", studentIds) : Promise.resolve({ data: [] as Array<{ student_id:string; points:number }> }),
  ]);

  const attendanceByStudent = new Map<string, number[]>();
  for (const row of attendance ?? []) attendanceByStudent.set(row.student_id, [...(attendanceByStudent.get(row.student_id) ?? []), Number(row.attendance_percent ?? 0)]);

  const reportCounts = new Map<string, number>();
  for (const row of reports ?? []) if (row.status === "SUBMITTED") reportCounts.set(row.student_id, (reportCounts.get(row.student_id) ?? 0) + 1);

  const taskCounts = new Map<string, number>();
  for (const row of taskSubmissions ?? []) if (row.status === "SUBMITTED") taskCounts.set(row.student_id, (taskCounts.get(row.student_id) ?? 0) + 1);

  const videoStats = new Map<string, { total:number; count:number; unlocked:number }>();
  for (const row of videoProgress ?? []) {
    const current = videoStats.get(row.student_id) ?? { total:0, count:0, unlocked:0 };
    current.total += Number(row.watched_percent ?? 0);
    current.count += 1;
    if (row.test_unlocked) current.unlocked += 1;
    videoStats.set(row.student_id, current);
  }

  const scoreMap = new Map<string, number>();
  for (const row of scoreEvents ?? []) scoreMap.set(row.student_id, (scoreMap.get(row.student_id) ?? 0) + Number(row.points ?? 0));

  const students = baseStudents.map((student) => {
    const attendanceValues = attendanceByStudent.get(student.id) ?? [];
    const video = videoStats.get(student.id);
    return {
      ...student,
      score: scoreMap.get(student.id) ?? 0,
      reportCount: reportCounts.get(student.id) ?? 0,
      taskSubmittedCount: taskCounts.get(student.id) ?? 0,
      attendanceAverage: attendanceValues.length ? Number((attendanceValues.reduce((sum,value)=>sum+value,0)/attendanceValues.length).toFixed(1)) : 0,
      videoAverage: video?.count ? Number((video.total/video.count).toFixed(1)) : 0,
      unlockedTests: video?.unlocked ?? 0,
    };
  });

  const averageAttendance = attendance?.length ? attendance.reduce((sum,row)=>sum+Number(row.attendance_percent ?? 0),0)/attendance.length : 0;

  return (
    <AppShell role="MENTOR" userName={profile.full_name} title={team.name} description="Командаңыздың негізгі көрсеткіштері.">
      <PageContainer>
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeader eyebrow="МЕНТОР" title={team.name} description="Оқушылардың прогресін бір экраннан бақыла." />
            {meetSpace?.meeting_url ? <PrimaryLink href={meetSpace.meeting_url}>Кездесуге кіру <ArrowRight size={14} /></PrimaryLink> : null}
          </div>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard label="ОҚУШЫЛАР" value={`${students.length}/${team.capacity ?? "—"}`} hint="команда құрамы" />
            <MetricCard label="ҚАТЫСУ" value={averageAttendance.toFixed(1) + "%"} hint="команда орташа" />
            <MetricCard label="ЕСЕПТЕР" value={String(students.reduce((sum, student) => sum + student.reportCount, 0))} hint="жіберілген есептер" />
            <MetricCard label="КЕЗДЕСУ" value={meetSpace?.active ? "Қосылған" : "Қосу қажет"} hint="команда кездесуі" />
          </section>

          <Card className="p-4 sm:p-5">
            <MentorTeamManager teamId={team.id} students={students} />
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
