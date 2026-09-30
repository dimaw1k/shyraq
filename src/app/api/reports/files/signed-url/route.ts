import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const fileId = typeof body?.fileId === "string" ? body.fileId : "";
  if (!fileId) return NextResponse.json({ error: "fileId is required" }, { status: 400 });

  const { data: file } = await supabase.from("report_files")
    .select("id,report_id,storage_path").eq("id", fileId).maybeSingle();
  if (!file || file.storage_path.includes("..") || file.storage_path.includes("\\")) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage.from("submissions").createSignedUrl(file.storage_path, 600);
  if (error) return NextResponse.json({ error: "Unable to create signed URL" }, { status: 400 });

  return NextResponse.json({ url: data.signedUrl, expiresIn: 600 });
}
