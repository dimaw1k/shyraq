import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function isSafeBucketPath(path: string) {
  return path.length > 0 && !path.includes("\\") && !path.split("/").includes("..");
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const bucket = typeof body?.bucket === "string" ? body.bucket : "";
  const fileId = typeof body?.fileId === "string" ? body.fileId : "";
  if (bucket !== "submissions" || !fileId) {
    return NextResponse.json({ error: "Only submission file IDs are supported" }, { status: 400 });
  }

  const { data: file } = await supabase.from("submission_files")
    .select("id,submission_id,storage_path")
    .eq("id", fileId)
    .maybeSingle();

  if (!file || !isSafeBucketPath(file.storage_path)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // A visible metadata row is not sufficient authorization for service-role
  // signing: legacy or malicious metadata may point at another object's path.
  // Validate the object path against the actual parent submission using the
  // caller-scoped client before asking Storage to mint a privileged URL.
  const { data: submission } = await supabase
    .from("task_submissions")
    .select("id,student_id")
    .eq("id", file.submission_id)
    .maybeSingle();

  if (!submission) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const expectedPrefix = submission.student_id + "/" + submission.id + "/";
  if (!file.storage_path.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(file.storage_path, 600);
  if (error) return NextResponse.json({ error: "Unable to create signed URL" }, { status: 400 });

  return NextResponse.json({ url: data.signedUrl, expiresIn: 600 });
}
