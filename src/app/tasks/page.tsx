import Link from "next/link";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const { data: tasks } = await supabase.from("tasks")
    .select("id,title,description,deadline,points")
    .eq("active", true).order("deadline", { ascending: true, nullsFirst: false });

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <AppNav role={profile?.role ?? "STUDENT"} />
      <section className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-semibold">Тапсырмалар</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Өзіңізге қолжетімді тапсырмалар.</p>
        <div className="mt-8 space-y-4">
          {(tasks ?? []).map((task) => (
            <Link key={task.id} href={"/tasks/" + task.id} className="block rounded-2xl border border-[var(--border)] bg-white p-6 hover:bg-zinc-50">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><h2 className="text-xl font-semibold">{task.title}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{task.description}</p></div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-[var(--accent)]">{task.points} ұпай</span>
              </div>
              <p className="mt-4 text-xs text-[var(--muted)]">{task.deadline ? "Deadline: " + new Date(task.deadline).toLocaleString("kk-KZ") : "Deadline белгіленбеген"}</p>
            </Link>
          ))}
          {!tasks?.length ? <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--muted)]">Қазір тапсырма жоқ.</div> : null}
        </div>
      </section>
    </main>
  );
}
