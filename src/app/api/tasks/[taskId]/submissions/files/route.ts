import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { inspectSignedStorageObject } from "@/lib/security/file-validation";
import {
  consumeRateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

type UploadBody = {
  action?: unknown;
  submissionId?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
  sizeBytes?: unknown;
  storagePath?: unknown;
};

function isValidFileMetadata(body: UploadBody) {
  return (
    typeof body.fileName === "string" &&
    body.fileName.trim().length > 0 &&
    body.fileName.length <= 180 &&
    typeof body.mimeType === "string" &&
    ALLOWED.has(body.mimeType) &&
    typeof body.sizeBytes === "number" &&
    Number.isInteger(body.sizeBytes) &&
    body.sizeBytes > 0 &&
    body.sizeBytes <= MAX_BYTES
  );
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "").slice(0, 100) || "file";
}

function validStoragePath(path: string, userId: string, submissionId: string) {
  const prefix = userId + "/" + submissionId + "/";
  if (
    !path.startsWith(prefix) ||
    path.includes("..") ||
    path.includes("\\")
  ) {
    return false;
  }

  const tail = path.slice(prefix.length);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[A-Za-z0-9._-]{1,100}$/i.test(tail);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;
    const body = (await request.json().catch(() => null)) as UploadBody | null;
    const action = body?.action;
    const submissionId =
      typeof body?.submissionId === "string" ? body.submissionId : "";

    if (!body || (action !== "prepare" && action !== "complete") || !submissionId) {
      return NextResponse.json({ error: "Файл жүктеу сұранысы дұрыс емес." }, { status: 400 });
    }

    const rateLimit = await consumeRateLimit(
      "task-file:" + action,
      user.id,
      30,
      10 * 60,
      10 * 60,
    );
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit.retryAfterSeconds, "Файл жүктеу әрекеттері тым жиі орындалды. Қайта көріңіз.");
    }

    if (!isValidFileMetadata(body)) {
      return NextResponse.json(
        { error: "Файл 20 МБ-тан аспауы және рұқсат етілген форматта болуы керек." },
        { status: 400 },
      );
    }

    const { data: submission, error: submissionError } = await supabase
      .from("task_submissions")
      .select("id,task_id,student_id,status")
      .eq("id", submissionId)
      .eq("task_id", taskId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (submissionError) {
      return NextResponse.json({ error: "Тапсырма деректерін тексеру мүмкін болмады." }, { status: 503 });
    }
    if (!submission) {
      return NextResponse.json({ error: "Тапсырма жауабы табылмады." }, { status: 404 });
    }
    if (submission.status !== "DRAFT") {
      return NextResponse.json({ error: "Файл тек сақталған жауап жобасына қосылады." }, { status: 409 });
    }

    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("id,team_id,active,starts_at,max_files")
      .eq("id", taskId)
      .maybeSingle();

    if (taskError) {
      return NextResponse.json({ error: "Тапсырманы тексеру мүмкін болмады." }, { status: 503 });
    }
    if (!task?.active) {
      return NextResponse.json({ error: "Тапсырма белсенді емес." }, { status: 404 });
    }
    if (task.starts_at && new Date(task.starts_at).getTime() > Date.now()) {
      return NextResponse.json({ error: "Тапсырма әлі басталған жоқ." }, { status: 409 });
    }

    if (task.team_id !== null) {
      const { data: membership, error: membershipError } = await supabase
        .from("team_members")
        .select("team_id")
        .eq("student_id", user.id)
        .eq("status", "ACTIVE")
        .maybeSingle();

      if (membershipError) {
        return NextResponse.json({ error: "Топ мүшелігін тексеру мүмкін болмады." }, { status: 503 });
      }
      if (task.team_id !== membership?.team_id) {
        return NextResponse.json({ error: "Бұл тапсырма сіздің тобыңызға берілмеген." }, { status: 403 });
      }
    }

    const storagePath =
      typeof body.storagePath === "string" ? body.storagePath : "";
    const fileName = typeof body.fileName === "string" ? body.fileName.trim() : "";
    const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
    const sizeBytes = typeof body.sizeBytes === "number" ? body.sizeBytes : 0;
    const admin = createAdminSupabaseClient();

    if (action === "prepare") {
      const { count, error: countError } = await supabase
        .from("submission_files")
        .select("id", { count: "exact", head: true })
        .eq("submission_id", submissionId);

      if (countError) {
        return NextResponse.json({ error: "Файл санын тексеру мүмкін болмады." }, { status: 503 });
      }

      if ((count ?? 0) >= Number(task.max_files ?? 5)) {
        return NextResponse.json({ error: "Файл лимиті толды." }, { status: 409 });
      }

      const path =
        user.id +
        "/" +
        submissionId +
        "/" +
        crypto.randomUUID() +
        "-" +
        safeFileName(fileName);

      const { data, error } = await admin.storage
        .from("submissions")
        .createSignedUploadUrl(path);

      if (error || !data?.token || !data.path) {
        console.error("[task-file-upload] signed upload URL creation failed", {
          code: error?.name,
          message: error?.message,
        });
        return NextResponse.json({ error: "Файл жүктеу сілтемесін жасау мүмкін болмады." }, { status: 503 });
      }

      return NextResponse.json(
        { storagePath: data.path, token: data.token },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!validStoragePath(storagePath, user.id, submissionId)) {
      return NextResponse.json({ error: "Файл жолы дұрыс емес." }, { status: 400 });
    }

    const { data: existingFile, error: existingError } = await supabase
      .from("submission_files")
      .select("*")
      .eq("submission_id", submissionId)
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: "Файл деректерін тексеру мүмкін болмады." }, { status: 503 });
    }
    if (existingFile) {
      return NextResponse.json({ file: existingFile }, { headers: { "Cache-Control": "no-store" } });
    }

    const { count, error: countError } = await supabase
      .from("submission_files")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", submissionId);

    if (countError) {
      return NextResponse.json({ error: "Файл санын тексеру мүмкін болмады." }, { status: 503 });
    }
    if ((count ?? 0) >= Number(task.max_files ?? 5)) {
      await admin.storage.from("submissions").remove([storagePath]);
      return NextResponse.json({ error: "Файл лимиті толды." }, { status: 409 });
    }

    const { data: signedFile, error: signedFileError } = await admin.storage
      .from("submissions")
      .createSignedUrl(storagePath, 60);

    if (signedFileError || !signedFile?.signedUrl) {
      return NextResponse.json(
        { error: "Жүктелген файлды тексеру мүмкін болмады. Қайта көріңіз." },
        { status: 503, headers: { "Retry-After": "3", "Cache-Control": "no-store" } },
      );
    }

    const inspection = await inspectSignedStorageObject(
      signedFile.signedUrl,
      mimeType,
      sizeBytes,
      MAX_BYTES,
    );

    if (inspection.reason === "unavailable") {
      return NextResponse.json(
        { error: "Файлды тексеру уақытша қолжетімсіз. Қайта көріңіз." },
        { status: 503, headers: { "Retry-After": "3", "Cache-Control": "no-store" } },
      );
    }

    if (!inspection.ok || inspection.sizeBytes !== sizeBytes) {
      await admin.storage.from("submissions").remove([storagePath]);
      return NextResponse.json(
        { error: "Файлдың көлемі немесе нақты форматы сәйкес емес." },
        { status: 400 },
      );
    }

    const { data: record, error: recordError } = await supabase
      .from("submission_files")
      .insert({
        submission_id: submissionId,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: mimeType,
        size_bytes: inspection.sizeBytes,
      })
      .select("*")
      .single();

    if (recordError) {
      await admin.storage.from("submissions").remove([storagePath]);
      console.error("[task-file-upload] file metadata save failed", {
        code: recordError.code,
        message: recordError.message,
      });
      return NextResponse.json({ error: "Файл дерегін сақтау мүмкін болмады. Қайта көріңіз." }, { status: 503 });
    }

    return NextResponse.json(
      { file: record },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("[task-file-upload] unexpected failure", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Файл жүктеу кезінде қате болды. Қайта көріңіз." }, { status: 500 });
  }
}
