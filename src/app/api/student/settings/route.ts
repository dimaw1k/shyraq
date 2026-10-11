import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import {
  consumeRateLimit,
  rateLimitResponse,
  rateLimitUnavailableResponse,
} from "@/lib/security/rate-limit";

function isLanguage(value: unknown): value is "kk" | "ru" | "en" {
  return value === "kk" || value === "ru" || value === "en";
}

async function getActiveStudent() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      userId: null,
    };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return {
      error: NextResponse.json({ error: "Аккаунтты тексеру мүмкін болмады." }, { status: 500 }),
      userId: null,
    };
  }
  if (profile?.role !== "STUDENT" || profile.status !== "ACTIVE") {
    return {
      error: NextResponse.json({ error: "Active student access required" }, { status: 403 }),
      userId: null,
    };
  }

  return { error: null, userId: user.id };
}

async function saveLanguage(userId: string, language: "kk" | "ru" | "en") {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("student_settings")
    .upsert(
      { user_id: userId, language, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    )
    .select("language")
    .single();

  if (error) {
    console.error("[student/settings] language save failed", { code: error.code });
    return NextResponse.json({ error: "Тілді сақтау мүмкін болмады." }, {
      status: 500,
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    });
  }

  return NextResponse.json(
    { settings: { language: isLanguage(data.language) ? data.language : language } },
    { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } },
  );
}

export async function GET() {
  const context = await getActiveStudent();
  if (context.error || !context.userId) return context.error!;

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("student_settings")
    .select("language")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (error) {
    console.error("[student/settings] GET failed", { code: error.code });
    return NextResponse.json({ error: "Баптауларды жүктеу мүмкін болмады." }, {
      status: 500,
      headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
    });
  }

  return NextResponse.json({
    settings: { language: isLanguage(data?.language) ? data.language : "kk" },
  }, { headers: { "Cache-Control": "no-store", Pragma: "no-cache" } });
}

async function updateLanguage(request: Request) {
  const context = await getActiveStudent();
  if (context.error || !context.userId) return context.error!;

  const rateLimit = await consumeRateLimit("account:settings-write", context.userId, 60, 10 * 60, 60);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Баптаулар тым жиі өзгертілді. Кейінірек қайта көріңіз.");
  }

  const parsedBody = await readLimitedJson(request, 16 * 1024);
  if (!parsedBody.ok) {
    return NextResponse.json(
      { error: parsedBody.reason === "too-large" ? "Баптау деректері тым үлкен." : "Баптау деректері дұрыс емес." },
      { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
    return NextResponse.json({ error: "Баптау деректері дұрыс емес." }, { status: 400 });
  }

  const body = parsedBody.value as Record<string, unknown>;
  if (!isLanguage(body.language)) {
    return NextResponse.json({ error: "Тіл таңдауы дұрыс емес." }, { status: 400 });
  }

  // Only language preferences are supported. Reminder and notification options
  // were removed from the application and cannot be saved through this API.
  return saveLanguage(context.userId, body.language);
}

export async function PUT(request: Request) {
  return updateLanguage(request);
}

export async function PATCH(request: Request) {
  return updateLanguage(request);
}
