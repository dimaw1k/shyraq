import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasReachedWatchGate, watchedPercent, mergeTimeRanges, type TimeRange } from "@/lib/video/coverage";
import { recordScoreEvent } from "@/lib/scoring-events";

const MAX_WATCH_RANGES_PER_REQUEST = 512;
// A fixed total head start accommodates the first client sync, but must not reset
// on every request; otherwise callers can earn the tolerance repeatedly by spamming.
const INITIAL_PLAYBACK_ALLOWANCE_SECONDS = 45;

async function getAccessibleLesson(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, lessonId: string, userId: string) {
  const [{ data: lesson }, { data: membership }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id,duration_seconds,required_watch_percent,published,starts_at,team_id")
      .eq("id", lessonId)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("team_id")
      .eq("student_id", userId)
      .eq("status", "ACTIVE")
      .maybeSingle(),
  ]);

  if (!lesson?.published) return { lesson: null, forbidden: false };

  if (lesson.starts_at && new Date(lesson.starts_at).getTime() > Date.now()) {
    return { lesson: null, forbidden: true };
  }

  if (lesson.team_id && lesson.team_id !== membership?.team_id) {
    return { lesson: null, forbidden: true };
  }

  return { lesson, forbidden: false };
}

export async function GET(_request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "STUDENT" || profile.status === "INACTIVE") {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
  }

  const { lessonId } = await context.params;
  const access = await getAccessibleLesson(supabase, lessonId, user.id);
  if (!access.lesson) {
    return NextResponse.json(
      { error: access.forbidden ? "Lesson is not available for your team or has not opened yet." : "Lesson not found" },
      { status: access.forbidden ? 403 : 404 },
    );
  }

  const { data, error } = await supabase
    .from("video_progress")
    .select("lesson_id,watched_seconds,watched_percent,maximum_position_seconds,watched_ranges,completed,test_unlocked,first_started_at,last_watched_at")
    .eq("lesson_id", lessonId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Unable to load progress" }, { status: 400 });
  return NextResponse.json({ progress: data });
}

