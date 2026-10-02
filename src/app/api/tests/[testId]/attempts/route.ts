import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { recordScoreEvent } from "@/lib/scoring-events";

type QuestionRow = {
  id: string;
  points: number;
  question_type: string;
  test_options: Array<{ id: string; is_correct: boolean }>;
};

export async function POST(request: Request, context: { params: Promise<{ testId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { testId } = await context.params;
  const { data: test } = await supabase
    .from("lesson_tests")
    .select("id,lesson_id,active,max_attempts")
    .eq("id", testId)
    .maybeSingle();

  if (!test?.active) return NextResponse.json({ error: "Тест табылмады." }, { status: 404 });

  const { data: progress } = await supabase
    .from("video_progress")
    .select("test_unlocked")
    .eq("lesson_id", test.lesson_id)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!progress?.test_unlocked) return NextResponse.json({ error: "Алдымен бейненің қажетті бөлігін көру керек." }, { status: 403 });

  const { count: existingAttempts } = await supabase
    .from("test_attempts")
    .select("*", { count: "exact", head: true })
    .eq("test_id", testId)
    .eq("student_id", user.id);

  if (Number(existingAttempts ?? 0) >= Number(test.max_attempts ?? 1)) {
    return NextResponse.json({ error: "Бұл тест бойынша мүмкіндік аяқталды." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const answersInput = body?.answers && typeof body.answers === "object" && !Array.isArray(body.answers)
    ? (body.answers as Record<string, unknown>)
    : {};

  const admin = createAdminSupabaseClient();
  const { data: questions, error: questionError } = await admin
    .from("test_questions")
    .select("id,points,question_type,test_options(id,is_correct)")
    .eq("test_id", testId)
    .order("sort_order");

  if (questionError) return NextResponse.json({ error: "Тест деректері жүктелмеді." }, { status: 500 });

  const questionMap = new Map<string, QuestionRow>();
  for (const question of (questions ?? []) as QuestionRow[]) {
    questionMap.set(String(question.id), question);
  }

  if (questionMap.size === 0) return NextResponse.json({ error: "Тестте сұрақ жоқ." }, { status: 409 });

  const normalizedAnswers = new Map<string, string | string[]>();
  for (const [questionId, rawAnswer] of Object.entries(answersInput)) {
    const question = questionMap.get(questionId);
    if (!question) continue;

    if (question.question_type === "TEXT") {
      if (typeof rawAnswer === "string" && rawAnswer.trim()) normalizedAnswers.set(questionId, rawAnswer.trim());
      continue;
    }

    const allowed = new Set(question.test_options.map((option) => String(option.id)));

    if (question.question_type === "MULTIPLE") {
      if (Array.isArray(rawAnswer)) {
        const values = rawAnswer.filter((item): item is string => typeof item === "string" && allowed.has(item));
        if (values.length) normalizedAnswers.set(questionId, [...new Set(values)]);
      }
    } else if (typeof rawAnswer === "string" && allowed.has(rawAnswer)) {
      normalizedAnswers.set(questionId, rawAnswer);
    }
  }

  if (normalizedAnswers.size !== questionMap.size) {
    return NextResponse.json({ error: "Барлық сұрақтарға жауап беріңіз." }, { status: 400 });
  }

  let score = 0;
  const questionResults = Array.from(questionMap.values()).map((question) => {
    const answer = normalizedAnswers.get(question.id);

    if (question.question_type === "TEXT") {
      return {
        questionId: question.id,
        type: "TEXT",
        selectedOptionId: null,
        selectedOptionIds: [],
        correctOptionId: null,
        correctOptionIds: [],
        isCorrect: false,
        manualReview: true,
      };
    }

    const correctIds = question.test_options
      .filter((option) => option.is_correct)
      .map((option) => String(option.id));

    const selectedIds = Array.isArray(answer) ? answer : [String(answer)];
    const isCorrect =
      correctIds.length === selectedIds.length &&
      correctIds.every((id) => selectedIds.includes(id));

    if (isCorrect) score += Number(question.points ?? 0);

    return {
      questionId: question.id,
      type: question.question_type === "MULTIPLE" ? "MULTIPLE" : "SINGLE",
      selectedOptionId: Array.isArray(answer) ? null : String(answer),
      selectedOptionIds: selectedIds,
      correctOptionId: correctIds[0] ?? null,
      correctOptionIds: correctIds,
      isCorrect,
      manualReview: false,
    };
  });

  const attemptNumber = Number(existingAttempts ?? 0) + 1;

  const { data: attempt, error } = await admin
    .from("test_attempts")
    .insert({
      test_id: testId,
      student_id: user.id,
      attempt_number: attemptNumber,
      score,
      submitted_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Бұл тест бойынша мүмкіндік аяқталды." }, { status: 409 });
    return NextResponse.json({ error: "Тесті сақтау мүмкін болмады." }, { status: 400 });
  }

  const answerRows = Array.from(normalizedAnswers.entries()).map(([questionId, answer]) => ({
    attempt_id: attempt.id,
    question_id: questionId,
    selected_option_id: typeof answer === "string" ? answer : null,
    selected_option_ids: Array.isArray(answer) ? answer : null,
    text_answer: typeof answer === "string" && questionMap.get(questionId)?.question_type === "TEXT" ? answer : null,
  }));

  const { error: answerError } = await admin.from("test_answers").insert(answerRows);
  if (answerError) return NextResponse.json({ error: "Тест жауаптарын сақтау мүмкін болмады." }, { status: 500 });

  const { data: membership } = await supabase
    .from("team_members")
    .select("team_id")
    .eq("student_id", user.id)
    .eq("status", "ACTIVE")
    .maybeSingle();

  const { data: rule } = await supabase.from("score_rules").select("weight,active").eq("code", "TESTS").maybeSingle();
  if (rule?.active && Number(rule.weight) !== 0 && questionResults.every((result) => !result.manualReview)) {
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

  return NextResponse.json({ attempt, questionResults });
}
