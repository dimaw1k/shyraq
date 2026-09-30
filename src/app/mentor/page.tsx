import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { MentorTeamManager } from "@/components/mentor/MentorTeamManager";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function MentorPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "MENTOR") redirect("/dashboard");

  const { data: team } = await supabase
    .from("teams")
    .select("id,name,capacity,status")
    .eq("mentor_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  if (!team) {
    return (
      <main className="min-h-screen bg-[var(--background)]">
        <AppNav role="MENTOR" />
        <section className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-3xl font-semibold">Mentor panel</h1>
          <p className="mt-3 text-sm text-[var(--muted)]">Сізге әлі active team бекітілмеген.</p>
        </section>
      </main>
    );
  }

  const [{ data: members }, { data: attendance }, { data: meetSpace }] = await Promise.all([
    supabase
      .from("team_members")
      .select("student_id,assigned_at,profiles(id,full_name,phone,email,status)")
      .eq("team_id", team.id)
      .eq("status", "ACTIVE"),
    supabase
      .from("attendance_records")
      .select("student_id,attendance_percent")
      .eq("team_id", team.id),
    supabase
      .from("meet_spaces")
      .select("id,meeting_url,display_name,active")
      .eq("team_id", team.id)
      .eq("active", true)
      .maybeSingle(),
  ]);

  const baseStudents = (members ?? [])
    .map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return profile ? { ...profile, assigned_at: row.assigned_at } : null;
    })
    .filter(Boolean) as Array<{
      id: string;
      full_name: string;
      phone: string;
      email: string;
      status: string;
      assigned_at: string;
    }>;

  const studentIds = baseStudents.map((student) => student.id);

  const [{ data: reports }, { data: taskSubmissions }, { data: videoProgress }, { data: scoreEvents }] = await Promise.all([
    studentIds.length
      ? supabase.from("daily_reports").select("student_id,status").in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ student_id: string; status: string }> }),
    studentIds.length
      ? supabase.from("task_submissions").select("student_id,status").in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ student_id: string; status: string }> }),
    studentIds.length
      ? supabase.from("video_progress").select("student_id,watched_percent,test_unlocked").in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ student_id: string; watched_percent: number; test_unlocked: boolean }> }),
    studentIds.length
      ? supabase.from("score_events").select("student_id,points").in("student_id", studentIds)
      : Promise.resolve({ data: [] as Array<{ student_id: string; points: number }> }),
  ]);

  const attendanceByStudent = new Map<string, number[]>();
  for (const row of attendance ?? []) {
    const values = attendanceByStudent.get(row.student_id) ?? [];
    values.push(Number(row.attendance_percent ?? 0));
    attendanceByStudent.set(row.student_id, values);
  }

  const reportCounts = new Map<string, number>();
  for (const row of reports ?? []) {
    if (row.status !== "SUBMITTED") continue;
    reportCounts.set(row.student_id, (reportCounts.get(row.student_id) ?? 0) + 1);
  }

  const taskCounts = new Map<string, number>();
  for (const row of taskSubmissions ?? []) {
    if (row.status !== "SUBMITTED") continue;
    taskCounts.set(row.student_id, (taskCounts.get(row.student_id) ?? 0) + 1);
  }

  const videoStats = new Map<string, { total: number; count: number; unlocked: number }>();
  for (const row of videoProgress ?? []) {
    const current = videoStats.get(row.student_id) ?? { total: 0, count: 0, unlocked: 0 };
    current.total += Number(row.watched_percent ?? 0);
    current.count += 1;
    if (row.test_unlocked) current.unlocked += 1;
    videoStats.set(row.student_id, current);
  }

  const scoreMap = new Map<string, number>();
  for (const row of scoreEvents ?? []) {
    scoreMap.set(row.student_id, (scoreMap.get(row.student_id) ?? 0) + Number(row.points ?? 0));
  }

  const students = baseStudents.map((student) => {
    const attendanceValues = attendanceByStudent.get(student.id) ?? [];
    const video = videoStats.get(student.id);
    return {
      ...student,
      score: scoreMap.get(student.id) ?? 0,
      reportCount: reportCounts.get(student.id) ?? 0,
      taskSubmittedCount: taskCounts.get(student.id) ?? 0,
      attendanceAverage: attendanceValues.length
        ? Number((attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length).toFixed(1))
        : 0,
      videoAverage: video?.count ? Number((video.total / video.count).toFixed(1)) : 0,
      unlockedTests: video?.unlocked ?? 0,
    };
  });

  const averageAttendance = attendance?.length
    ? attendance.reduce((sum, row) => sum + Number(row.attendance_percent ?? 0), 0) / attendance.length
    : 0;

  const activeStudents = students.filter((student) => student.status === "ACTIVE").length;
  const connectedMeet = Boolean(meetSpace?.active);

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role="MENTOR" />
      <section className="mx-auto max-w-7xl px-6 py-10">
        <p className="text-sm font-semibold text-[var(--accent)]">MENTOR PANEL</p>
        <h1 className="mt-2 text-3xl font-semibold">{profile.full_name}</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">{team.name}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Оқушылар", String(activeStudents) + "/" + String(team.capacity ?? "—")],
            ["Attendance", averageAttendance.toFixed(1) + "%"],
            ["Reports", String(students.reduce((sum, student) => sum + student.reportCount, 0))],
            ["Meet", connectedMeet ? "Қосылған" : "Қосу қажет"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-[var(--border)] bg-white p-5">
              <p className="text-sm text-[var(--muted)]">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        {connectedMeet && meetSpace?.meeting_url ? (
          <a
            href={meetSpace.meeting_url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold"
          >
            Meet-ке кіру →
          </a>
        ) : null}

        <div className="mt-8">
          <MentorTeamManager teamId={team.id} students={students} />
        </div>
      </section>
    </main>
  );
}
