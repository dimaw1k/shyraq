import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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
  if (input.points < 0) throw new Error("Negative score event is not allowed");

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== input.studentId) {
    throw new Error("Score event actor mismatch");
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("score_events")
    .insert({
      student_id: input.studentId,
      team_id: input.teamId,
      source_code: input.sourceCode,
      source_id: input.sourceId,
      points: input.points,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return null;
    throw new Error("Unable to record score event");
  }

  return (data?.id ?? null) as string | null;
}
