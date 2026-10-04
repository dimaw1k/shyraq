import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "MENTOR") return NextResponse.json({ error: "Mentor access required" }, { status: 403 });

  const { data: team } = await supabase.from("teams").select("id,name,capacity,status").eq("mentor_id", user.id).eq("status", "ACTIVE").maybeSingle();
  if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

  const { data: members } = await supabase.from("team_members")
    .select("student_id,assigned_at,profiles(id,full_name,phone,email,status)")
    .eq("team_id", team.id).eq("status", "ACTIVE");

  const students = (members ?? []).map((item) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    return { ...profile, assigned_at: item.assigned_at };
  });

  const studentIds = students.map((student) => student?.id).filter((id): id is string => Boolean(id));
  const [{ data: reports }, { data: attendance }, { data: scoreEvents }] = await Promise.all([
    studentIds.length ? supabase.from("daily_reports").select("student_id,report_date,status").in("student_id", studentIds) : Promise.resolve({ data: [] as never[] }),
    studentIds.length ? supabase.from("attendance_records").select("student_id,attendance_percent,status").in("student_id", studentIds) : Promise.resolve({ data: [] as never[] }),
    studentIds.length ? supabase.from("score_events").select("student_id,points").in("student_id", studentIds) : Promise.resolve({ data: [] as never[] }),
  ]);

  const scoreMap = new Map<string, number>();
  for (const event of scoreEvents ?? []) scoreMap.set(event.student_id, (scoreMap.get(event.student_id) ?? 0) + Number(event.points ?? 0));

  const attendanceAverage = attendance?.length
    ? attendance.reduce((sum, item) => sum + Number(item.attendance_percent ?? 0), 0) / attendance.length
    : 0;

  const latestReportByStudent = new Set(
    (reports ?? [])
      .filter((item) => item.status === "SUBMITTED")
      .map((item) => item.student_id + ":" + item.report_date),
  );

  return NextResponse.json({
    team,
    students: students.map((student) => ({
      ...student,
      score: scoreMap.get(student?.id ?? "") ?? 0,
      reportCount: student?.id ? [...latestReportByStudent].filter((key) => key.startsWith(student.id + ":")).length : 0,
    })),
    stats: {
      studentCount: students.length,
      attendanceAverage: Number(attendanceAverage.toFixed(2)),
      reportsSubmitted: reports?.filter((report) => report.status === "SUBMITTED").length ?? 0,
    },
  });
}
