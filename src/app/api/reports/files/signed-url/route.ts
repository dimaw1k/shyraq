import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { consumeRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = await consumeRateLimit("report-file:signed-url", user.id, 60, 10 * 60, 10 * 60);
    if (!limited.allowed) {
      return rateLimitResponse(limited.retryAfterSeconds, "Файл ашу әрекеттері тым жиі орындалды. Қайта көріңіз.");
    }

    const body = await request.json().catch(() => null);
    const fileId = typeof body?.fileId === "string" ? body.fileId : "";
    if (!/^[0-9a-f-]{36}$/i.test(fileId)) {
      return NextResponse.json({ error: "Файл табылмады." }, { status: 404 });
    }

    // RLS determines whether the current user owns the report or is assigned
    // staff. Never mint a service-role signed URL before this read succeeds.
    const { data: file, error: fileError } = await supabase
      .from("report_files")
      .select("id,storage_path")
      .eq("id", fileId)
      .maybeSingle();

    if (fileError || !file || file.storage_path.includes("..") || file.storage_path.includes("\\")) {
      return NextResponse.json({ error: "Файл табылмады." }, { status: 404 });
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.storage
      .from("submissions")
      .createSignedUrl(file.storage_path, 120, { download: true });

    if (error || !data?.signedUrl) {
      return NextResponse.json({ error: "Уақытша сілтеме жасау мүмкін болмады." }, { status: 503 });
    }

    return NextResponse.json(
      { url: data.signedUrl, expiresIn: 120 },
      { headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } },
    );
  } catch (error) {
    console.error("[report-file-signed-url] failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Файлды ашу кезінде қате болды." }, { status: 500 });
  }
}
