import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasReachedWatchGate, watchedPercent, mergeTimeRanges, type TimeRange } from "@/lib/video/coverage";
import { recordScoreEvent } from "@/lib/scoring-events";

export async function GET(_request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await context.params;
  const { data, error } = await supabase.from("video_progress")
    .select("lesson_id,watched_seconds,watched_percent,maximum_position_seconds,watched_ranges,completed,test_unlocked,first_started_at,last_watched_at")
    .eq("lesson_id", lessonId).eq("student_id", user.id).maybeSingle();
  if (error) return NextResponse.json({ error: "Unable to load progress" }, { status: 400 });
  return NextResponse.json({ progress: data });
}

export async function POST(request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { lessonId } = await context.params;
  const { data: lesson } = await supabase.from("lessons")
    .select("id,duration_seconds,required_watch_percent,published").eq("id", lessonId).maybeSingle();
  if (!lesson?.published) return NextResponse.json({ error: "Lesson not found" }, { status: 404 });

  const { data: existing } = await supabase.from("video_progress")
    .select("id,test_unlocked,watched_ranges").eq("lesson_id", lessonId).eq("student_id", user.id).maybeSingle();

  const body = await request.json().catch(() => null);
  const incoming = Array.isArray(body?.ranges)
    ? body.ranges.filter((r: unknown): r is TimeRange => {
        if (!r || typeof r !== "object") return false;
        const value = r as Record<string, unknown>;
        return typeof value.start === "number" && typeof value.end === "number";
      })
    : [];

  const storedRanges = Array.isArray(existing?.watched_ranges)
    ? (existing.watched_ranges as TimeRange[])
    : [];
  const ranges = mergeTimeRanges([...storedRanges, ...incoming]);

  const percent = watchedPercent(ranges, lesson.duration_seconds);
  const unlocked = hasReachedWatchGate(ranges, lesson.duration_seconds, lesson.required_watch_percent);
  const watchedSeconds = Math.floor((percent / 100) * lesson.duration_seconds);
  const maximumPosition = Math.floor(Math.max(0, ...ranges.map((r) => r.end)));

  const payload = {
    lesson_id: lessonId,
    student_id: user.id,
    watched_seconds: watchedSeconds,
    watched_percent: Number(percent.toFixed(2)),
    maximum_position_seconds: maximumPosition,
    watched_ranges: ranges,
    completed: percent >= 100,
    test_unlocked: unlocked,
    first_started_at: existing ? undefined : new Date().toISOString(),
    last_watched_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("video_progress")
    .upsert(payload, { onConflict: "lesson_id,student_id" }).select("*").single();
  if (error) return NextResponse.json({ error: "Progress save failed" }, { status: 400 });

  if (unlocked && !existing?.test_unlocked) {
    const { data: rule } = await supabase.from("score_rules").select("weight,active")
      .eq("code", "VIDEO").maybeSingle();
    const { data: membership } = await supabase.from("team_members")
      .select("team_id").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle();
    if (rule?.active && Number(rule.weight) !== 0) {
      await recordScoreEvent(supabase, {
        studentId: user.id,
        teamId: membership?.team_id ?? null,
        sourceCode: "VIDEO",
        sourceId: data.id,
        points: Number(rule.weight),
        metadata: { lessonId },
      });
    }
  }

  return NextResponse.json({ progress: data });
}
