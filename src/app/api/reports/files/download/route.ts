import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { consumeRateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

function safeDownloadName(value: string) {
  const name = value
    .replace(/[\r\n"\\/]/g, "_")
    .replace(/[^\p{L}\p{N}._ -]/gu, "_")
    .trim()
    .slice(0, 160);
  return name || "report-file";
}

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = await consumeRateLimit("report-file:download", user.id, 60, 10 * 60, 10 * 60);
    if (!limited.allowed) {
      return rateLimitResponse(limited.retryAfterSeconds, "Файл ашу әрекеттері тым жиі орындалды. Қайта көріңіз.");
    }

    const fileId = new URL(request.url).searchParams.get("fileId") ?? "";
    if (!/^[0-9a-f-]{36}$/i.test(fileId)) {
      return NextResponse.json({ error: "Файл табылмады." }, { status: 404 });
    }

    // This query deliberately uses the user's RLS-scoped client. A valid
    // session alone is not enough: the owner or assigned staff must be allowed
    // to see the report_files row before any privileged signed URL is minted.
    const { data: file, error: fileError } = await supabase
      .from("report_files")
      .select("id,storage_path,file_name")
      .eq("id", fileId)
      .maybeSingle();

    if (fileError || !file || file.storage_path.includes("..") || file.storage_path.includes("\\")) {
      return NextResponse.json({ error: "Файл табылмады." }, { status: 404 });
    }

    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.storage
      .from("submissions")
      .createSignedUrl(file.storage_path, 120, { download: safeDownloadName(file.file_name) });

    if (error || !data?.signedUrl) {
      console.error("[report-file-download] signed URL creation failed", {
        message: error?.message,
      });
      return NextResponse.json({ error: "Файлға уақытша сілтеме жасау мүмкін болмады." }, { status: 503 });
    }

    return NextResponse.redirect(data.signedUrl, {
      status: 302,
      headers: {
        "Cache-Control": "private, no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  } catch (error) {
    console.error("[report-file-download] unexpected failure", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Файлды ашу кезінде қате болды." }, { status: 500 });
  }
}
