import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

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

  const form = await request.formData();
  const submissionId = String(form.get("submissionId") ?? "");
  const file = form.get("file");
  if (!submissionId || !(file instanceof File)) return NextResponse.json({ error: "submissionId and file are required" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "Файл 4 MB-тан аспауы керек." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Бұл файл түріне рұқсат жоқ." }, { status: 400 });

  const { data: submission } = await supabase.from("task_submissions").select("id,task_id,student_id,status").eq("id", submissionId).eq("task_id", taskId).eq("student_id", user.id).maybeSingle();
  if (!submission) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  if (submission.status !== "DRAFT") return NextResponse.json({ error: "Файл тек draft кезінде қосылады." }, { status: 409 });

  const { data: task } = await supabase.from("tasks").select("max_files").eq("id", taskId).maybeSingle();
  const { count } = await supabase.from("submission_files").select("id", { count: "exact", head: true }).eq("submission_id", submissionId);
  if ((count ?? 0) >= Number(task?.max_files ?? 5)) return NextResponse.json({ error: "Файл лимиті толды." }, { status: 409 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = user.id + "/" + submissionId + "/" + crypto.randomUUID() + "-" + safeName;
  const admin = createAdminSupabaseClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await admin.storage.from("submissions").upload(storagePath, buffer, { contentType: file.type, upsert: false });
  if (uploadError) return NextResponse.json({ error: "File upload failed" }, { status: 400 });

  const { data: record, error: recordError } = await supabase.from("submission_files").insert({
    submission_id: submissionId,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  }).select("*").single();

  if (recordError) {
    await admin.storage.from("submissions").remove([storagePath]);
    return NextResponse.json({ error: "File metadata save failed" }, { status: 400 });
  }

  return NextResponse.json({ file: record });
}
