import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getPasswordValidationError } from "@/lib/security/password";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7).trim()
      : "";

    if (!token) {
      return NextResponse.json(
        { error: "Қалпына келтіру сессиясы жарамсыз немесе мерзімі өткен." },
        { status: 401 },
      );
    }

    const parsedBody = await readLimitedJson(request, 16384);
    if (!parsedBody.ok) {
      return NextResponse.json(
        { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Қалпына келтіру деректері дұрыс емес." },
        { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
      return NextResponse.json({ error: "Қалпына келтіру деректері дұрыс емес." }, { status: 400 });
    }
    const body = parsedBody.value as Record<string, unknown>;
    const password =
      typeof body?.password === "string" ? body.password : "";

    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createClient(url, publishableKey, {
      global: {
        headers: {
          Authorization: "Bearer " + token,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "Қалпына келтіру сессиясы жарамсыз немесе мерзімі өткен." },
        { status: 401 },
      );
    }

    // A valid recovery token is a credential. Limit repeated password changes
    // tied to that account, including invalid-password attempts.
    const resetLimit = await consumeRateLimit(
      "auth:reset-password",
      userData.user.id,
      5,
      15 * 60,
      15 * 60,
    );
    if (!resetLimit.available) return rateLimitUnavailableResponse();
    if (!resetLimit.allowed) {
      return rateLimitResponse(
        resetLimit.retryAfterSeconds,
        "Құпиясөзді жаңарту әрекеттері тым жиі орындалды. Кейінірек қайталап көріңіз.",
      );
    }

    const passwordError = getPasswordValidationError(password, [
      userData.user.email ?? "",
    ]);

    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      console.error("[auth/reset-password] password update failed", {
        status: updateError.status,
        message: updateError.message,
      });

      return NextResponse.json(
        { error: "Құпиясөзді жаңарту мүмкін болмады." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { ok: true },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Құпиясөзді жаңарту кезінде қате болды." },
      { status: 500 },
    );
  }
}
