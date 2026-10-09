import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getAuthenticatedStaff } from "@/lib/staff/server";

type ExistingAttachment = { name: string; path: string; mime: string; size: number };
type IncomingOption = { text?: string; isCorrect?: boolean };
type IncomingQuestion = {
  id?: string;
  text?: string;
  points?: number;
  type?: "SINGLE" | "MULTIPLE" | "TEXT";
  options?: IncomingOption[];
  attachments?: ExistingAttachment[];
  newFileCount?: number;
};
type ExistingQuestionRow = {
  id: string;
  question_text: string;
  points: number;
  sort_order: number;
  question_type: string;
  attachments: unknown;
  test_options: Array<{ id: string; option_text: string; is_correct: boolean; sort_order: number }> | null;
};

const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
const MAX_PAYLOAD_BYTES = 512 * 1024;
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_FILE_BYTES = 3 * 1024 * 1024;
const MAX_FILES_PER_QUESTION = 3;
const MAX_QUESTIONS = 50;
const MAX_TITLE_LENGTH = 120;
const MAX_INSTRUCTIONS_LENGTH = 3000;
const MAX_QUESTION_LENGTH = 5000;
const MAX_OPTION_LENGTH = 500;
const MAX_POINTS = 1000;
const MAX_ATTEMPTS = 100;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function attachmentList(value: unknown): ExistingAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ExistingAttachment => (
    isRecord(item) &&
    typeof item.name === "string" &&
    typeof item.path === "string" &&
    typeof item.mime === "string" &&
    typeof item.size === "number" &&
    Number.isFinite(item.size)
  ));
}

function isSafeTestAttachmentPath(path: string, testId: string) {
  return path.startsWith("test/" + testId + "/") &&
    !path.includes("\\") &&
    !path.split("/").includes("..");
}

function attachmentsMatch(incoming: ExistingAttachment[], current: ExistingAttachment[]) {
  return incoming.length === current.length &&
    incoming.every((attachment, index) => attachment.path === current[index]?.path);
}

function questionSetMatches(incoming: IncomingQuestion[], current: ExistingQuestionRow[], preserved: ExistingAttachment[][]) {
  if (incoming.length !== current.length) return false;

  for (let index = 0; index < incoming.length; index += 1) {
    const question = incoming[index];
    const old = current[index];
    const incomingType = question.type ?? "SINGLE";
    if (
      !question.id ||
      question.id !== old.id ||
      question.text?.trim() !== old.question_text ||
      Number(question.points ?? 1) !== Number(old.points) ||
      incomingType !== old.question_type
    ) return false;

    const oldAttachments = attachmentList(old.attachments);
    if (!attachmentsMatch(preserved[index] ?? [], oldAttachments)) return false;

    const oldOptions = (old.test_options ?? []).slice().sort((a, b) => a.sort_order - b.sort_order);
    const newOptions = incomingType === "TEXT" ? [] : (question.options ?? []);
    if (newOptions.length !== oldOptions.length) return false;
    for (let optionIndex = 0; optionIndex < newOptions.length; optionIndex += 1) {
      if (
        newOptions[optionIndex].text?.trim() !== oldOptions[optionIndex].option_text ||
        (newOptions[optionIndex].isCorrect === true) !== oldOptions[optionIndex].is_correct
      ) return false;
    }
  }

  return true;
}

