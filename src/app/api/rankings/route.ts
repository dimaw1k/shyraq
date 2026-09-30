import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile?.role) return NextResponse.json({ error: "Profile not found" }, { status: 403 });

  const admin = createAdminSupabaseClient();
  let scope: "global" | "team" = "global";
  let team: { id: string; name: string } | null = null;
  let allowedStudentIds: string[] | null = null;

  if (profile.role === "MENTOR") {
    const { data: mentorTeam } = await admin
      .from("teams")
      .select("id,name")
      .eq("mentor_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (!mentorTeam) return NextResponse.json({ students: [], team: null, currentUserRank: null });
    team = mentorTeam;
    scope = "team";

    const { data: members } = await admin
      .from("team_members")
      .select("student_id")
      .eq("team_id", team.id)
      .eq("status", "ACTIVE");

    allowedStudentIds = (members ?? []).map((member) => member.student_id);
    if (!allowedStudentIds.length) {
      return NextResponse.json({ students: [], team, currentUserRank: null });
    }
  }

  let studentsQuery = admin
    .from("profiles")
    .select("id,full_name,status")
    .eq("role", "STUDENT")
    .in("status", ["WAITING_FOR_TEAM", "ACTIVE", "COMPLETED"]);

  if (allowedStudentIds) {
    studentsQuery = studentsQuery.in("id", allowedStudentIds);
  }

  const { data: students } = await studentsQuery;
  const studentRows = students ?? [];
  const ids = studentRows.map((student) => student.id);
  const { data: events } = ids.length
    ? await admin.from("score_events").select("student_id,points").in("student_id", ids)
    : { data: [] as { student_id: string; points: number }[] };

  const scoreMap = new Map<string, number>();
  for (const event of events ?? []) {
    scoreMap.set(event.student_id, (scoreMap.get(event.student_id) ?? 0) + Number(event.points ?? 0));
  }

  const ranking = studentRows
    .map((student) => ({ ...student, score: scoreMap.get(student.id) ?? 0 }))
    .sort((a, b) => b.score - a.score || a.full_name.localeCompare(b.full_name, "kk-KZ"))
    .map((student, index) => ({ ...student, rank: index + 1 }));

  const currentUserRank = profile.role === "STUDENT"
    ? ranking.find((student) => student.id === user.id) ?? null
    : null;

  if (profile.role === "STUDENT") {
    const topRows = ranking.slice(0, 10);
    const current = currentUserRank;
    const visible = current && !topRows.some((row) => row.id === current.id)
      ? [...topRows, current]
      : topRows;

    return NextResponse.json({
      scope,
      team,
      currentUserRank: current,
      students: visible.sort((a, b) => a.rank - b.rank),
    });
  }

  return NextResponse.json({ scope, team, currentUserRank, students: ranking });
}
