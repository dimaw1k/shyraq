import { NextResponse } from "next/server";
import { hasValidFileSignature } from "@/lib/security/file-validation";
import { readLimitedFormData } from "@/lib/http/read-limited-json";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg","image/png","image/webp","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export async function POST(request: Request, context: { params: Promise<{ taskId: string }> }) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role,status").eq("id", user.id).maybeSingle();
  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Student access required" }, { status: 403 });
  }
  const rateLimit = await consumeRateLimit("student:file-upload", user.id, 20, 10 * 60, 10 * 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Файлдар тым жиі жүктелді. Біраздан кейін қайта көріңіз.");
  }


  const { taskId } = await context.params;
  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\d+$/.test(contentLength) ||
      Number(contentLength) > MAX_BYTES + 128 * 1024)
  ) {
    return NextResponse.json(
      { error: "Файл өлшемі 4 MB шегінен асады." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const boundedForm = await readLimitedFormData(request, MAX_BYTES + 128 * 1024);
  if (!boundedForm.ok) {
    return NextResponse.json(
      { error: boundedForm.reason === "too-large" ? "Файл өлшемі 4 MB шегінен асады." : "Файл форматы дұрыс емес." },
      { status: boundedForm.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const form = boundedForm.value;
  const submissionId = String(form.get("submissionId") ?? "");
  const file = form.get("file");
  if (!submissionId || !(file instanceof File)) return NextResponse.json({ error: "submissionId and file are required" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Файл 4 MB-тан аспауы керек." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Бұл файл түріне рұқсат жоқ." }, { status: 400 });
  if (!(await hasValidFileSignature(file, file.type))) return NextResponse.json({ error: "Файл мазмұны мәлімделген форматқа сәйкес емес." }, { status: 400 });

  const { data: submission } = await supabase.from("task_submissions").select("id,task_id,student_id,status").eq("id", submissionId).eq("task_id", taskId).eq("student_id", user.id).maybeSingle();
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (submission.status !== "DRAFT") return NextResponse.json({ error: "Файл тек draft кезінде қосылады." }, { status: 409 });

  const { data: task, error: taskError } = await supabase
    .from("tasks")
    .select("id,max_files,active,starts_at,team_id")
    .eq("id", taskId)
    .maybeSingle();
  if (taskError) return NextResponse.json({ error: "Тапсырманы тексеру сәтсіз аяқталды." }, { status: 500 });
  if (!task?.active) return NextResponse.json({ error: "Белсенді тапсырма табылмады." }, { status: 404 });
  if (task.starts_at && Date.parse(task.starts_at) > Date.now()) {
    return NextResponse.json({ error: "Тапсырма әлі ашылған жоқ." }, { status: 409 });
  }
  if (task.team_id) {
    const { data: membership, error: membershipError } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("student_id", user.id)
      .eq("team_id", task.team_id)
      .eq("status", "ACTIVE")
      .maybeSingle();
    if (membershipError) return NextResponse.json({ error: "Команданы тексеру сәтсіз аяқталды." }, { status: 500 });
    if (!membership) return NextResponse.json({ error: "Бұл тапсырма сіздің командаңызға арналмаған." }, { status: 403 });
  }

  const { count, error: fileCountError } = await supabase
    .from("submission_files")
    .select("id", { count: "exact", head: true })
    .eq("submission_id", submissionId);
  if (fileCountError) return NextResponse.json({ error: "Файл санын тексеру сәтсіз аяқталды." }, { status: 500 });
  if ((count ?? 0) >= Number(task.max_files ?? 5)) return NextResponse.json({ error: "Файл лимиті толды." }, { status: 409 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
  const storagePath = user.id + "/" + submissionId + "/" + crypto.randomUUID() + "-" + safeName;
  const displayName = file.name.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 255) || "file";
  const admin = createAdminSupabaseClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from("submissions").upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "File upload failed" }, { status: 400 });

  const { data: savedFile, error: recordError } = await admin.rpc("attach_task_submission_file", {
    p_task_id: taskId,
    p_submission_id: submissionId,
    p_student_id: user.id,
    p_storage_path: storagePath,
    p_file_name: displayName,
    p_mime_type: file.type,
    p_size_bytes: file.size,
  });

  if (recordError) {
    await admin.storage.from("submissions").remove([storagePath]);
    if (recordError.code === "42501") {
      return NextResponse.json({ error: "Бұл файл сіздің тапсырмаңызға рұқсат етілмеген." }, { status: 403 });
    }
    if (recordError.code === "P0002") {
      return NextResponse.json({ error: "Тапсырма немесе файл жіберілімі табылмады." }, { status: 404 });
    }
    if (recordError.code === "23514" || recordError.code === "55000") {
      return NextResponse.json({ error: "Файл тек ашық тапсырмаға, лимиттен аспай және жіберілмеген күйде қосылады." }, { status: 409 });
    }
    if (recordError.code === "22023") {
      return NextResponse.json({ error: "Файл деректері дұрыс емес." }, { status: 400 });
    }
    console.error("[task-submission-files] metadata insert failed", { code: recordError.code });
    return NextResponse.json({ error: "Файл деректерін сақтау сәтсіз аяқталды." }, { status: 500 });
  }

  const record = Array.isArray(savedFile) ? savedFile[0] : savedFile;
  if (!record) {
    await admin.storage.from("submissions").remove([storagePath]);
    return NextResponse.json({ error: "Файл деректерін растау мүмкін болмады." }, { status: 500 });
  }

  return NextResponse.json({ file: record }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
