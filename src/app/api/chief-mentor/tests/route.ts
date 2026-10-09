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

const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
const MAX_PAYLOAD_BYTES = 512 * 1024;
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const MAX_TOTAL_FILE_BYTES = 3 * 1024 * 1024;
const MAX_FILES_PER_QUESTION = 3;
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

async function hasValidFileSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const startsWith = (signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));

  switch (file.type) {
    case "image/jpeg": return startsWith([0xff, 0xd8, 0xff]);
    case "image/png": return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/webp": return ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP";
    case "application/pdf": return ascii(0, 5) === "%PDF-";
    case "application/msword": return startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return startsWith([0x50, 0x4b, 0x03, 0x04]);
    default: return false;
  }
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

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null && (!/^\d+$/.test(contentLength) || Number(contentLength) > MAX_REQUEST_BYTES)) {
    return NextResponse.json({ error: "Тест файлдары мен деректері 4 МБ-тан аспауы керек." }, { status: 413, headers: { "Cache-Control": "no-store" } });
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return NextResponse.json({ error: "Тест деректерінің пішімі дұрыс емес." }, { status: 415 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Тест деректерін оқу мүмкін болмады." }, { status: 400 });

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
  if (!parsedBody || typeof parsedBody !== "object" || Array.isArray(parsedBody)) {
    return NextResponse.json({ error: "Тест деректері дұрыс емес." }, { status: 400 });
  }

  let receivedFileBytes = 0;
  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      receivedFileBytes += value.size;
      if (receivedFileBytes > MAX_TOTAL_FILE_BYTES) {
        return NextResponse.json({ error: "Жаңа файлдардың жалпы өлшемі 3 МБ-тан аспауы керек." }, { status: 413 });
      }
      if (!/^q\d+_file\d+$/.test(key)) {
        return NextResponse.json({ error: "Күтпеген файл тіркемесі табылды." }, { status: 400 });
      }
    }
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

  if (typeof body.lessonId !== "string" || !body.lessonId.trim()) return NextResponse.json({ error: "Сабақ таңдалмады." }, { status: 400 });
  if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > MAX_TITLE_LENGTH) return NextResponse.json({ error: "Тест атауы 1–120 таңба болуы керек." }, { status: 400 });
  if (body.instructions !== undefined && body.instructions !== null && (typeof body.instructions !== "string" || body.instructions.length > MAX_INSTRUCTIONS_LENGTH)) {
    return NextResponse.json({ error: "Тест нұсқаулығы 3000 таңбадан аспауы керек." }, { status: 400 });
  }
  if (body.active !== undefined && typeof body.active !== "boolean") return NextResponse.json({ error: "Тест күйі дұрыс емес." }, { status: 400 });
  if (body.passingScore !== undefined && body.passingScore !== null && (typeof body.passingScore !== "number" || !Number.isFinite(body.passingScore) || body.passingScore < 0 || body.passingScore > 100)) {
    return NextResponse.json({ error: "Өту ұпайы 0–100 аралығында болуы керек." }, { status: 400 });
  }
  if (body.maxAttempts !== undefined && (!Number.isInteger(body.maxAttempts) || Number(body.maxAttempts) < 1 || Number(body.maxAttempts) > MAX_ATTEMPTS)) {
    return NextResponse.json({ error: "Тапсыру мүмкіндігі 1–100 аралығындағы бүтін сан болуы керек." }, { status: 400 });
  }
  if (!Array.isArray(body.questions) || body.questions.length === 0 || body.questions.length > 50) return NextResponse.json({ error: "Тестте 1–50 сұрақ болуы керек." }, { status: 400 });

  for (const question of body.questions) {
    if (!question || typeof question !== "object" || Array.isArray(question)) return NextResponse.json({ error: "Сұрақ деректері дұрыс емес." }, { status: 400 });
    const type = question.type ?? "SINGLE";
    if (!["SINGLE", "MULTIPLE", "TEXT"].includes(type)) return NextResponse.json({ error: "Сұрақ түрі дұрыс таңдалмаған." }, { status: 400 });
    if (typeof question.text !== "string" || !question.text.trim() || question.text.trim().length > MAX_QUESTION_LENGTH) return NextResponse.json({ error: "Сұрақ мәтіні 1–5000 таңба болуы керек." }, { status: 400 });
    if (question.points !== undefined && (typeof question.points !== "number" || !Number.isFinite(question.points) || question.points < 0 || question.points > MAX_POINTS)) {
      return NextResponse.json({ error: "Сұрақ ұпайы 0–1000 аралығында болуы керек." }, { status: 400 });
    }
    if (question.newFileCount !== undefined && (typeof question.newFileCount !== "number" || !Number.isInteger(question.newFileCount) || question.newFileCount < 0 || question.newFileCount > MAX_FILES_PER_QUESTION)) {
      return NextResponse.json({ error: "Бір сұраққа ең көбі 3 жаңа файл қосуға болады." }, { status: 400 });
    }
    if (question.attachments !== undefined && (!Array.isArray(question.attachments) || question.attachments.length > MAX_FILES_PER_QUESTION)) {
      return NextResponse.json({ error: "Бір сұраққа ең көбі 3 сақталған файл тіркеуге болады." }, { status: 400 });
    }

    if (type === "TEXT") {
      question.options = [];
    } else {
      if (!Array.isArray(question.options) || question.options.length < 2 || question.options.length > 6) {
        return NextResponse.json({ error: "Нұсқалы сұрақта 2–6 жауап нұсқасы болуы керек." }, { status: 400 });
      }
      if (question.options.some((option) => !option || typeof option !== "object" || typeof option.text !== "string" || option.text.trim().length === 0 || option.text.trim().length > MAX_OPTION_LENGTH)) {
        return NextResponse.json({ error: "Жауап нұсқасы 1–500 таңба болуы керек." }, { status: 400 });
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
        attachment.path.length > 1024 ||
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
  let totalUploadBytes = 0;
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
        if (fileValue.size > MAX_FILE_BYTES) throw new Error("Бір файл 3 МБ-тан аспауы керек.");
        if (!ALLOWED_MIME.has(fileValue.type)) throw new Error("Сурет, PDF немесе Word құжатына ғана рұқсат.");
        if (!(await hasValidFileSignature(fileValue))) throw new Error("Файл мазмұны мәлімделген форматқа сәйкес емес.");
        totalUploadBytes += fileValue.size;
        if (totalUploadBytes > MAX_TOTAL_FILE_BYTES) throw new Error("Жаңа файлдардың жалпы өлшемі 3 МБ-тан аспауы керек.");

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
