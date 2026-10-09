import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (!profile?.role || profile.status === "INACTIVE" || (profile.role !== "STUDENT" && profile.status !== "ACTIVE")) return NextResponse.json({ error: "Profile not found or inactive" }, { status: 403 });

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
    ? await admin.from("score_events").select("student_id,points,source_code,source_id").in("student_id", ids)
    : { data: [] as Array<{ student_id: string; points: number; source_code: string | null; source_id: string | null }> };

  let visibleEvents = events ?? [];

  // This endpoint uses the service-role client to aggregate cohort-wide scores,
  // which bypasses score_events RLS. Re-apply the student result-visibility rule
  // before building a student's ranking: TESTS points must not affect displayed
  // ranks until the associated attempt exhausts that test's configured limit.
  if (profile.role === "STUDENT") {
    const testEvents = visibleEvents.filter((event) => event.source_code === "TESTS" && event.source_id);
    const attemptIds = [...new Set(testEvents.map((event) => event.source_id as string))];

    if (attemptIds.length) {
      const { data: attempts, error: attemptsError } = await admin
        .from("test_attempts")
        .select("id,student_id,test_id,attempt_number")
        .in("id", attemptIds);

      const testIds = [...new Set((attempts ?? []).map((attempt) => attempt.test_id))];
      const { data: tests, error: testsError } = testIds.length
        ? await admin.from("lesson_tests").select("id,max_attempts").in("id", testIds)
        : { data: [] as Array<{ id: string; max_attempts: number | null }> };

      const attemptMap = new Map((attempts ?? []).map((attempt) => [attempt.id, attempt]));
      const testMap = new Map((tests ?? []).map((test) => [test.id, test]));

      // Fail closed for TESTS events if we cannot validate the attempt/test pair.
      // Non-test score events remain available so rankings still load if an
      // auxiliary query fails.
      visibleEvents = visibleEvents.filter((event) => {
        if (event.source_code !== "TESTS") return true;
        if (attemptsError || testsError || !event.source_id) return false;

        const attempt = attemptMap.get(event.source_id);
        if (!attempt || attempt.student_id !== event.student_id) return false;

        const test = testMap.get(attempt.test_id);
        if (!test) return false;

        return Number(attempt.attempt_number) >= Math.max(1, Number(test.max_attempts ?? 1));
      });
    } else {
      visibleEvents = visibleEvents.filter((event) => event.source_code !== "TESTS");
    }
  }

  const scoreMap = new Map<string, number>();
  for (const event of visibleEvents) {
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
