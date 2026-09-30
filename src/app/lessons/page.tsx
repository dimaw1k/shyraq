import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LessonsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,description,duration_seconds,required_watch_percent,sort_order,starts_at")
    .eq("published", true)
    .order("sort_order", { ascending: true });

  const role = profile?.role ?? "STUDENT";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Сабақтар" description="Kinescope сабақтары және тестке өту прогресі." right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="grid gap-3 md:grid-cols-2">
          {(lessons ?? []).map((lesson) => (
            <article key={lesson.id} className="group rounded-2xl border border-gray-100 bg-white p-4 shadow-soft transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.05)] sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#C25100]">LESSON {lesson.sort_order + 1}</p>
                <span className="text-[10px] text-gray-400">{Math.ceil(lesson.duration_seconds / 60)} мин</span>
              </div>
              <h2 className="mt-2 text-base font-semibold tracking-tight text-gray-900">{lesson.title}</h2>
              {lesson.description ? <p className="mt-1.5 text-sm leading-6 text-gray-500">{lesson.description}</p> : null}
              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs text-gray-400">Тест үшін {lesson.required_watch_percent}% көру</p>
                <Link href={"/lessons/" + lesson.id} className="rounded-lg bg-[#C25100] px-3 py-2 text-xs font-semibold text-white transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:opacity-90">
                  Ашу
                </Link>
              </div>
            </article>
          ))}
          {!lessons?.length ? <div className="col-span-full rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] p-10 text-center text-sm text-gray-500">Жарияланған сабақ жоқ.</div> : null}
        </div>
      </main>
    </AppShell>
  );
}
