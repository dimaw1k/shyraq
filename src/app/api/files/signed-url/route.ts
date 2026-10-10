import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

function isSafeBucketPath(path: string) {
  return path.length > 0 && !path.includes("\\") && !path.split("/").includes("..");
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rateLimit = await consumeRateLimit("student:submission-file-signed-url", user.id, 60, 600, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Файл сілтемесін алу сұраныстары тым жиі орындалды.");
  }

  const parsedBody = await readLimitedJson(request, 8 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Деректер дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Деректер дұрыс емес." }, { status: 400 });
  }
  const body = parsedBody.value as Record<string, unknown>;
  const bucket = typeof body.bucket === "string" ? body.bucket : "";
  const fileId = typeof body.fileId === "string" ? body.fileId : "";
  if (bucket !== "submissions" || !fileId || fileId.length > 100) {
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
