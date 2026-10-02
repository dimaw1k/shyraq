import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { MentorTeamManager } from "@/components/mentor/MentorTeamManager";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMentorWorkspaceData } from "@/lib/mentor/workspace";

export default async function MentorPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "MENTOR") redirect("/dashboard");

  const workspace = await getMentorWorkspaceData(supabase, user.id);

  if (!workspace) {
    return (
      <AppShell role="MENTOR" userName={profile.full_name} title="Басқару">
        <main className="mx-auto w-full max-w-[1180px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="rounded-[18px] border border-[var(--border)] bg-white p-7 text-center shadow-[0_10px_28px_rgba(23,34,53,.035)]">
            <p className="text-sm font-extrabold text-[var(--foreground)]">Команда бекітілмеген</p>
          </div>
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell
      role="MENTOR"
      userName={profile.full_name}
      title="Басқару"
      description={workspace.team.name}
    >
      <MentorTeamManager {...workspace} teamId={workspace.team.id} teamName={workspace.team.name} />
    </AppShell>
  );
}
