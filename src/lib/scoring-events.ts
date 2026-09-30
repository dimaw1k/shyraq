import type { SupabaseClient } from "@supabase/supabase-js";

export async function recordScoreEvent(
  supabase: SupabaseClient,
  input: {
    studentId: string;
    teamId: string | null;
    sourceCode: string;
    sourceId: string;
    points: number;
    metadata?: Record<string, unknown>;
  },
) {
  if (!Number.isFinite(input.points) || input.points === 0) return null;
  const { data, error } = await supabase.rpc("record_score_event", {
    target_student: input.studentId,
    target_team: input.teamId,
    target_source_code: input.sourceCode,
    target_source_id: input.sourceId,
    target_points: input.points,
    target_metadata: input.metadata ?? {},
  });
  if (error) throw new Error("Unable to record score event");
  return data as string | null;
}
