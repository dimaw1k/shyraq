import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (me?.role !== "ADMIN") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const [
    studentsResult,
    teamsResult,
    mentorsResult,
    activeMembersResult,
    reportsResult,
    attendanceResult,
    scoreResult,
  ] = await Promise.all([
    supabase.from("profiles").select("id,status", { count: "exact", head: false }).eq("role", "STUDENT"),
    supabase.from("teams").select("id,status", { count: "exact", head: false }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "MENTOR"),
    supabase.from("team_members").select("id", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("daily_reports").select("id,status", { count: "exact", head: true }).eq("status", "SUBMITTED"),
    supabase.from("attendance_records").select("attendance_percent"),
    supabase.from("score_events").select("points"),
  ]);

  const attendance = attendanceResult.data ?? [];
  const scores = scoreResult.data ?? [];

  return NextResponse.json({
    students: {
      total: studentsResult.count ?? 0,
      waiting: (studentsResult.data ?? []).filter((student) => student.status === "WAITING_FOR_TEAM").length,
      active: (studentsResult.data ?? []).filter((student) => student.status === "ACTIVE").length,
    },
    teams: teamsResult.count ?? 0,
    mentors: mentorsResult.count ?? 0,
    activeAssignments: activeMembersResult.count ?? 0,
    submittedReports: reportsResult.count ?? 0,
    averageAttendance: attendance.length
      ? Number((attendance.reduce((sum, item) => sum + Number(item.attendance_percent ?? 0), 0) / attendance.length).toFixed(2))
      : 0,
    totalPoints: scores.reduce((sum, item) => sum + Number(item.points ?? 0), 0),
  });
}
