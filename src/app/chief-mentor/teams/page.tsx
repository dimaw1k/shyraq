import { AppShell } from "@/components/app/AppNav";
import { PageContainer } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { ChiefMentorTeamsManager } from "@/components/staff/ChiefMentorTeamsManager";

export default async function ChiefMentorTeamsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");

  const { data: teams } = await supabase
    .from("teams")
    .select("id,name,mentor_id,capacity,status")
    .order("name");

  const mentorIds = (teams ?? [])
    .map((team) => team.mentor_id)
    .filter(Boolean) as string[];

  const [{ data: mentors }, { data: members }] = await Promise.all([
    mentorIds.length
      ? supabase
          .from("profiles")
          .select("id,full_name,avatar_path")
          .in("id", mentorIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; full_name: string; avatar_path: string | null }>,
        }),
    (teams ?? []).length
      ? supabase
          .from("team_members")
          .select("team_id,student_id")
          .in(
            "team_id",
            (teams ?? []).map((team) => team.id),
          )
          .eq("status", "ACTIVE")
      : Promise.resolve({
          data: [] as Array<{ team_id: string; student_id: string }>,
        }),
  ]);

  const mentorMap = new Map(
    (mentors ?? []).map((mentor) => [
      mentor.id,
      {
        full_name: mentor.full_name,
        avatar_url: mentor.avatar_path
          ? supabase.storage.from("avatars").getPublicUrl(mentor.avatar_path).data.publicUrl
          : null,
      },
    ]),
  );

  const memberCounts = new Map<string, number>();
  for (const member of members ?? []) {
    memberCounts.set(
      member.team_id,
      (memberCounts.get(member.team_id) ?? 0) + 1,
    );
  }

  const initialTeams = (teams ?? []).map((team) => {
    const mentor = team.mentor_id ? mentorMap.get(team.mentor_id) : null;
    return {
      id: team.id,
      name: team.name,
      mentor_id: team.mentor_id,
      mentor_name: mentor?.full_name ?? null,
      mentor_avatar_url: mentor?.avatar_url ?? null,
      capacity: team.capacity,
      student_count: memberCounts.get(team.id) ?? 0,
      status: team.status,
    };
  });

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Командалар"
      hideHeader
    >
      <PageContainer>
        <ChiefMentorTeamsManager
          initialTeams={initialTeams}
          initialMentors={(mentors ?? []).map((mentor) => ({
            id: mentor.id,
            full_name: mentor.full_name,
            avatar_url: mentor.avatar_path
              ? supabase.storage.from("avatars").getPublicUrl(mentor.avatar_path).data.publicUrl
              : null,
          }))}
        />
      </PageContainer>
    </AppShell>
  );
}
