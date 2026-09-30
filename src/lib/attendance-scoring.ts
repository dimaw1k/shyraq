import type { SupabaseClient } from "@supabase/supabase-js";
import { recordScoreEvent } from "@/lib/scoring-events";

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
  const points = Number(rule.weight) * (percent / 100);
  if (points === 0) return;

  try {
    await recordScoreEvent(supabase, {
      studentId: input.studentId,
      teamId: input.teamId,
      sourceCode: "ATTENDANCE",
      sourceId: input.attendanceId,
      points: Number(points.toFixed(2)),
      metadata: { attendancePercent: Number(percent.toFixed(2)) },
    });
  } catch (error) {
    console.error("Attendance score event failed", error);
  }
}