export async function POST(request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "STUDENT" || profile.status === "INACTIVE") {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
  }


  const { lessonId } = await context.params;
  const access = await getAccessibleLesson(supabase, lessonId, user.id);
  if (!access.lesson) {
    return NextResponse.json(
      { error: access.forbidden ? "Lesson is not available for your team or has not opened yet." : "Lesson not found" },
      { status: access.forbidden ? 403 : 404 },
    );
  }

  const lesson = access.lesson;

  const { data: existing } = await supabase
    .from("video_progress")
    .select("id,test_unlocked,watched_seconds,watched_ranges,last_watched_at,first_started_at")
    .eq("lesson_id", lessonId)
    .eq("student_id", user.id)
    .maybeSingle();

  const body = await request.json().catch(() => null);
  const rawRanges: unknown[] = Array.isArray(body?.ranges) ? body.ranges : [];
  if (rawRanges.length > MAX_WATCH_RANGES_PER_REQUEST) {
    return NextResponse.json({ error: "Too many watch ranges in one update." }, { status: 413 });
  }
  const incoming: TimeRange[] = [];

  for (const value of rawRanges) {
    if (!value || typeof value !== "object") continue;

    const raw = value as Record<string, unknown>;
    if (typeof raw.start !== "number" || typeof raw.end !== "number") continue;
    if (!Number.isFinite(raw.start) || !Number.isFinite(raw.end)) continue;

    const range = {
      start: Math.max(0, Math.min(lesson.duration_seconds, raw.start)),
      end: Math.max(0, Math.min(lesson.duration_seconds, raw.end)),
    };

    // The client sends merged coverage intervals, which naturally exceed five
    // seconds during normal uninterrupted playback. The cumulative server-side
    // elapsed-time check below prevents fabricated progress from unlocking tests.
    if (range.end > range.start) incoming.push(range);
  }

  if (!incoming.length && !existing) {
    return NextResponse.json({ error: "No valid watch ranges supplied" }, { status: 400 });
  }

  const storedRanges: TimeRange[] = Array.isArray(existing?.watched_ranges)
    ? existing.watched_ranges
        .filter((value: unknown): value is { start: number; end: number } => {
          if (!value || typeof value !== "object") return false;
          const raw = value as Record<string, unknown>;
          return typeof raw.start === "number" && typeof raw.end === "number" &&
            Number.isFinite(raw.start) && Number.isFinite(raw.end);
        })
        .map((value) => ({
          start: Math.max(0, Math.min(lesson.duration_seconds, value.start)),
          end: Math.max(0, Math.min(lesson.duration_seconds, value.end)),
        }))
        .filter((value) => value.end > value.start)
    : [];

  const ranges = mergeTimeRanges([...storedRanges, ...incoming]);

  const percent = watchedPercent(ranges, lesson.duration_seconds);
  const unlocked = hasReachedWatchGate(ranges, lesson.duration_seconds, lesson.required_watch_percent);
  const watchedSeconds = Math.floor((percent / 100) * lesson.duration_seconds);
  // Derive prior coverage from stored ranges rather than trusting a persisted
  // counter; that keeps the elapsed-time check anchored to the actual coverage.
  const previousWatchedSeconds = Math.floor(
    (watchedPercent(storedRanges, lesson.duration_seconds) / 100) * lesson.duration_seconds,
  );
  const nowMs = Date.now();
  const storedFirstStartedAtMs = existing?.first_started_at
    ? Date.parse(existing.first_started_at)
    : NaN;
  // For legacy rows with no first_started_at, backdate once by their already
  // recorded coverage. The timestamp is persisted below, so tolerance cannot reset.
  const firstStartedAtMs = Number.isFinite(storedFirstStartedAtMs)
    ? storedFirstStartedAtMs
    : nowMs - previousWatchedSeconds * 1000;
  const elapsedSinceFirstStartSeconds = Math.max(0, (nowMs - firstStartedAtMs) / 1000);

  // A fixed 45-second allowance is available across the whole playback session,
  // not per request. Repeated or parallel POSTs therefore cannot repeatedly add
  // 30+ seconds of synthetic coverage while barely any real time passes.
  if (watchedSeconds > elapsedSinceFirstStartSeconds + INITIAL_PLAYBACK_ALLOWANCE_SECONDS) {
    return NextResponse.json({ error: "Progress update exceeds the server-side playback allowance" }, { status: 409 });
  }

  const maximumPosition = Math.floor(ranges.reduce((maximum, range) => Math.max(maximum, range.end), 0));

  const payload = {
    lesson_id: lessonId,
    student_id: user.id,
    watched_seconds: watchedSeconds,
    watched_percent: Number(percent.toFixed(2)),
    maximum_position_seconds: maximumPosition,
    watched_ranges: ranges,
    completed: percent >= 100,
    test_unlocked: unlocked,
    first_started_at: new Date(firstStartedAtMs).toISOString(),
    last_watched_at: new Date(nowMs).toISOString(),
  };

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("video_progress")
    .upsert(payload, { onConflict: "lesson_id,student_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Progress save failed" }, { status: 400 });

  if (unlocked && !existing?.test_unlocked) {
    const { data: rule } = await supabase.from("score_rules").select("weight,active").eq("code", "VIDEO").maybeSingle();
    const { data: membership } = await supabase.from("team_members")
      .select("team_id").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle();

    if (rule?.active && Number(rule.weight) !== 0) {
      try {
        await recordScoreEvent(supabase, {
          studentId: user.id,
          teamId: membership?.team_id ?? lesson.team_id ?? null,
          sourceCode: "VIDEO",
          sourceId: data.id,
          points: Number(rule.weight),
          metadata: { lessonId },
        });
      } catch (scoreError) {
        console.error("Video score event failed", scoreError);
      }
    }
  }

  return NextResponse.json({ progress: data });
}
