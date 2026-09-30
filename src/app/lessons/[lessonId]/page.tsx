import { notFound, redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { KinescopeLessonPlayer } from "@/components/lessons/KinescopeLessonPlayer";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { lessonId } = await params;
  const { data: lesson } = await supabase.from("lessons")
    .select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,published")
    .eq("id", lessonId).eq("published", true).maybeSingle();

  if (!lesson) notFound();

  const { data: progress } = await supabase.from("video_progress")
    .select("watched_ranges,watched_percent,test_unlocked")
    .eq("lesson_id", lessonId).eq("student_id", user.id).maybeSingle();

  const initialRanges = Array.isArray(progress?.watched_ranges)
    ? (progress.watched_ranges as { start: number; end: number }[])
    : [];

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-semibold">{lesson.title}</h1>
        {lesson.description ? <p className="mt-2 text-[var(--muted)]">{lesson.description}</p> : null}
        <div className="mt-8">
          <KinescopeLessonPlayer
            lessonId={lesson.id}
            videoId={lesson.kinescope_video_id}
            durationSeconds={lesson.duration_seconds}
            requiredWatchPercent={lesson.required_watch_percent}
            initialRanges={initialRanges}
          />
        </div>
        {progress?.test_unlocked ? (
          <a href={"/tests/lesson/" + lesson.id} className="mt-6 inline-flex rounded-xl bg-black px-5 py-3 font-semibold text-white">
            Тестке өту
          </a>
        ) : null}
      </div>
    </main>
  );
}
