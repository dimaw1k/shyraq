import { AppShell } from "@/components/app/AppNav";
import { PageContainer } from "@/components/ui/ShyraqUI";
import { getAuthenticatedStaff } from "@/lib/staff/server";
import { ChiefMentorStudentsManager } from "@/components/staff/ChiefMentorStudentsManager";

export default async function ChiefMentorStudentsPage() {
  const { supabase, profile } = await getAuthenticatedStaff("CHIEF_MENTOR");

  const [{ data: students }, { data: teams }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,email,phone,status,avatar_path")
      .eq("role", "STUDENT")
      .order("full_name"),
    supabase
      .from("teams")
      .select("id,name,capacity,status")
      .eq("status", "ACTIVE")
      .order("name"),
  ]);

  const studentIds = (students ?? []).map((student) => student.id);
  const teamIds = (teams ?? []).map((team) => team.id);

  const { data: members } = studentIds.length
    ? await supabase
        .from("team_members")
        .select("student_id,team_id")
        .in("student_id", studentIds)
        .eq("status", "ACTIVE")
    : { data: [] as Array<{ student_id: string; team_id: string }> };

  const membershipMap = new Map(
    (members ?? []).map((member) => [member.student_id, member.team_id]),
  );
  const teamMap = new Map((teams ?? []).map((team) => [team.id, team]));

  const initialStudents = (students ?? []).map((student) => {
    const teamId = membershipMap.get(student.id);
    const team = teamId ? teamMap.get(teamId) : null;

    return {
      id: student.id,
      full_name: student.full_name,
      email: student.email,
      phone: student.phone,
      status: student.status,
      avatar_url: student.avatar_path
        ? supabase.storage.from("avatars").getPublicUrl(student.avatar_path).data.publicUrl
        : null,
      team_id: teamId ?? null,
      team_name: team?.name ?? null,
    };
  });

  const initialTeams = (teams ?? []).map((team) => ({
    id: team.id,
    name: team.name,
    capacity: team.capacity,
    count: (members ?? []).filter((member) => member.team_id === team.id).length,
  }));

  const totalStudents = initialStudents.length;
  const assignedStudents = initialStudents.filter((student) => student.team_id).length;
  const unassignedStudents = totalStudents - assignedStudents;

  return (
    <AppShell
      role="CHIEF_MENTOR"
      userName={profile.full_name}
      title="Оқушылар"
      hideHeader
    >
      <PageContainer>
        <ChiefMentorStudentsManager
          initialStudents={initialStudents}
          teams={initialTeams}
          initialStats={{
            total: totalStudents,
            assigned: assignedStudents,
            unassigned: unassignedStudents,
          }}
        />
      </PageContainer>
    </AppShell>
  );
}
