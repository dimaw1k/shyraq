import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "MENTOR" && profile?.role !== "ADMIN") {
    return NextResponse.json({ error: "Ranking access requires mentor or admin role" }, { status: 403 });
  }

  const admin = createAdminSupabaseClient();
  let studentsQuery = admin.from("profiles").select("id,full_name,status").eq("role", "STUDENT");
  if (profile.role === "MENTOR") {
    const { data: team } = await admin.from("teams").select("id").eq("mentor_id", user.id).eq("status", "ACTIVE").maybeSingle();
    if (!team) return NextResponse.json({ students: [], team: null });
    const { data: members } = await admin.from("team_members").select("student_id").eq("team_id", team.id).eq("status", "ACTIVE");
    const ids = (members ?? []).map((member) => member.student_id);
    if (!ids.length) return NextResponse.json({ students: [], team });
    studentsQuery = studentsQuery.in("id", ids) as typeof studentsQuery;
  }

  const { data: students } = await studentsQuery;
  const ids = (students ?? []).map((student) => student.id);
  const { data: events } = ids.length
    ? await admin.from("score_events").select("student_id,points").in("student_id", ids)
    : { data: [] as { student_id: string; points: number }[] };

  const scoreMap = new Map<string, number>();
  for (const event of events ?? []) scoreMap.set(event.student_id, (scoreMap.get(event.student_id) ?? 0) + Number(event.points ?? 0));

  const ranking = (students ?? [])
    .map((student) => ({ ...student, score: scoreMap.get(student.id) ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .map((student, index) => ({ ...student, rank: index + 1 }));

  return NextResponse.json({ students: ranking });
}
