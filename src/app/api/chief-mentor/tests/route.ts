import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

type ExistingAttachment = { name: string; path: string; mime: string; size: number };
type IncomingOption = { text?: string; isCorrect?: boolean };
type IncomingQuestion = {
  text?: string;
  points?: number;
  type?: "SINGLE" | "MULTIPLE" | "TEXT";
  options?: IncomingOption[];
  attachments?: ExistingAttachment[];
  newFileCount?: number;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES_PER_QUESTION = 3;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

function attachmentList(value: unknown): ExistingAttachment[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ExistingAttachment => (
      item &&
      typeof item === "object" &&
      typeof (item as ExistingAttachment).name === "string" &&
      typeof (item as ExistingAttachment).path === "string" &&
      typeof (item as ExistingAttachment).mime === "string" &&
      typeof (item as ExistingAttachment).size === "number"
    ))
    .slice(0, MAX_FILES_PER_QUESTION);
}

export async function POST(request: Request) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);
  const form = await request.formData();

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
    body = JSON.parse(String(form.get("payload") ?? "{}"));
  } catch {
    return NextResponse.json({ error: "Тест деректері дұрыс емес." }, { status: 400 });
  }

  if (typeof body.lessonId !== "string" || !body.lessonId) return NextResponse.json({ error: "Сабақ таңдалмады." }, { status: 400 });
  if (typeof body.title !== "string" || !body.title.trim()) return NextResponse.json({ error: "Тест атауы қажет." }, { status: 400 });
  if (!Array.isArray(body.questions) || body.questions.length === 0 || body.questions.length > 50) return NextResponse.json({ error: "Кемінде бір сұрақ қажет." }, { status: 400 });

  for (const question of body.questions) {
    const type = question.type ?? "SINGLE";
    if (!["SINGLE", "MULTIPLE", "TEXT"].includes(type)) return NextResponse.json({ error: "Сұрақ түрі дұрыс таңдалмаған." }, { status: 400 });
    if (typeof question.text !== "string" || !question.text.trim()) return NextResponse.json({ error: "Әр сұрақтың мәтіні болуы керек." }, { status: 400 });

    if (type === "TEXT") {
      question.options = [];
    } else {
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6) {
        return NextResponse.json({ error: "Нұсқалы сұрақта 2–6 жауап нұсқасы болуы керек." }, { status: 400 });
      }
      const correctCount = question.options.filter((option) => option.isCorrect === true && typeof option.text === "string" && option.text.trim()).length;
      if (type === "SINGLE" && correctCount !== 1) return NextResponse.json({ error: "Бір дұрыс жауапты сұрақта бір ғана дұрыс нұсқа болуы керек." }, { status: 400 });
      if (type === "MULTIPLE" && correctCount < 1) return NextResponse.json({ error: "Бірнеше дұрыс жауапты сұрақта кемінде бір дұрыс нұсқа болуы керек." }, { status: 400 });
    }
  }

  const admin = createAdminSupabaseClient();
  const { data: lesson } = await admin.from("lessons").select("id,title").eq("id", body.lessonId).maybeSingle();
  if (!lesson) return NextResponse.json({ error: "Сабақ табылмады." }, { status: 404 });

  const { data: existing } = await admin.from("lesson_tests").select("id").eq("lesson_id", body.lessonId).maybeSingle();

  let oldAttachments: ExistingAttachment[] = [];
  if (existing?.id) {
    const { data: oldQuestions } = await admin.from("test_questions").select("attachments").eq("test_id", existing.id);
    oldAttachments = (oldQuestions ?? []).flatMap((question) => attachmentList(question.attachments));
  }

  const passingScore = body.passingScore == null ? null : Math.min(100, Math.max(0, Number(body.passingScore)));
  const maxAttempts = typeof body.maxAttempts === "number" ? Math.max(1, Math.floor(body.maxAttempts)) : 1;

  const { data: test, error: testError } = await admin
    .from("lesson_tests")
    .upsert({
      ...(existing?.id ? { id: existing.id } : {}),
      lesson_id: body.lessonId,
      title: body.title.trim(),
      instructions: typeof body.instructions === "string" ? body.instructions.trim() || null : null,
      passing_score: passingScore,
      max_attempts: maxAttempts,
      active: body.active !== false,
    }, { onConflict: "lesson_id" })
    .select("id,lesson_id,title,instructions,passing_score,max_attempts,active")
    .single();

  if (testError || !test) return NextResponse.json({ error: "Тестті сақтау сәтсіз аяқталды." }, { status: 500 });

  const uploadedPaths: string[] = [];
  try {
    await admin.from("test_questions").delete().eq("test_id", test.id);

    const keepPaths = new Set<string>();
    for (const question of body.questions) {
      for (const attachment of attachmentList(question.attachments)) keepPaths.add(attachment.path);
    }

    for (let questionIndex = 0; questionIndex < body.questions.length; questionIndex += 1) {
      const question = body.questions[questionIndex];
      const preserved = attachmentList(question.attachments);
      const uploaded: ExistingAttachment[] = [];
      const newFileCount = Math.min(MAX_FILES_PER_QUESTION, Math.max(0, Number(question.newFileCount ?? 0)));

      for (let fileIndex = 0; fileIndex < newFileCount; fileIndex += 1) {
        const fileValue = form.get("q" + questionIndex + "_file" + fileIndex);
        if (!(fileValue instanceof File) || fileValue.size === 0) continue;
        if (fileValue.size > MAX_FILE_BYTES) throw new Error("Бір файл 10 МБ-тан аспауы керек.");
        if (!ALLOWED_MIME.has(fileValue.type)) throw new Error("Сурет, PDF немесе Word құжатына ғана рұқсат.");

        const path = "test/" + test.id + "/" + crypto.randomUUID() + "-" + safeName(fileValue.name);
        const { error: uploadError } = await admin.storage.from("test-question-files").upload(path, Buffer.from(await fileValue.arrayBuffer()), {
          contentType: fileValue.type,
          upsert: false,
        });
        if (uploadError) throw new Error("Файлды жүктеу сәтсіз аяқталды.");

        uploadedPaths.push(path);
        uploaded.push({ name: fileValue.name, path, mime: fileValue.type, size: fileValue.size });
      }

      const type = question.type ?? "SINGLE";
      const attachments = [...preserved, ...uploaded].slice(0, MAX_FILES_PER_QUESTION);
      const { data: createdQuestion, error: questionError } = await admin.from("test_questions").insert({
        test_id: test.id,
        question_text: question.text?.trim(),
        points: typeof question.points === "number" && Number.isFinite(question.points) ? Math.max(0, question.points) : 1,
        sort_order: questionIndex,
        question_type: type,
        attachments,
      }).select("id").single();

      if (questionError || !createdQuestion) throw new Error("Сұрақтарды сақтау сәтсіз аяқталды.");

      if (type !== "TEXT") {
        const { error: optionError } = await admin.from("test_options").insert(
          (question.options ?? []).map((option, optionIndex) => ({
            question_id: createdQuestion.id,
            option_text: option.text?.trim(),
            is_correct: option.isCorrect === true,
            sort_order: optionIndex,
          })),
        );
        if (optionError) throw new Error("Жауап нұсқаларын сақтау сәтсіз аяқталды.");
      }
    }

    const stalePaths = oldAttachments.map((item) => item.path).filter((path) => !keepPaths.has(path) && !uploadedPaths.includes(path));
    if (stalePaths.length) await admin.storage.from("test-question-files").remove(stalePaths);
  } catch (error) {
    if (uploadedPaths.length) await admin.storage.from("test-question-files").remove(uploadedPaths);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Тестті сақтау сәтсіз аяқталды." }, { status: 400 });
  }

  await admin.from("audit_logs").insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: existing?.id ? "LESSON_TEST_UPDATED" : "LESSON_TEST_CREATED",
    entity_type: "LESSON_TEST",
    entity_id: test.id,
    metadata: { lesson_id: lesson.id, lesson_title: lesson.title, question_count: body.questions.length },
  });

  return NextResponse.json({ test });
}
