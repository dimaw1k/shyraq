import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { recordScoreEvent } from "@/lib/scoring-events";

export async function POST(request: Request, context: { params: Promise<{ testId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { testId } = await context.params;
  const { data: test } = await supabase.from("lesson_tests")
    .select("id,lesson_id,max_attempts,active").eq("id", testId).maybeSingle();
  if (!test?.active) return NextResponse.json({ error: "Test not found" }, { status: 404 });

  const { data: progress } = await supabase.from("video_progress")
    .select("test_unlocked").eq("lesson_id", test.lesson_id).eq("student_id", user.id).maybeSingle();
  if (!progress?.test_unlocked) {
    return NextResponse.json({ error: "Watch the required percentage before starting the test" }, { status: 403 });
  }

  const { data: attempts } = await supabase.from("test_attempts")
    .select("attempt_number").eq("test_id", testId).eq("student_id", user.id)
    .order("attempt_number", { ascending: false }).limit(1);
  const attemptNumber = (attempts?.[0]?.attempt_number ?? 0) + 1;
  if (attemptNumber > test.max_attempts) {
    return NextResponse.json({ error: "Maximum attempts reached" }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const answersInput = body?.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
    ? (body.answers as Record<string, unknown>)
    : {};

  const admin = createAdminSupabaseClient();
  const { data: questions, error: questionError } = await admin.from("test_questions")
    .select("id,points,test_options(id,is_correct)")
    .eq("test_id", testId)
    .order("sort_order", { ascending: true });

  if (questionError) return NextResponse.json({ error: "Test data unavailable" }, { status: 500 });

  const questionMap = new Map<string, { id: string; points: number; correctOptionId: string | null; optionIds: Set<string> }>();
  for (const question of questions ?? []) {
    const options = Array.isArray(question.test_options) ? question.test_options : [];
    const correct = options.find((option: { id: string; is_correct: boolean }) => option.is_correct)?.id ?? null;
    questionMap.set(String(question.id), {
      id: String(question.id),
      points: Number(question.points ?? 0),
      correctOptionId: correct ? String(correct) : null,
      optionIds: new Set(options.map((option: { id: string }) => String(option.id))),
    });
  }

  const answers: Record<string, string> = {};
  for (const [questionId, selectedOption] of Object.entries(answersInput)) {
    if (typeof selectedOption !== "string") continue;
    const question = questionMap.get(questionId);
    if (!question) continue;
    if (!question.optionIds.has(selectedOption)) continue;
    answers[questionId] = selectedOption;
  }

  let score = 0;
  for (const question of questionMap.values()) {
    if (answers[question.id] && question.correctOptionId === answers[question.id]) {
      score += question.points;
    }
  }

  const { data: attempt, error } = await admin.from("test_attempts").insert({
    test_id: testId,
    student_id: user.id,
    attempt_number: attemptNumber,
    score,
    submitted_at: new Date().toISOString(),
  }).select("*").single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "This test attempt was already submitted. Please submit again." }, { status: 409 });
    }
    return NextResponse.json({ error: "Unable to save attempt" }, { status: 400 });
  }

  const answerRows = Object.entries(answers).map(([questionId, selected]) => ({
    attempt_id: attempt.id,
    question_id: questionId,
    selected_option_id: selected,
  }));

  if (answerRows.length) {
    const { error: answerError } = await admin.from("test_answers").insert(answerRows);
    if (answerError) {
      console.error("Test answers save failed", answerError);
      return NextResponse.json({ error: "Attempt saved, but answers could not be stored" }, { status: 500 });
    }
  }

  const { data: membership } = await supabase.from("team_members")
    .select("team_id").eq("student_id", user.id).eq("status", "ACTIVE").maybeSingle();
  const { data: rule } = await supabase.from("score_rules")
    .select("weight,active").eq("code", "TESTS").maybeSingle();

  if (rule?.active && Number(rule.weight) !== 0) {
    try {
      await recordScoreEvent(supabase, {
        studentId: user.id,
        teamId: membership?.team_id ?? null,
        sourceCode: "TESTS",
        sourceId: attempt.id,
        points: Number(rule.weight) * score,
        metadata: { testId, score, attemptNumber },
      });
    } catch (scoreError) {
      console.error("Test score event failed", scoreError);
    }
  }

  return NextResponse.json({ attempt });
}
