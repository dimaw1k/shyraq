import { AppShell } from "@/components/app/AppNav";
import { PageContainer } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { ChiefMentorMentorManager } from "@/components/staff/ChiefMentorMentorManager";

export default async function ChiefMentorMentorsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");

  const { data: mentors } = await supabase
    .from("profiles")
    .select("id,full_name,email,phone,status,avatar_path")
    .eq("role", "MENTOR")
    .order("full_name");

  const mentorIds = (mentors ?? []).map((mentor) => mentor.id);

  const { data: teams } = mentorIds.length
    ? await supabase
        .from("teams")
        .select("id,name,mentor_id")
        .in("mentor_id", mentorIds)
        .order("name")
    : { data: [] as Array<{ id: string; name: string; mentor_id: string | null }> };

  const teamIds = (teams ?? []).map((team) => team.id);

  const { data: members } = teamIds.length
    ? await supabase
        .from("team_members")
        .select("team_id,student_id")
        .in("team_id", teamIds)
        .eq("status", "ACTIVE")
    : { data: [] as Array<{ team_id: string; student_id: string }> };

  const teamNamesByMentor = new Map<string, string[]>();
  for (const team of teams ?? []) {
    if (!team.mentor_id) continue;
    teamNamesByMentor.set(team.mentor_id, [
      ...(teamNamesByMentor.get(team.mentor_id) ?? []),
      team.name,
    ]);
  }

  const studentCountsByMentor = new Map<string, number>();
  const mentorIdByTeam = new Map((teams ?? []).map((team) => [team.id, team.mentor_id]));
  for (const member of members ?? []) {
    const mentorId = mentorIdByTeam.get(member.team_id);
    if (!mentorId) continue;
    studentCountsByMentor.set(
      mentorId,
      (studentCountsByMentor.get(mentorId) ?? 0) + 1,
    );
  }

  const rows = (mentors ?? []).map((mentor) => ({
    id: mentor.id,
    full_name: mentor.full_name,
    email: mentor.email,
    phone: mentor.phone,
    status: mentor.status,
    avatar_url: mentor.avatar_path
      ? supabase.storage.from("avatars").getPublicUrl(mentor.avatar_path).data.publicUrl
      : null,
    team_name: (teamNamesByMentor.get(mentor.id) ?? []).join(", "),
    student_count: studentCountsByMentor.get(mentor.id) ?? 0,
  }));

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Менторлар"
      hideHeader
    >
      <PageContainer>
        <ChiefMentorMentorManager initialMentors={rows} />
      </PageContainer>
    </AppShell>
  );
}
