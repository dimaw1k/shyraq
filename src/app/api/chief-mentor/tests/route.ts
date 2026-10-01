import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

type IncomingOption = { text?: string; isCorrect?: boolean };
type IncomingQuestion = {
  text?: string;
  points?: number;
  options?: IncomingOption[];
};

function validateQuestions(value: unknown): value is IncomingQuestion[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 50;
}

export async function POST(request: Request) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);

  let body: {
    lessonId?: string;
    title?: string;
    instructions?: string | null;
    passingScore?: number | null;
    maxAttempts?: number;
    active?: boolean;
    questions?: IncomingQuestion[];
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (typeof body.lessonId !== "string" || !body.lessonId) {
    return NextResponse.json({ error: "Lesson қажет." }, { status: 400 });
  }

  if (typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Тест атауы қажет." }, { status: 400 });
  }

  if (!validateQuestions(body.questions)) {
    return NextResponse.json({ error: "Кемінде бір сұрақ қажет." }, { status: 400 });
  }

  for (const question of body.questions) {
    if (typeof question.text !== "string" || !question.text.trim()) {
      return NextResponse.json({ error: "Әр сұрақтың мәтіні болуы керек." }, { status: 400 });
    }

    if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6) {
      return NextResponse.json({ error: "Әр сұрақта 2–6 жауап нұсқасы болуы керек." }, { status: 400 });
    }

    const correctCount = question.options.filter(
      (option) => option.isCorrect === true && typeof option.text === "string" && option.text.trim(),
    ).length;

    if (correctCount !== 1) {
      return NextResponse.json({ error: "Әр сұрақта дәл бір дұрыс жауап болуы керек." }, { status: 400 });
    }
  }

  const admin = createAdminSupabaseClient();

  const { data: lesson } = await admin
    .from("lessons")
    .select("id,title")
    .eq("id", body.lessonId)
    .maybeSingle();

  if (!lesson) return NextResponse.json({ error: "Сабақ табылмады." }, { status: 404 });

  const { data: existing } = await admin
    .from("lesson_tests")
    .select("id")
    .eq("lesson_id", body.lessonId)
    .maybeSingle();

  const passingScore =
    body.passingScore === null || body.passingScore === undefined
      ? null
      : Math.min(100, Math.max(0, Number(body.passingScore)));

  const maxAttempts =
    typeof body.maxAttempts === "number"
      ? Math.max(1, Math.floor(body.maxAttempts))
      : 1;

  const { data: test, error: testError } = await admin
    .from("lesson_tests")
    .upsert(
      {
        ...(existing?.id ? { id: existing.id } : {}),
        lesson_id: body.lessonId,
        title: body.title.trim(),
        instructions: typeof body.instructions === "string" ? body.instructions.trim() || null : null,
        passing_score: passingScore,
        max_attempts: maxAttempts,
        active: body.active !== false,
      },
      { onConflict: "lesson_id" },
    )
    .select("id,lesson_id,title,instructions,passing_score,max_attempts,active")
    .single();

  if (testError || !test) {
    return NextResponse.json({ error: "Тестті сақтау сәтсіз аяқталды." }, { status: 500 });
  }

  await admin.from("test_questions").delete().eq("test_id", test.id);

  for (let questionIndex = 0; questionIndex < body.questions.length; questionIndex += 1) {
    const question = body.questions[questionIndex];
    const points =
      typeof question.points === "number" && Number.isFinite(question.points)
        ? Math.max(0, question.points)
        : 1;

    const { data: createdQuestion, error: questionError } = await admin
      .from("test_questions")
      .insert({
        test_id: test.id,
        question_text: question.text?.trim(),
        points,
        sort_order: questionIndex,
      })
      .select("id")
      .single();

    if (questionError || !createdQuestion) {
      return NextResponse.json({ error: "Сұрақтарды сақтау сәтсіз аяқталды." }, { status: 500 });
    }

    const { error: optionError } = await admin.from("test_options").insert(
      question.options!.map((option, optionIndex) => ({
        question_id: createdQuestion.id,
        option_text: option.text?.trim(),
        is_correct: option.isCorrect === true,
        sort_order: optionIndex,
      })),
    );

    if (optionError) {
      return NextResponse.json({ error: "Жауап нұсқаларын сақтау сәтсіз аяқталды." }, { status: 500 });
    }
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: existing?.id ? "LESSON_TEST_UPDATED" : "LESSON_TEST_CREATED",
    entity_type: "LESSON_TEST",
    entity_id: test.id,
    metadata: {
      lesson_id: lesson.id,
      lesson_title: lesson.title,
      question_count: body.questions.length,
    },
  });

  return NextResponse.json({ test });
}
