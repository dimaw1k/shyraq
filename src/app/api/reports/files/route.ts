import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { hasValidFileSignature } from "@/lib/security/file-validation";
import { consumeRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_SLOTS = new Set(["MORNING_MEET", "PLAN", "SCREEN_TIME", "PROCESS"]);

type UploadBody = {
  action?: unknown;
  reportId?: unknown;
  slot?: unknown;
  fileName?: unknown;
  mimeType?: unknown;
  sizeBytes?: unknown;
  storagePath?: unknown;
};

function validMetadata(body: UploadBody) {
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

function validStoragePath(path: string, userId: string, reportId: string, slot: string) {
  const prefix = userId + "/reports/" + reportId + "/" + slot + "/";
  if (!path.startsWith(prefix) || path.includes("..") || path.includes("\\")) {
    return false;
  }

  const tail = path.slice(prefix.length);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[A-Za-z0-9._-]{1,100}$/i.test(tail);
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as UploadBody | null;
    const action = body?.action;
    const reportId = typeof body?.reportId === "string" ? body.reportId : "";
    const slot = typeof body?.slot === "string" ? body.slot : "";

    if (
      !body ||
      (action !== "prepare" && action !== "complete") ||
      !reportId ||
      !ALLOWED_SLOTS.has(slot) ||
      !validMetadata(body)
    ) {
      return NextResponse.json({ error: "Есеп, фото бөлігі және файл деректері қажет." }, { status: 400 });
    }

    const limited = await consumeRateLimit(
      "report-file:" + action,
      user.id,
      30,
      10 * 60,
      10 * 60,
    );
    if (!limited.allowed) {
      return rateLimitResponse(
        limited.retryAfterSeconds,
        "Фото жүктеу әрекеттері тым жиі орындалды. Қайта көріңіз.",
      );
    }

    const { data: report, error: reportError } = await supabase
      .from("daily_reports")
      .select("id,student_id,status")
      .eq("id", reportId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (reportError) {
      return NextResponse.json({ error: "Есепті тексеру мүмкін болмады." }, { status: 503 });
    }
    if (!report) {
      return NextResponse.json({ error: "Есеп табылмады." }, { status: 404 });
    }
    if (report.status === "REVIEWED") {
      return NextResponse.json({ error: "Тексерілген есепке файл қосуға болмайды." }, { status: 409 });
    }

    const fileName = body.fileName.trim();
    const mimeType = body.mimeType as string;
    const sizeBytes = body.sizeBytes as number;
    const storagePath = typeof body.storagePath === "string" ? body.storagePath : "";
    const admin = createAdminSupabaseClient();

    if (action === "prepare") {
      const path =
        user.id +
        "/reports/" +
        reportId +
        "/" +
        slot +
        "/" +
        crypto.randomUUID() +
        "-" +
        safeFileName(fileName);

      const { data, error } = await admin.storage
        .from("submissions")
        .createSignedUploadUrl(path);

      if (error || !data?.token || !data.path) {
        console.error("[report-file-upload] signed URL creation failed", {
          code: error?.name,
          message: error?.message,
        });
        return NextResponse.json({ error: "Фото жүктеу сілтемесін жасау мүмкін болмады." }, { status: 503 });
      }

      return NextResponse.json(
        { storagePath: data.path, token: data.token },
        { headers: { "Cache-Control": "no-store" } },
      );
    }

    if (!validStoragePath(storagePath, user.id, reportId, slot)) {
      return NextResponse.json({ error: "Файл жолы дұрыс емес." }, { status: 400 });
    }

    const { data: alreadySaved, error: alreadySavedError } = await supabase
      .from("report_files")
      .select("*")
      .eq("report_id", reportId)
      .eq("slot", slot)
      .eq("storage_path", storagePath)
      .maybeSingle();

    if (alreadySavedError) {
      return NextResponse.json({ error: "Файл деректерін тексеру мүмкін болмады." }, { status: 503 });
    }
    if (alreadySaved) {
      return NextResponse.json({ file: alreadySaved }, { headers: { "Cache-Control": "no-store" } });
    }

    const { data: storedFile, error: downloadError } = await admin.storage
      .from("submissions")
      .download(storagePath);

    if (downloadError || !storedFile) {
      return NextResponse.json({ error: "Жүктелген фото табылмады. Қайта көріңіз." }, { status: 503 });
    }

    if (
      storedFile.size !== sizeBytes ||
      storedFile.size <= 0 ||
      storedFile.size > MAX_BYTES ||
      !(await hasValidFileSignature(storedFile, mimeType))
    ) {
      await admin.storage.from("submissions").remove([storagePath]);
      return NextResponse.json({ error: "Файлдың көлемі немесе нақты форматы сәйкес емес." }, { status: 400 });
    }

    const { data: existingFiles, error: existingFilesError } = await supabase
      .from("report_files")
      .select("id,storage_path")
      .eq("report_id", reportId)
      .eq("slot", slot);

    if (existingFilesError) {
      return NextResponse.json({ error: "Бұрынғы фотоны тексеру мүмкін болмады." }, { status: 503 });
    }

    const { data: record, error: recordError } = await supabase
      .from("report_files")
      .insert({
        report_id: reportId,
        slot,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: mimeType,
        size_bytes: storedFile.size,
      })
      .select("*")
      .single();

    if (recordError) {
      await admin.storage.from("submissions").remove([storagePath]);
      console.error("[report-file-upload] metadata save failed", {
        code: recordError.code,
        message: recordError.message,
      });
      return NextResponse.json({ error: "Фото дерегін сақтау мүмкін болмады. Қайта көріңіз." }, { status: 503 });
    }

    if (existingFiles?.length) {
      const oldIds = existingFiles.map((item) => item.id);
      const oldPaths = existingFiles.map((item) => item.storage_path);
      const { error: deleteError } = await supabase.from("report_files").delete().in("id", oldIds);
      if (!deleteError) {
        const { error: cleanupError } = await admin.storage.from("submissions").remove(oldPaths);
        if (cleanupError) {
          console.error("[report-file-upload] old file cleanup failed", {
            message: cleanupError.message,
          });
        }
      } else {
        console.error("[report-file-upload] old metadata cleanup failed", {
          code: deleteError.code,
          message: deleteError.message,
        });
      }
    }

    return NextResponse.json({ file: record }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[report-file-upload] unexpected failure", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Фото жүктеу кезінде қате болды." }, { status: 500 });
  }
}