export async function POST(request: Request) {
  const { profile } = await getAuthenticatedStaff(["CHIEF_MENTOR", "LEADER"]);

  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BYTES)
  ) {
    return NextResponse.json(
      { error: "Тест файлдары мен деректері бір сұраныста 4 МБ-тан аспауы керек." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return NextResponse.json({ error: "Тест деректерінің пішімі дұрыс емес." }, { status: 415 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Тест деректері оқылмады." }, { status: 400 });
  }

  const payloadValue = form.get("payload");
  if (typeof payloadValue !== "string") {
    return NextResponse.json({ error: "Тест деректері жіберілмеді." }, { status: 400 });
  }
  if (new TextEncoder().encode(payloadValue).byteLength > MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "Тест мәтіні тым үлкен." }, { status: 413 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(payloadValue);
  } catch {
    return NextResponse.json({ error: "Тест деректері дұрыс емес." }, { status: 400 });
  }

  if (!isRecord(parsedBody)) {
    return NextResponse.json({ error: "Тест деректері дұрыс емес." }, { status: 400 });
  }

  const body = parsedBody as {
    lessonId?: string;
    title?: string;
    instructions?: string | null;
    passingScore?: number | null;
    maxAttempts?: number;
    active?: boolean;
    questions?: IncomingQuestion[];
  };

  if (typeof body.lessonId !== "string" || !body.lessonId.trim()) {
    return NextResponse.json({ error: "Сабақ таңдалмады." }, { status: 400 });
  }
  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: "Тест атауы 1–120 таңба болуы керек." }, { status: 400 });
  }
  if (
    body.instructions !== undefined &&
    body.instructions !== null &&
    (typeof body.instructions !== "string" || body.instructions.length > MAX_INSTRUCTIONS_LENGTH)
  ) {
    return NextResponse.json({ error: "Тест нұсқаулығы 3000 таңбадан аспауы керек." }, { status: 400 });
  }
  if (body.active !== undefined && typeof body.active !== "boolean") {
    return NextResponse.json({ error: "Тест күйі дұрыс емес." }, { status: 400 });
  }
  if (
    body.passingScore !== undefined &&
    body.passingScore !== null &&
    (typeof body.passingScore !== "number" || !Number.isFinite(body.passingScore) || body.passingScore < 0 || body.passingScore > 100)
  ) {
    return NextResponse.json({ error: "Өту ұпайы 0–100 аралығында болуы керек." }, { status: 400 });
  }
  if (
    body.maxAttempts !== undefined &&
    (!Number.isInteger(body.maxAttempts) || Number(body.maxAttempts) < 1 || Number(body.maxAttempts) > MAX_ATTEMPTS)
  ) {
    return NextResponse.json({ error: "Тапсыру мүмкіндігі 1–100 аралығында болуы керек." }, { status: 400 });
  }
  if (!Array.isArray(body.questions) || body.questions.length === 0 || body.questions.length > MAX_QUESTIONS) {
    return NextResponse.json({ error: "Тестте 1–50 сұрақ болуы керек." }, { status: 400 });
  }

  const uploadFiles: File[][] = [];
  const expectedFileKeys = new Set<string>();
  let totalUploadBytes = 0;

  for (let questionIndex = 0; questionIndex < body.questions.length; questionIndex += 1) {
    const question = body.questions[questionIndex];
    if (!isRecord(question)) {
      return NextResponse.json({ error: "Сұрақ деректері дұрыс емес." }, { status: 400 });
    }

    const type = question.type ?? "SINGLE";
    if (type !== "SINGLE" && type !== "MULTIPLE" && type !== "TEXT") {
      return NextResponse.json({ error: "Сұрақ түрі дұрыс таңдалмаған." }, { status: 400 });
    }
    if (typeof question.text !== "string" || !question.text.trim() || question.text.trim().length > MAX_QUESTION_LENGTH) {
      return NextResponse.json({ error: "Сұрақ мәтіні 1–5000 таңба болуы керек." }, { status: 400 });
    }

    if (question.points !== undefined && (
      typeof question.points !== "number" ||
      !Number.isFinite(question.points) ||
      question.points < 0 ||
      question.points > MAX_POINTS
    )) {
      return NextResponse.json({ error: "Сұрақ ұпайы 0–1000 аралығында болуы керек." }, { status: 400 });
    }

    if (question.newFileCount !== undefined && (
      typeof question.newFileCount !== "number" ||
      !Number.isInteger(question.newFileCount) ||
      question.newFileCount < 0 ||
      question.newFileCount > MAX_FILES_PER_QUESTION
    )) {
      return NextResponse.json({ error: "Бір сұраққа ең көбі 3 жаңа файл қосуға болады." }, { status: 400 });
    }

    const newFileCount = Number(question.newFileCount ?? 0);
    const incomingAttachments = question.attachments ?? [];
    if (!Array.isArray(incomingAttachments) || incomingAttachments.length > MAX_FILES_PER_QUESTION) {
      return NextResponse.json({ error: "Бір сұраққа ең көбі 3 файл тіркеуге болады." }, { status: 400 });
    }
    if (incomingAttachments.length + newFileCount > MAX_FILES_PER_QUESTION) {
      return NextResponse.json({ error: "Бір сұрақта сақталған және жаңа файлдарды қосқанда 3 файлдан аспауы керек." }, { status: 400 });
    }

    const filesForQuestion: File[] = [];
    for (let fileIndex = 0; fileIndex < newFileCount; fileIndex += 1) {
      const key = "q" + questionIndex + "_file" + fileIndex;
      expectedFileKeys.add(key);
      const fileValue = form.get(key);
      if (!(fileValue instanceof File) || fileValue.size <= 0) {
        return NextResponse.json({ error: "Файл тіркемесі дұрыс жіберілмеді." }, { status: 400 });
      }
      if (fileValue.size > MAX_FILE_BYTES) {
        return NextResponse.json({ error: "Бір файл 3 МБ-тан аспауы керек." }, { status: 400 });
      }
      if (!ALLOWED_MIME.has(fileValue.type)) {
        return NextResponse.json({ error: "Сурет, PDF немесе Word құжатына ғана рұқсат." }, { status: 400 });
      }
      totalUploadBytes += fileValue.size;
      if (totalUploadBytes > MAX_TOTAL_FILE_BYTES) {
        return NextResponse.json({ error: "Жаңа файлдардың жалпы өлшемі 3 МБ-тан аспауы керек." }, { status: 413 });
      }
      filesForQuestion.push(fileValue);
    }
    uploadFiles.push(filesForQuestion);

    if (type === "TEXT") {
      question.options = [];
    } else {
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6) {
        return NextResponse.json({ error: "Нұсқалы сұрақта 2–6 жауап нұсқасы болуы керек." }, { status: 400 });
      }
      for (const option of question.options) {
        if (!isRecord(option) || typeof option.text !== "string" || !option.text.trim() || option.text.trim().length > MAX_OPTION_LENGTH) {
          return NextResponse.json({ error: "Жауап нұсқасы 1–500 таңба болуы керек." }, { status: 400 });
        }
      }
      const correctCount = question.options.filter((option) => option.isCorrect === true).length;
      if (type === "SINGLE" && correctCount !== 1) {
        return NextResponse.json({ error: "Бір дұрыс жауапты сұрақта бір ғана дұрыс нұсқа болуы керек." }, { status: 400 });
      }
      if (type === "MULTIPLE" && correctCount < 1) {
        return NextResponse.json({ error: "Бірнеше дұрыс жауапты сұрақта кемінде бір дұрыс нұсқа болуы керек." }, { status: 400 });
      }
    }
  }

  for (const [key, value] of form.entries()) {
    if (value instanceof File && !expectedFileKeys.has(key)) {
      return NextResponse.json({ error: "Сұраныста күтпеген файл тіркемесі бар." }, { status: 400 });
    }
  }

  let admin;
  try {
    admin = createAdminSupabaseClient();
  } catch {
    return NextResponse.json({ error: "Тест сақтау қызметі уақытша қолжетімсіз." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const { data: lesson, error: lessonError } = await admin
    .from("lessons")
    .select("id,title")
    .eq("id", body.lessonId)
    .maybeSingle();
  if (lessonError) return NextResponse.json({ error: "Сабақ деректерін жүктеу сәтсіз аяқталды." }, { status: 500 });
  if (!lesson) return NextResponse.json({ error: "Сабақ табылмады." }, { status: 404 });

  const { data: existing, error: existingError } = await admin
    .from("lesson_tests")
    .select("id,title,instructions,passing_score,max_attempts,active")
    .eq("lesson_id", body.lessonId)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: "Тест күйін тексеру сәтсіз аяқталды." }, { status: 500 });

  let oldQuestions: ExistingQuestionRow[] = [];
  if (existing?.id) {
    const { data, error } = await admin
      .from("test_questions")
      .select("id,question_text,points,sort_order,question_type,attachments,test_options(id,option_text,is_correct,sort_order)")
      .eq("test_id", existing.id)
      .order("sort_order", { ascending: true });
    if (error) return NextResponse.json({ error: "Тест сұрақтарын жүктеу сәтсіз аяқталды." }, { status: 500 });
    oldQuestions = (data ?? []) as unknown as ExistingQuestionRow[];
  }

  const oldAttachments = oldQuestions
    .flatMap((question) => attachmentList(question.attachments))
    .filter((attachment) => existing?.id && isSafeTestAttachmentPath(attachment.path, existing.id));
  const oldAttachmentByPath = new Map(oldAttachments.map((attachment) => [attachment.path, attachment]));
  const preservedAttachments: ExistingAttachment[][] = [];

  for (const question of body.questions) {
    const incoming = question.attachments ?? [];
    if (!Array.isArray(incoming)) {
      return NextResponse.json({ error: "Тіркелген файлдар тізімі дұрыс емес." }, { status: 400 });
    }
    const canonical: ExistingAttachment[] = [];
    for (const value of incoming) {
      if (!isRecord(value) || typeof value.path !== "string") {
        return NextResponse.json({ error: "Тіркелген файл дерегі дұрыс емес." }, { status: 400 });
      }
      const known = oldAttachmentByPath.get(value.path);
      if (!existing?.id || !known || !isSafeTestAttachmentPath(value.path, existing.id)) {
        return NextResponse.json({ error: "Файл осы тестке тиесілі емес." }, { status: 400 });
      }
      canonical.push(known);
    }
    preservedAttachments.push(canonical);
  }

  if (existing?.id) {
    const { count, error } = await admin
      .from("test_attempts")
      .select("id", { count: "exact", head: true })
      .eq("test_id", existing.id);
    if (error) return NextResponse.json({ error: "Тест нәтижелерін тексеру сәтсіз аяқталды." }, { status: 500 });

    if (Number(count ?? 0) > 0) {
      if (!questionSetMatches(body.questions, oldQuestions, preservedAttachments)) {
        return NextResponse.json(
          { error: "Бұл тест тапсырылған. Тарихи жауаптар жоғалмауы үшін сұрақтарды немесе файлдарды өзгертуге болмайды." },
          { status: 409 },
        );
      }

      const { data: metadataUpdated, error: metadataError } = await admin
        .from("lesson_tests")
        .update({
          title: body.title.trim(),
          instructions: typeof body.instructions === "string" ? body.instructions.trim() || null : null,
          passing_score: body.passingScore == null ? null : body.passingScore,
          max_attempts: body.maxAttempts ?? 1,
          active: body.active !== false,
        })
        .eq("id", existing.id)
        .select("id,lesson_id,title,instructions,passing_score,max_attempts,active")
        .single();

      if (metadataError || !metadataUpdated) {
        return NextResponse.json({ error: "Тест баптауларын сақтау сәтсіз аяқталды." }, { status: 500 });
      }

      await admin.from("audit_logs").insert({
        actor_id: profile.id,
        actor_role: profile.role,
        action: "LESSON_TEST_METADATA_UPDATED",
        entity_type: "LESSON_TEST",
        entity_id: existing.id,
        metadata: { lesson_id: lesson.id, lesson_title: lesson.title },
      });

      return NextResponse.json({ test: metadataUpdated });
    }
  }

  const passingScore = body.passingScore == null ? null : body.passingScore;
  const maxAttempts = body.maxAttempts ?? 1;
  let testId = existing?.id ?? "";
  let createdTest = false;

  if (existing?.id) {
    const { error } = await admin
      .from("lesson_tests")
      .update({
        title: body.title.trim(),
        instructions: typeof body.instructions === "string" ? body.instructions.trim() || null : null,
        passing_score: passingScore,
        max_attempts: maxAttempts,
        active: false,
      })
      .eq("id", existing.id);
    if (error) return NextResponse.json({ error: "Тестті уақытша жабу сәтсіз аяқталды." }, { status: 500 });
  } else {
    const { data: created, error } = await admin
      .from("lesson_tests")
      .insert({
        lesson_id: body.lessonId,
        title: body.title.trim(),
        instructions: typeof body.instructions === "string" ? body.instructions.trim() || null : null,
        passing_score: passingScore,
        max_attempts: maxAttempts,
        active: false,
      })
      .select("id")
      .single();

    if (error || !created) {
      if (error?.code === "23505") {
        return NextResponse.json({ error: "Бұл сабаққа тест басқа сұраныспен қатар жасалды. Бетті жаңартып көріңіз." }, { status: 409 });
      }
      return NextResponse.json({ error: "Тестті жасау сәтсіз аяқталды." }, { status: 500 });
    }
    testId = created.id;
    createdTest = true;
  }

  const uploadedPaths: string[] = [];
  const newQuestionIds: string[] = [];
  const oldQuestionIds = oldQuestions.map((question) => question.id);
  let oldQuestionsDeleted = false;

  try {
    for (let questionIndex = 0; questionIndex < body.questions.length; questionIndex += 1) {
      const question = body.questions[questionIndex];
      const uploaded: ExistingAttachment[] = [];

      for (const fileValue of uploadFiles[questionIndex]) {
        const path = "test/" + testId + "/" + crypto.randomUUID() + "-" + safeName(fileValue.name);
        const { error: uploadError } = await admin.storage.from("test-question-files").upload(
          path,
          Buffer.from(await fileValue.arrayBuffer()),
          { contentType: fileValue.type, upsert: false },
        );
        if (uploadError) throw new Error("Файлды жүктеу сәтсіз аяқталды.");

        uploadedPaths.push(path);
        uploaded.push({ name: fileValue.name, path, mime: fileValue.type, size: fileValue.size });
      }

      const type = question.type ?? "SINGLE";
      const attachments = [...preservedAttachments[questionIndex], ...uploaded];
      const { data: createdQuestion, error: questionError } = await admin
        .from("test_questions")
        .insert({
          test_id: testId,
          question_text: question.text?.trim(),
          points: typeof question.points === "number" ? question.points : 1,
          sort_order: questionIndex,
          question_type: type,
          attachments,
        })
        .select("id")
        .single();

      if (questionError || !createdQuestion) throw new Error("Сұрақтарды сақтау сәтсіз аяқталды.");
      newQuestionIds.push(createdQuestion.id);

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

    if (oldQuestionIds.length) {
      const { error: deleteOldError } = await admin
        .from("test_questions")
        .delete()
        .in("id", oldQuestionIds);
      if (deleteOldError) throw new Error("Ескі сұрақтарды қауіпсіз ауыстыру сәтсіз аяқталды.");
    }
    oldQuestionsDeleted = true;
  } catch (error) {
    if (!oldQuestionsDeleted) {
      if (newQuestionIds.length) {
        await admin.from("test_questions").delete().in("id", newQuestionIds);
      }
      if (uploadedPaths.length) {
        await admin.storage.from("test-question-files").remove(uploadedPaths);
      }

      if (existing?.id) {
        await admin.from("lesson_tests").update({
          title: existing.title,
          instructions: existing.instructions,
          passing_score: existing.passing_score,
          max_attempts: existing.max_attempts,
          active: existing.active,
        }).eq("id", existing.id);
      } else if (createdTest && testId) {
        await admin.from("lesson_tests").delete().eq("id", testId);
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Тестті сақтау сәтсіз аяқталды." },
      { status: 400 },
    );
  }

  const { data: test, error: activationError } = await admin
    .from("lesson_tests")
    .update({ active: body.active !== false })
    .eq("id", testId)
    .select("id,lesson_id,title,instructions,passing_score,max_attempts,active")
    .single();

  if (activationError || !test) {
    // The new question set has replaced the old set. Keep the test disabled
    // rather than exposing a partially activated version.
    await admin.from("lesson_tests").update({ active: false }).eq("id", testId);
    return NextResponse.json({ error: "Сұрақтар сақталды, бірақ тест күйін жаңарту сәтсіз аяқталды. Қайталап сақтаңыз." }, { status: 500 });
  }

  const keepPaths = new Set(preservedAttachments.flat().map((attachment) => attachment.path));
  const stalePaths = oldAttachments.map((item) => item.path).filter((path) => !keepPaths.has(path) && !uploadedPaths.includes(path));
  if (stalePaths.length) {
    const { error } = await admin.storage.from("test-question-files").remove(stalePaths);
    if (error) console.error("[chief-mentor/tests] stale attachment cleanup failed", { code: error.name || "unknown" });
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
