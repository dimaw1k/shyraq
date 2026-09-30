import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg","image/png","image/webp","application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const reportId = String(form.get("reportId") ?? "");
  const file = form.get("file");
  if (!reportId || !(file instanceof File)) return NextResponse.json({ error: "reportId and file are required" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ error: "File is too large" }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "File type is not supported" }, { status: 400 });

  const { data: report } = await supabase.from("daily_reports").select("id,student_id").eq("id", reportId).eq("student_id", user.id).maybeSingle();
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = user.id + "/reports/" + reportId + "/" + crypto.randomUUID() + "-" + safeName;
  const admin = createAdminSupabaseClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage.from("submissions").upload(storagePath, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) return NextResponse.json({ error: "File upload failed" }, { status: 400 });

  const { data: record, error: recordError } = await supabase.from("report_files").insert({
    report_id: reportId,
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
