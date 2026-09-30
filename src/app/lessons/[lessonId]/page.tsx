import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { KinescopeLessonPlayer } from "@/components/lessons/KinescopeLessonPlayer";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { lessonId } = await params;
  const [{ data: profile }, { data: lesson }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("lessons").select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,published").eq("id", lessonId).eq("published", true).maybeSingle(),
  ]);

  if (!lesson) notFound();

  const { data: progress } = await supabase
    .from("video_progress")
    .select("watched_ranges,watched_percent,test_unlocked")
    .eq("lesson_id", lessonId)
    .eq("student_id", user.id)
    .maybeSingle();

  const initialRanges = Array.isArray(progress?.watched_ranges)
    ? (progress.watched_ranges as { start: number; end: number }[])
    : [];
  const role = profile?.role ?? "STUDENT";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title={lesson.title} description="Видео прогресін орындап, тестті ашыңыз." right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <section className="min-w-0">
            {lesson.description ? <p className="mb-4 text-sm leading-6 text-gray-500">{lesson.description}</p> : null}
            <KinescopeLessonPlayer
              lessonId={lesson.id}
              videoId={lesson.kinescope_video_id}
              durationSeconds={lesson.duration_seconds}
              requiredWatchPercent={lesson.required_watch_percent}
              initialRanges={initialRanges}
              testHref={"/tests/lesson/" + lesson.id}
              initialTestUnlocked={Boolean(progress?.test_unlocked)}
            />
          </section>

          <aside className="h-fit rounded-2xl border border-gray-100 bg-[#FAFAFA] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">NEXT STEP</p>
            <h2 className="mt-1.5 text-sm font-semibold text-gray-900">Тест</h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              {lesson.required_watch_percent}% бірегей көру орындалғанда тест автоматты түрде ашылады.
            </p>
            <div className="mt-4 rounded-xl bg-white p-3 text-[11px] leading-5 text-gray-500 shadow-soft">
              Тестке өту батырмасы видео прогресімен бірге плеердің астында көрсетіледі.
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
