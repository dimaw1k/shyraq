import Link from "next/link";
import { Users } from "lucide-react";
import { AppShell } from "@/components/app/AppNav";
import { Card, EmptyState, PageContainer, ProgressBar, StatusPill } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { StaffCreateTeamForm } from "@/components/staff/StaffCreateTeamForm";
import { StaffTeamEditForm } from "@/components/staff/StaffTeamEditForm";

export default async function ChiefMentorTeamsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");
  const { data: teams } = await supabase
    .from("teams")
    .select("id,name,mentor_id,capacity,status")
    .order("name");

  const [{ data: mentors }, { data: members }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,role").eq("role", "MENTOR").order("full_name"),
    (teams ?? []).length
      ? supabase
          .from("team_members")
          .select("team_id")
          .in("team_id", (teams ?? []).map((team) => team.id))
          .eq("status", "ACTIVE")
      : Promise.resolve({ data: [] as Array<{ team_id: string }> }),
  ]);

  const mentorMap = new Map((mentors ?? []).map((mentor) => [mentor.id, mentor.full_name]));
  const counts = new Map<string, number>();
  for (const member of members ?? []) counts.set(member.team_id, (counts.get(member.team_id) ?? 0) + 1);

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Командалар"
      description="Барлық ментор командаларының операциялық күйі."
    >
      <PageContainer>
        <div className="space-y-5">
          <StaffCreateTeamForm />

          <Card className="overflow-visible">
            <div className="hidden grid-cols-[1.1fr_1fr_1fr_120px_330px] gap-3 border-b border-[#EFE8E1] bg-[#FCFAF8] px-6 py-3 text-[8px] font-extrabold uppercase tracking-[.12em] text-[#9A9189] lg:grid">
              <span>Команда</span>
              <span>Ментор</span>
              <span>Жүктеме</span>
              <span>Статус</span>
              <span className="text-right">Басқару</span>
            </div>

            <div className="divide-y divide-[#EFE8E1]">
              {(teams ?? []).map((team) => {
                const count = counts.get(team.id) ?? 0;
                const cap = Number(team.capacity ?? 0);
                const pct = cap ? Math.round((count / cap) * 100) : 0;

                return (
                  <div
                    key={team.id}
                    className="grid gap-4 px-5 py-4 lg:grid-cols-[1.1fr_1fr_1fr_120px_330px] lg:items-center lg:px-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#FFF1E2] text-[#FF8000]">
                        <Users size={14} />
                      </span>
                      <div>
                        <Link href={"/chief-mentor/teams/"+team.id} className="text-[11px] font-extrabold text-[#354153] hover:text-[var(--accent)]">{team.name}</Link>
                        <p className="mt-1 text-[9px] text-[#9A9189]">
                          {mentorMap.get(team.mentor_id ?? "") ?? "Ментор жоқ"}
                        </p>
                      </div>
                    </div>

                    <p className="text-[10px] font-bold text-[#4B433C]">
                      {mentorMap.get(team.mentor_id ?? "") ?? "Ментор жоқ"}
                    </p>

                    <ProgressBar
                      value={Math.min(pct, 100)}
                      label={String(count) + "/" + (cap || "—") + " оқушы"}
                    />

                    <StatusPill tone={team.status === "ACTIVE" ? "green" : "red"}>{team.status}</StatusPill>

                    <div className="lg:justify-self-end">
                      <StaffTeamEditForm
                        team={team}
                        mentors={(mentors ?? []).map((mentor) => ({
                          id: mentor.id,
                          full_name: mentor.full_name,
                        }))}
                      />
                    </div>
                  </div>
                );
              })}

              {!teams?.length ? (
                <div className="p-8">
                  <EmptyState title="Команда жоқ." />
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
