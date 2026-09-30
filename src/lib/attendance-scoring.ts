import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordAttendanceScore(
  supabase: SupabaseClient,
  input: {
    attendanceId: string;
    studentId: string;
    teamId: string;
    attendancePercent: number;
    conferenceEnded: boolean;
  },
) {
  if (!input.conferenceEnded) return;

  const { data: rule } = await supabase
    .from("score_rules")
    .select("weight,active")
    .eq("code", "ATTENDANCE")
    .maybeSingle();

  if (!rule?.active || Number(rule.weight) === 0) return;

  const percent = Math.min(100, Math.max(0, Number(input.attendancePercent) || 0));
  const points = Number((Number(rule.weight) * (percent / 100)).toFixed(2));
  if (points === 0) return;

  const { error } = await supabase.from("score_events").upsert({
    student_id: input.studentId,
    team_id: input.teamId,
    source_code: "ATTENDANCE",
    source_id: input.attendanceId,
    points,
    metadata: { attendancePercent: Number(percent.toFixed(2)) },
  }, { onConflict: "student_id,source_code,source_id", ignoreDuplicates: true });

  if (error) {
    console.error("Attendance score event failed", error);
  }
}
