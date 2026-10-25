import { notFound, redirect } from "next/navigation";
import { Clock3, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { KinescopeLessonPlayer } from "@/components/lessons/KinescopeLessonPlayer";
import { formatKzDateTime } from "@/lib/datetime";

export default async function LessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { lessonId } = await params;
  const [{ data: profile }, { data: membership }, { data: lesson }, { data: lessonTest }] = await Promise.all([
    supabase.from("profiles").select("full_name,role,status").eq("id", user.id).maybeSingle(),
    supabase.from("team_members").select("team_id").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle(),
    supabase.from("lessons").select("id,title,description,kinescope_video_id,duration_seconds,required_watch_percent,published,starts_at,marathon_day,team_id,materials").eq("id", lessonId).eq("published", true).maybeSingle(),
    supabase.from("lesson_tests").select("id,title").eq("lesson_id", lessonId).eq("active", true).maybeSingle(),
  ]);

  if (!lesson) notFound();
  const role = profile?.role ?? "STUDENT";
  if (role === "STUDENT" && profile?.status !== "ACTIVE") notFound();
  if (role === "STUDENT" && lesson.team_id && lesson.team_id !== membership?.team_id) notFound();
  const locked = Boolean(lesson.starts_at && new Date(lesson.starts_at).getTime() > new Date().getTime());

  if (locked) {
    return (
      <AppShell role={role} userName={profile?.full_name ?? undefined} title="Сабақ жабық">
        <main className="mx-auto w-full max-w-3xl px-3.5 py-6 sm:px-6 sm:py-10">
          <div className="rounded-[24px] border border-[#E8E3DD] bg-white p-6 text-center shadow-[0_12px_34px_rgba(23,34,53,.045)] sm:p-9">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F4F1EC] text-[#8D837B]"><LockKeyhole size={22} /></span>
            <h2 className="mt-4 text-xl font-extrabold leading-snug text-[#172235] sm:text-2xl">{lesson.title}</h2>
            <p className="mt-2 text-sm leading-6 text-[#7B746D]">Сабақ әлі ашылған жоқ.</p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#FFF1E2] px-4 py-2.5 text-sm font-bold text-[#B95D00]"><Clock3 size={16} />{formatKzDateTime(lesson.starts_at!)}</p>
          </div>
        </main>
      </AppShell>
    );
  }

  const hasTest=Boolean(lessonTest?.id);
  const materials = Array.isArray(lesson.materials)
    ? lesson.materials.filter((item: unknown): item is { label?: string; title?: string; url?: string; type?: string; description?: string } => Boolean(
        item &&
        typeof item === "object" &&
        (typeof (item as { label?: unknown }).label === "string" || typeof (item as { title?: unknown }).title === "string")
      ))
    : [];

  const { data: storedProgress } = await supabase.from("video_progress")
    .select("watched_ranges,watched_percent,test_unlocked,kinescope_video_id_snapshot,duration_seconds_snapshot,required_watch_percent_snapshot")
    .eq("lesson_id", lessonId)
    .eq("student_id", user.id)
    .maybeSingle();

  const progress = storedProgress &&
    storedProgress.kinescope_video_id_snapshot === lesson.kinescope_video_id &&
    Number(storedProgress.duration_seconds_snapshot) === Number(lesson.duration_seconds) &&
    Number(storedProgress.required_watch_percent_snapshot) === Number(lesson.required_watch_percent)
      ? storedProgress
      : null;
  const initialRanges = Array.isArray(progress?.watched_ranges) ? (progress.watched_ranges as { start: number; end: number }[]) : [];

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title={lesson.title} description={lesson.marathon_day ? lesson.marathon_day + "-күн · " + (hasTest ? "бейне → тест" : "бейне сабақ") : (hasTest ? "Бейне → тест" : "Бейне сабақ")}>
      <main className="mx-auto w-full max-w-6xl px-3.5 py-5 sm:px-6 sm:py-8">
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0">
            {lesson.description ? (
              <p className="mb-5 max-w-3xl text-[14px] leading-7 text-[#6F665E] sm:text-[15px]">
                {lesson.description}
              </p>
            ) : null}
            <KinescopeLessonPlayer lessonId={lesson.id} videoId={lesson.kinescope_video_id} durationSeconds={lesson.duration_seconds} requiredWatchPercent={lesson.required_watch_percent} initialRanges={initialRanges} testHref={hasTest ? "/tests/lesson/" + lesson.id : undefined} initialTestUnlocked={Boolean(progress?.test_unlocked)} trackProgress={hasTest} />
          </section>
          <aside className="h-fit min-w-0 rounded-[20px] border border-[#E8E3DD] bg-white p-4 shadow-[0_12px_34px_rgba(23,34,53,.045)] sm:p-5 lg:sticky lg:top-[72px]">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#FF8000]">КЕЛЕСІ ҚАДАМ</p>
            <h2 className="mt-2 text-base font-extrabold text-[#172235]">{hasTest ? "Тестке өту" : "Сабақ материалы"}</h2>
            <p className="mt-2 text-[13px] leading-6 text-[#6F665E]">
              {hasTest
                ? "Тест бейнесабақтың кемінде " + lesson.required_watch_percent + "% бірегей көру уақыты жиналғаннан кейін ашылады."
                : "Бейнесабақты көріп, осы сабаққа тіркелген материалдармен танысыңыз."}
            </p>
            <div className="mt-4 rounded-[14px] border border-[#E8E3DD] bg-[#FFFCF9] p-3.5 text-[12px] leading-5 text-[#7B746D]">
              {hasTest
                ? "Бейне мен тест сабақтың оқу нәтижесін бірге қалыптастырады."
                : "Сабақты аяқтау үшін бейнематериал мен берілген нұсқауларды орындаңыз."}
            </div>
          {materials.length ? (
            <div className="mt-4 rounded-[16px] border border-[#E8E3DD] bg-[#FAF9F7] p-3.5 sm:p-4">
              <p className="text-[11px] font-extrabold uppercase tracking-[.13em] text-[#FF8000]">МАТЕРИАЛДАР</p>
              <div className="mt-3 space-y-2">
                {materials.map((material,index) => {
                  const label=material.label ?? material.title ?? "Материал";
                  return material.url ? (
                    <a key={material.url+index} href={material.url} target="_blank" rel="noreferrer" className="block rounded-[12px] border border-[#E8E3DD] bg-white px-3 py-3 text-[12px] font-bold text-[#3F3832] transition hover:border-[#FFB66F] hover:text-[#B95D00]">
                      <span>{label}</span>
                      {material.description ? <span className="mt-1 block text-[11px] font-medium leading-5 text-[#7B746D]">{material.description}</span> : null}
                    </a>
                  ) : (
                    <div key={label+index} className="rounded-[12px] border border-[#E8E3DD] bg-white px-3 py-3">
                      <p className="text-[12px] font-bold text-[#3F3832]">{label}</p>
                      {material.description ? <p className="mt-1 text-[11px] font-medium leading-5 text-[#7B746D]">{material.description}</p> : null}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
          </aside>
        </div>
      </main>
    </AppShell>
  );
}
