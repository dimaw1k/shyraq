import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const ALLOWED_SLOTS = new Set([
  "MORNING_MEET",
  "PLAN",
  "SCREEN_TIME",
  "PROCESS",
]);

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = request.headers.get("content-length");
  if (
    contentLength !== null &&
    (!/^\\d+$/.test(contentLength) ||
      Number(contentLength) > MAX_BYTES + 128 * 1024)
  ) {
    return NextResponse.json(
      { error: "Файл өлшемі 4 MB шегінен асады." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  const form = await request.formData();
  const reportId = String(form.get("reportId") ?? "");
  const slot = String(form.get("slot") ?? "");
  const file = form.get("file");

  if (!reportId || !ALLOWED_SLOTS.has(slot) || !(file instanceof File)) {
    return NextResponse.json(
      { error: "Есеп, фото бөлігі және файл қажет." },
      { status: 400 },
    );
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Файл 4 MB-тан үлкен болмауы керек." },
      { status: 400 },
    );
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Бұл файл түріне рұқсат жоқ." },
      { status: 400 },
    );
  }

  const { data: report } = await supabase
    .from("daily_reports")
    .select("id,student_id,status")
    .eq("id", reportId)
    .eq("student_id", user.id)
    .maybeSingle();

  if (!report) {
    return NextResponse.json({ error: "Есеп табылмады." }, { status: 404 });
  }

  if (report.status === "REVIEWED") {
    return NextResponse.json(
      { error: "Тексерілген есепке файл қосуға болмайды." },
      { status: 409 },
    );
  }

  const { data: existingFiles } = await supabase
    .from("report_files")
    .select("id,storage_path")
    .eq("report_id", reportId)
    .eq("slot", slot);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath =
    user.id +
    "/reports/" +
    reportId +
    "/" +
    slot +
    "/" +
    crypto.randomUUID() +
    "-" +
    safeName;

  const admin = createAdminSupabaseClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await admin.storage
    .from("submissions")
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json(
      { error: "Фото жүктелмеді." },
      { status: 400 },
    );
  }

  const { data: record, error: recordError } = await supabase
    .from("report_files")
    .insert({
      report_id: reportId,
      slot,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    })
    .select("*")
    .single();

  if (recordError) {
    await admin.storage.from("submissions").remove([storagePath]);
    return NextResponse.json(
      { error: "Фото туралы дерек сақталмады." },
      { status: 400 },
    );
  }

  if (existingFiles?.length) {
    const oldIds = existingFiles.map((item) => item.id);
    const oldPaths = existingFiles.map((item) => item.storage_path);
    await supabase.from("report_files").delete().in("id", oldIds);
    await admin.storage.from("submissions").remove(oldPaths);
  }

  return NextResponse.json({ file: record });
}
