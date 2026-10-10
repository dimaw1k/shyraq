import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasReachedWatchGate, watchedPercent, mergeTimeRanges, type TimeRange } from "@/lib/video/coverage";
import { recordScoreEvent } from "@/lib/scoring-events";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import {
  consumeRateLimit,
  rateLimitResponse,
  rateLimitUnavailableResponse,
} from "@/lib/security/rate-limit";

const MAX_WATCH_RANGES_PER_REQUEST = 512;

async function getAccessibleLesson(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, lessonId: string, userId: string) {
  const [{ data: lesson }, { data: membership }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id,kinescope_video_id,duration_seconds,required_watch_percent,published,starts_at,team_id")
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
  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") {
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
    .select("lesson_id,watched_seconds,watched_percent,maximum_position_seconds,watched_ranges,completed,test_unlocked,first_started_at,last_watched_at,kinescope_video_id_snapshot,duration_seconds_snapshot,required_watch_percent_snapshot")
    .eq("lesson_id", lessonId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Unable to load progress" }, { status: 400 });
  const currentProgress = data &&
    data.kinescope_video_id_snapshot === access.lesson.kinescope_video_id &&
    Number(data.duration_seconds_snapshot) === Number(access.lesson.duration_seconds) &&
    Number(data.required_watch_percent_snapshot) === Number(access.lesson.required_watch_percent)
      ? data
      : null;
  return NextResponse.json({ progress: currentProgress });
}

export async function POST(request: Request, context: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") {
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

  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > 128 * 1024)
  ) {
    return NextResponse.json(
      { error: "Progress update payload is too large." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  // A student can legitimately save progress every 15 seconds. This shared
  // server-side limiter prevents rapid replay/parallel requests from repeatedly
  // claiming the per-request timing tolerance to unlock a test.
  const progressLimit = await consumeRateLimit(
    "video:progress",
    user.id + ":" + lessonId,
    8,
    60,
    60,
  );
  if (!progressLimit.available) return rateLimitUnavailableResponse();
  if (!progressLimit.allowed) {
    return rateLimitResponse(
      progressLimit.retryAfterSeconds,
      "Бейне ілгерілеуі тым жиі жаңартылды. Бір минуттан кейін жалғастырыңыз.",
    );
  }

  const { data: storedProgress } = await supabase
    .from("video_progress")
    .select("id,test_unlocked,watched_seconds,watched_ranges,last_watched_at,first_started_at,kinescope_video_id_snapshot,duration_seconds_snapshot,required_watch_percent_snapshot")
    .eq("lesson_id", lessonId)
    .eq("student_id", user.id)
    .maybeSingle();

  const parsedBody = await readLimitedJson(request, 128 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Progress update payload is too large." : "Invalid progress payload." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const body = parsedBody.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid progress payload." }, { status: 400 });
  }
  const bodyRecord = body as Record<string, unknown>;
  if (typeof bodyRecord.videoId !== "string" || bodyRecord.videoId !== lesson.kinescope_video_id) {
    return NextResponse.json(
      { error: "The lesson video changed. Reload the lesson before continuing." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  const rawRanges: unknown[] = Array.isArray(bodyRecord.ranges) ? bodyRecord.ranges as unknown[] : [];
  if (rawRanges.length > MAX_WATCH_RANGES_PER_REQUEST) {
    return NextResponse.json({ error: "Too many watch ranges in one update." }, { status: 413 });
  }

  // A session start stores a server timestamp before any watch ranges are accepted.
  // This prevents the old 45-second first-request allowance from unlocking a
  // short video in one fabricated progress update.
  const existing = storedProgress &&
    storedProgress.kinescope_video_id_snapshot === lesson.kinescope_video_id &&
    Number(storedProgress.duration_seconds_snapshot) === Number(lesson.duration_seconds) &&
    Number(storedProgress.required_watch_percent_snapshot) === Number(lesson.required_watch_percent) &&
    Number.isFinite(Date.parse(storedProgress.last_watched_at ?? ""))
      ? storedProgress
      : null;

  if (bodyRecord.action === "start") {
    if (rawRanges.length > 0) {
      return NextResponse.json({ error: "Progress session start cannot include watch ranges." }, { status: 400 });
    }
    if (existing?.test_unlocked) return NextResponse.json({ progress: existing });

    const startedAt = new Date().toISOString();
    const admin = createAdminSupabaseClient();

    if (existing) {
      // Do not let time spent away from the lesson count as playback. Rebase
      // the elapsed-time check whenever a student resumes unfinished progress.
      const { data: progress, error } = await admin
        .from("video_progress")
        .update({
          last_watched_at: startedAt,
          updated_at: startedAt,
        })
        .eq("id", existing.id)
        .eq("kinescope_video_id_snapshot", lesson.kinescope_video_id)
        .eq("duration_seconds_snapshot", lesson.duration_seconds)
        .eq("required_watch_percent_snapshot", lesson.required_watch_percent)
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("[lesson-progress] session resume failed", { code: error.code });
        return NextResponse.json({ error: "Progress session could not be resumed." }, { status: 500 });
      }
      if (!progress) {
        return NextResponse.json(
          { error: "The lesson changed. Reload before continuing playback." },
          { status: 409, headers: { "Cache-Control": "no-store" } },
        );
      }
      return NextResponse.json({ progress });
    }

    const { data: progress, error } = await admin
      .from("video_progress")
      .upsert({
        lesson_id: lessonId,
        student_id: user.id,
        kinescope_video_id_snapshot: lesson.kinescope_video_id,
        duration_seconds_snapshot: lesson.duration_seconds,
        required_watch_percent_snapshot: lesson.required_watch_percent,
        watched_seconds: 0,
        watched_percent: 0,
        maximum_position_seconds: 0,
        watched_ranges: [],
        completed: false,
        test_unlocked: false,
        first_started_at: startedAt,
        last_watched_at: startedAt,
      }, { onConflict: "lesson_id,student_id" })
      .select("*")
      .single();

    if (error || !progress) {
      console.error("[lesson-progress] session start failed", { code: error?.code ?? "NO_ROW" });
      return NextResponse.json({ error: "Progress session could not be started." }, { status: 500 });
    }
    return NextResponse.json({ progress });
  }

  if (bodyRecord.action !== "ranges") {
    return NextResponse.json({ error: "Progress action is invalid." }, { status: 400 });
  }
  if (!existing) {
    return NextResponse.json(
      { error: "Start the current lesson playback before syncing watch ranges." },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
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
  const lastWatchedMs = Date.parse(existing.last_watched_at);
  const newCoverageSeconds = Math.max(0, watchedSeconds - previousWatchedSeconds);
  // Credit only newly covered seconds permitted by elapsed server time, capped
  // at 30 seconds. There is no first-request head start: the start action creates
  // a server timestamp before any watch ranges can be accepted.
  const elapsedAllowance = Math.min(
    30,
    Math.ceil(Math.max(0, (nowMs - lastWatchedMs) / 1000)),
  );

  if (newCoverageSeconds > elapsedAllowance) {
    return NextResponse.json({ error: "Progress update exceeds the server-side playback allowance" }, { status: 409 });
  }

  const maximumPosition = Math.floor(ranges.reduce((maximum, range) => Math.max(maximum, range.end), 0));

  const payload = {
    lesson_id: lessonId,
    student_id: user.id,
    kinescope_video_id_snapshot: lesson.kinescope_video_id,
    duration_seconds_snapshot: lesson.duration_seconds,
    required_watch_percent_snapshot: lesson.required_watch_percent,
    watched_seconds: watchedSeconds,
    watched_percent: Number(percent.toFixed(2)),
    maximum_position_seconds: maximumPosition,
    watched_ranges: ranges,
    completed: percent >= 100,
    test_unlocked: unlocked,
    first_started_at: existing.first_started_at ?? new Date(nowMs).toISOString(),
    last_watched_at: new Date(nowMs).toISOString(),
  };

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("video_progress")
    .upsert(payload, { onConflict: "lesson_id,student_id" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: "Progress save failed" }, { status: 400 });

  const { data: latestLesson, error: latestLessonError } = await admin
    .from("lessons")
    .select("kinescope_video_id,duration_seconds,required_watch_percent")
    .eq("id", lessonId)
    .maybeSingle();
  const savedGateStillCurrent = !latestLessonError && latestLesson &&
    latestLesson.kinescope_video_id === data.kinescope_video_id_snapshot &&
    Number(latestLesson.duration_seconds) === Number(data.duration_seconds_snapshot) &&
    Number(latestLesson.required_watch_percent) === Number(data.required_watch_percent_snapshot) &&
    data.test_unlocked === true;

  if (unlocked && !existing?.test_unlocked && savedGateStillCurrent) {
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
