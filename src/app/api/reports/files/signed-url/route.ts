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
  const rateLimit = await consumeRateLimit("reports:file-signed-url", user.id, 60, 10 * 60, 10 * 60);
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
  const fileId = typeof body.fileId === "string" ? body.fileId : "";
  if (!fileId || fileId.length > 100) return NextResponse.json({ error: "fileId дұрыс емес" }, { status: 400 });

  const { data: file } = await supabase.from("report_files")
    .select("id,report_id,slot,storage_path")
    .eq("id", fileId)
    .maybeSingle();

  if (!file || !isSafeBucketPath(file.storage_path)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  // Do not let a metadata row authorize a service-role URL for an unrelated
  // object. Revalidate the parent report under the caller's RLS scope.
  const { data: report } = await supabase
    .from("daily_reports")
    .select("id,student_id")
    .eq("id", file.report_id)
    .maybeSingle();

  if (!report) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const expectedPrefix =
    report.student_id + "/reports/" + report.id + "/" + String(file.slot) + "/";
  if (!file.storage_path.startsWith(expectedPrefix)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const admin = createAdminSupabaseClient();
  const { data, error } = await admin.storage.from("submissions").createSignedUrl(file.storage_path, 600);
  if (error) return NextResponse.json({ error: "Unable to create signed URL" }, { status: 400 });

  return NextResponse.json({ url: data.signedUrl, expiresIn: 600 });
}
