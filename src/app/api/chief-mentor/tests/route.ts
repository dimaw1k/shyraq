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

  const { data: existing, error: existingError } = await admin
    .from("lesson_tests")
    .select("id")
    .eq("lesson_id", body.lessonId)
    .maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: "Тесттің күйін тексеру сәтсіз аяқталды." }, { status: 500 });
  }

  // Question replacement cascades to test_answers. Preserve historical attempts
  // by requiring a new test version once anyone has submitted this one.
  if (existing?.id) {
    const { count: attemptCount, error: attemptLookupError } = await admin
      .from("test_attempts")
      .select("id", { count: "exact", head: true })
      .eq("test_id", existing.id);

    if (attemptLookupError) {
      return NextResponse.json({ error: "Тест әрекеттерін тексеру сәтсіз аяқталды." }, { status: 500 });
    }
    if (Number(attemptCount ?? 0) > 0) {
      return NextResponse.json(
        { error: "Бұл тест тапсырылып қойған. Оқушылардың жауап тарихын сақтау үшін жаңа тест нұсқасын жасаңыз." },
        { status: 409 },
      );
    }
  }

  // Preserved attachment paths must belong to this exact test. The editor must
  // never carry a private attachment path over from another test.
  const expectedAttachmentPrefix = existing?.id ? "test/" + existing.id + "/" : "";
  for (const question of body.questions) {
    for (const attachment of attachmentList(question.attachments)) {
      if (
        !expectedAttachmentPrefix ||
        !attachment.path.startsWith(expectedAttachmentPrefix) ||
        attachment.path.includes("\\") ||
        attachment.path.split("/").includes("..")
      ) {
        return NextResponse.json({ error: "Сақталған тіркеме осы тестке тиесілі емес." }, { status: 400 });
      }
    }
  }

  let oldAttachments: ExistingAttachment[] = [];
  if (existing?.id) {
    const { data: oldQuestions, error: oldQuestionsError } = await admin
      .from("test_questions")
      .select("attachments")
      .eq("test_id", existing.id);

    if (oldQuestionsError) {
      return NextResponse.json({ error: "Ескі тест файлдарын оқу сәтсіз аяқталды." }, { status: 500 });
    }
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
    const keepPaths = new Set<string>();
    const preparedQuestions: Array<{
      question_text: string;
      points: number;
      sort_order: number;
      question_type: "SINGLE" | "MULTIPLE" | "TEXT";
      attachments: ExistingAttachment[];
      options: Array<{ option_text: string; is_correct: boolean; sort_order: number }>;
    }> = [];

    for (let questionIndex = 0; questionIndex < body.questions.length; questionIndex += 1) {
      const question = body.questions[questionIndex];
      const type = question.type ?? "SINGLE";
      const preserved = attachmentList(question.attachments);
      const requestedNewFiles = Number(question.newFileCount ?? 0);

      if (
        !Number.isInteger(requestedNewFiles) ||
        requestedNewFiles < 0 ||
        requestedNewFiles > MAX_FILES_PER_QUESTION - preserved.length
      ) {
        throw new Error("Әр сұраққа ең көбі 3 файл тіркеуге болады.");
      }

      const uploaded: ExistingAttachment[] = [];
      for (let fileIndex = 0; fileIndex < requestedNewFiles; fileIndex += 1) {
        const fileValue = form.get("q" + questionIndex + "_file" + fileIndex);
        if (!(fileValue instanceof File) || fileValue.size === 0) {
          throw new Error("Тіркеме файлы табылмады. Қайта таңдап көріңіз.");
        }
        if (fileValue.size > MAX_FILE_BYTES) throw new Error("Бір файл 10 МБ-тан аспауы керек.");
        if (!ALLOWED_MIME.has(fileValue.type)) throw new Error("Сурет, PDF немесе Word құжатына ғана рұқсат.");

        const path = "test/" + test.id + "/" + crypto.randomUUID() + "-" + safeName(fileValue.name);
        const { error: uploadError } = await admin.storage.from("test-question-files").upload(
          path,
          Buffer.from(await fileValue.arrayBuffer()),
          { contentType: fileValue.type, upsert: false },
        );
        if (uploadError) throw new Error("Файлды жүктеу сәтсіз аяқталды.");

        uploadedPaths.push(path);
        uploaded.push({ name: fileValue.name, path, mime: fileValue.type, size: fileValue.size });
      }

      const attachments = [...preserved, ...uploaded];
      attachments.forEach((attachment) => keepPaths.add(attachment.path));

      preparedQuestions.push({
        question_text: question.text!.trim(),
        points: typeof question.points === "number" && Number.isFinite(question.points) ? Math.max(0, question.points) : 1,
        sort_order: questionIndex,
        question_type: type,
        attachments,
        options: type === "TEXT"
          ? []
          : (question.options ?? []).map((option, optionIndex) => ({
              option_text: option.text!.trim(),
              is_correct: option.isCorrect === true,
              sort_order: optionIndex,
            })),
      });
    }

    // The DB function locks the test row, verifies there are no attempts, and
    // replaces all questions/options in a single transaction. If any insert
    // fails, the old question set remains intact.
    const { error: replaceError } = await admin.rpc("replace_lesson_test_questions", {
      p_test_id: test.id,
      p_questions: preparedQuestions,
    });

    if (replaceError) {
      if (replaceError.code === "55000") {
        throw new Error("Бұл тест тапсырылып қойған. Оқушылардың жауап тарихын сақтау үшін жаңа тест нұсқасын жасаңыз.");
      }
      console.error("[chief-mentor/tests] question replacement failed", { code: replaceError.code });
      throw new Error("Тест сұрақтарын толық сақтау мүмкін болмады.");
    }

    const stalePaths = oldAttachments
      .map((attachment) => attachment.path)
      .filter((oldPath) => !keepPaths.has(oldPath));

    if (stalePaths.length) {
      const { error: removeError } = await admin.storage.from("test-question-files").remove(stalePaths);
      if (removeError) {
        // The DB references now point only to the new files, so a stale-storage
        // cleanup failure is logged and can be retried without breaking the test.
        console.error("[chief-mentor/tests] stale attachment cleanup failed", { code: removeError.name });
      }
    }
  } catch (error) {
    if (uploadedPaths.length) {
      const { error: cleanupError } = await admin.storage.from("test-question-files").remove(uploadedPaths);
      if (cleanupError) {
        console.error("[chief-mentor/tests] upload rollback cleanup failed", { code: cleanupError.name });
      }
    }
    if (!existing?.id) {
      // Do not leave a newly-created empty test if its first question set failed.
      const { error: deleteTestError } = await admin.from("lesson_tests").delete().eq("id", test.id);
      if (deleteTestError) {
        console.error("[chief-mentor/tests] failed to remove incomplete new test", { code: deleteTestError.code });
      }
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Тестті сақтау сәтсіз аяқталды." },
      { status: error instanceof Error && error.message.includes("жауап тарихын сақтау") ? 409 : 400 },
    );
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
