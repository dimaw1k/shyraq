import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { recordScoreEvent } from "@/lib/scoring-events";

const MAX_ATTEMPT_BODY_BYTES = 64 * 1024;
const MAX_TEXT_ANSWER_LENGTH = 5000;

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

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
  }

  const { testId } = await context.params;
  const { data: test } = await supabase
    .from("lesson_tests")
    .select("id,lesson_id,active,max_attempts")
    .eq("id", testId)
    .maybeSingle();

  if (!test?.active) return NextResponse.json({ error: "Тест табылмады." }, { status: 404 });

  const [{ data: lesson }, { data: membership }, { data: progress }] = await Promise.all([
    supabase
      .from("lessons")
      .select("id,published,starts_at,team_id,kinescope_video_id")
      .eq("id", test.lesson_id)
      .maybeSingle(),
    supabase
      .from("team_members")
      .select("team_id")
      .eq("student_id", user.id)
      .eq("status", "ACTIVE")
      .maybeSingle(),
    supabase
      .from("video_progress")
      .select("test_unlocked")
      .eq("lesson_id", test.lesson_id)
      .eq("student_id", user.id)
      .maybeSingle(),
  ]);

  if (!lesson?.published) return NextResponse.json({ error: "Сабақ табылмады." }, { status: 404 });
  if (lesson.starts_at && new Date(lesson.starts_at).getTime() > Date.now()) {
    return NextResponse.json({ error: "Сабақ әлі ашылған жоқ." }, { status: 403 });
  }
  if (lesson.team_id && lesson.team_id !== membership?.team_id) {
    return NextResponse.json({ error: "Бұл тест сіздің командаңызға арналмаған." }, { status: 403 });
  }

  if (!progress?.test_unlocked) {
    return NextResponse.json({ error: "Алдымен бейненің қажетті бөлігін көру керек." }, { status: 403 });
  }

  const { count: existingAttempts } = await supabase
    .from("test_attempts")
    .select("*", { count: "exact", head: true })
    .eq("test_id", testId)
    .eq("student_id", user.id);

  if (Number(existingAttempts ?? 0) >= Number(test.max_attempts ?? 1)) {
    return NextResponse.json({ error: "Бұл тест бойынша мүмкіндік аяқталды." }, { status: 409 });
  }

  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_ATTEMPT_BODY_BYTES)
  ) {
    return NextResponse.json(
      { error: "Жауаптар тым үлкен." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Тест жауабының пішімі дұрыс емес." }, { status: 400 });
  }
  if (new TextEncoder().encode(JSON.stringify(body)).byteLength > MAX_ATTEMPT_BODY_BYTES) {
    return NextResponse.json(
      { error: "Жауаптар тым үлкен." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!body.answers || typeof body.answers !== "object" || Array.isArray(body.answers)) {
    return NextResponse.json({ error: "Тест сұрақтарына жауап беру міндетті." }, { status: 400 });
  }
  const answersInput = body.answers as Record<string, unknown>;

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
      if (typeof rawAnswer === "string") {
        const answer = rawAnswer.trim();
        if (answer.length > MAX_TEXT_ANSWER_LENGTH) {
          return NextResponse.json(
            { error: "Мәтіндік жауап 5000 таңбадан аспауы керек." },
            { status: 400 },
          );
        }
        if (answer) normalizedAnswers.set(questionId, answer);
      }
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
      correctOptionId: correctIds.length === 1 ? correctIds[0] : null,
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
  if (answerError) {
    // Attempt creation and answer persistence are separate HTTP database calls.
    // Compensate if the second write fails so transient errors do not consume a
    // student's attempt without saving their answers.
    const { error: cleanupError } = await admin
      .from("test_attempts")
      .delete()
      .eq("id", attempt.id)
      .eq("student_id", user.id);
    if (cleanupError) {
      console.error("[tests/attempts] failed to roll back incomplete attempt", {
        code: cleanupError.code,
      });
    }
    return NextResponse.json({ error: "Тест жауаптарын сақтау мүмкін болмады." }, { status: 500 });
  }

  const { data: rule } = await supabase.from("score_rules").select("weight,active").eq("code", "TESTS").maybeSingle();
  if (rule?.active && Number(rule.weight) !== 0 && questionResults.every((result) => !result.manualReview)) {
    try {
      await recordScoreEvent(supabase, {
        studentId: user.id,
        teamId: membership?.team_id ?? lesson.team_id ?? null,
        sourceCode: "TESTS",
        sourceId: attempt.id,
        points: Number(rule.weight) * score,
        metadata: { testId, score, attemptNumber },
      });
    } catch (scoreError) {
      console.error("Test score event failed", scoreError);
    }
  }

  return NextResponse.json({
    attempt,
    questionResults: questionResults.map(({ questionId, type, selectedOptionId, selectedOptionIds, correctOptionId, correctOptionIds, isCorrect, manualReview }) => ({
      questionId,
      type,
      selectedOptionId,
      selectedOptionIds,
      correctOptionId,
      correctOptionIds,
      isCorrect,
      manualReview,
    })),
  });
}
