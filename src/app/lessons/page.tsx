import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function LessonsPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const { data: lessons } = await supabase.from("lessons")
    .select("id,title,description,duration_seconds,required_watch_percent,sort_order,starts_at")
    .eq("published", true).order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role={profile?.role ?? "STUDENT"} />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Сабақтар</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Kinescope арқылы сабақтарды өтіңіз.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {(lessons ?? []).map((lesson) => (
            <article key={lesson.id} className="rounded-2xl border border-[var(--border)] bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">LESSON {lesson.sort_order + 1}</p>
              <h2 className="mt-2 text-xl font-semibold">{lesson.title}</h2>
              {lesson.description ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{lesson.description}</p> : null}
              <p className="mt-4 text-xs text-[var(--muted)]">{Math.ceil(lesson.duration_seconds / 60)} минут · тест үшін {lesson.required_watch_percent}% көру</p>
              <Link href={"/lessons/" + lesson.id} className="mt-5 inline-flex rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white">Сабақты ашу</Link>
            </article>
          ))}
          {!lessons?.length ? <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--muted)]">Жарияланған сабақ жоқ.</div> : null}
        </div>
      </section>
    </main>
  );
}
