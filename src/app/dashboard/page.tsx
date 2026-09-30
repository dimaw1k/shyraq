import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, status")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-[var(--border)] bg-white p-8">
          <p className="text-sm font-semibold text-[var(--accent)]">SHYRAQ</p>
          <h1 className="mt-3 text-3xl font-semibold">
            {profile?.full_name ?? "Қош келдіңіз"}
          </h1>
          <p className="mt-2 text-[var(--muted)]">
            Role: {profile?.role ?? "STUDENT"} · Status: {profile?.status ?? "REGISTERED"}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Команда", "Күтілуде"],
              ["Бүгінгі есеп", "Жіберілмеді"],
              ["Видео", "0%"],
              ["Рейтинг", "—"],
            ].map(([title, value]) => (
              <div key={title} className="rounded-2xl bg-zinc-50 p-5">
                <p className="text-sm text-[var(--muted)]">{title}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
