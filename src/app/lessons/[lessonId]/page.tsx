import { notFound, redirect } from "next/navigation";
import { Clock3, LockKeyhole } from "lucide-react";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { KinescopeLessonPlayer } from "@/components/lessons/KinescopeLessonPlayer";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { lessonId } = await params;
  const [{ data: profile }, { data: membership }, { data: lesson }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase.from("team_members").select("team_id").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
    supabase.from("lessons").select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,published,starts_at,marathon_day,team_id,materials").eq("id", lessonId).eq("published", true).maybeSingle(),
  ]);

  if (!lesson) notFound();
  const role = profile?.role ?? "STUDENT";
  if (role === "STUDENT" && lesson.team_id && lesson.team_id !== membership?.team_id) notFound();
  const locked = Boolean(lesson.starts_at && new Date(lesson.starts_at).getTime() > new Date().getTime());

  if (locked) {
    return (
      <AppShell role={role} userName={profile?.full_name ?? undefined} title="Сабақ жабық" right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
        <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
          <div className="rounded-[24px] border border-[#E8E1DA] bg-white p-6 text-center">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F6F2ED] text-[#8D837B]"><LockKeyhole size={22} /></span>
            <h2 className="mt-4 text-xl font-extrabold text-[#172235]">{lesson.title}</h2>
            <p className="mt-2 text-sm text-[#8B8179]">Сабақ әлі ашылған жоқ.</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFF0E8] px-4 py-2 text-xs font-extrabold text-[#C85E2F]"><Clock3 size={14} />{new Date(lesson.starts_at!).toLocaleString("kk-KZ")}</p>
          </div>
        </main>
      </AppShell>
    );
  }

  const materials = Array.isArray(lesson.materials)
    ? lesson.materials.filter((item: unknown): item is { label: string; url: string; type?: string } => Boolean(item && typeof item === "object" && typeof (item as { label?: unknown }).label === "string" && typeof (item as { url?: unknown }).url === "string"))
    : [];

  const { data: progress } = await supabase.from("video_progress")
    .select("watched_ranges,watched_percent,test_unlocked")
    .eq("lesson_id", lessonId)
    .eq("student_id", user.id)
    .maybeSingle();

  const initialRanges = Array.isArray(progress?.watched_ranges) ? (progress.watched_ranges as { start: number; end: number }[]) : [];

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title={lesson.title} description={lesson.marathon_day ? lesson.marathon_day + "-күн · бейне → тест" : "Бейне → тест"} right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
          <section className="min-w-0">
            {lesson.description ? <p className="mb-4 text-sm leading-6 text-gray-500">{lesson.description}</p> : null}
            <KinescopeLessonPlayer lessonId={lesson.id} videoId={lesson.kinescope_video_id} durationSeconds={lesson.duration_seconds} requiredWatchPercent={lesson.required_watch_percent} initialRanges={initialRanges} testHref={"/tests/lesson/" + lesson.id} initialTestUnlocked={Boolean(progress?.test_unlocked)} />
          </section>
          <aside className="h-fit rounded-2xl border border-gray-100 bg-[#FAFAFA] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">КЕЛЕСІ ҚАДАМ</p>
            <h2 className="mt-1.5 text-sm font-semibold text-gray-900">Тест</h2>
            <p className="mt-1 text-xs leading-5 text-gray-500">{lesson.required_watch_percent}% бірегей көру орындалғанда тест автоматты түрде ашылады.</p>
            <div className="mt-4 rounded-xl bg-white p-3 text-[11px] leading-5 text-gray-500 shadow-soft">Видео мен тест сабақтың completion логикасын құрайды.</div>
          {materials.length ? (
            <div className="mt-4 rounded-xl bg-white p-3 shadow-soft">
              <p className="text-[10px] font-extrabold uppercase tracking-[.13em] text-[#C25100]">МАТЕРИАЛДАР</p>
              <div className="mt-2 space-y-2">
                {materials.map((material) => (
                  <a key={material.url} href={material.url} target="_blank" rel="noreferrer" className="block rounded-[10px] bg-[#FFFCF9] px-3 py-2 text-[10px] font-bold text-[#4B433C] hover:text-[#C25100]">
                    {material.label}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
