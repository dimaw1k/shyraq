import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell, UserChip } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function TasksPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id,title,description,deadline,points")
    .eq("active", true)
    .order("deadline", { ascending: true, nullsFirst: false });

  const role = profile?.role ?? "STUDENT";

  return (
    <AppShell role={role} userName={profile?.full_name ?? undefined} title="Тапсырмалар" description="Белсенді тапсырмалар және deadline-дар." right={<UserChip name={profile?.full_name ?? undefined} role={role} />}>
      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7">
        <div className="mb-5 rounded-2xl bg-[#FAFAFA] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#C25100]">TASKS</p>
          <p className="mt-1 text-sm text-gray-500">Тапсырманы ашып, жауап пен қажет дәлел файлын жіберіңіз.</p>
        </div>

        <div className="space-y-2.5">
          {(tasks ?? []).map((task) => (
            <Link
              key={task.id}
              href={"/tasks/" + task.id}
              className="block rounded-2xl border border-gray-100 bg-white p-4 shadow-soft transition-all duration-300 ease-in-out hover:-translate-y-0.5 hover:shadow-[0_4px_14px_rgba(0,0,0,0.05)] sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold tracking-tight text-gray-900 sm:text-base">{task.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-gray-500">{task.description}</p>
                </div>
                <span className="shrink-0 rounded-lg bg-[#C25100]/10 px-2.5 py-1.5 text-xs font-semibold text-[#C25100]">{task.points} ұпай</span>
              </div>
              <p className="mt-4 text-xs text-gray-400">
                {task.deadline ? "Deadline: " + new Date(task.deadline).toLocaleString("kk-KZ") : "Deadline белгіленбеген"}
              </p>
            </Link>
          ))}
          {!tasks?.length ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-[#FAFAFA] p-10 text-center text-sm text-gray-500">
              Қазір тапсырма жоқ.
            </div>
          ) : null}
        </div>
      </main>
    </AppShell>
  );
}
