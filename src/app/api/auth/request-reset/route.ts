import { NextResponse } from "next/server";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
  rateLimitUnavailableResponse,
} from "@/lib/security/rate-limit";

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

/**
 * This endpoint enforces the app-side recovery-request quota. The browser
 * initiates Supabase PKCE recovery itself so the code verifier is stored in
 * the same browser and can be exchanged securely in /auth/recovery.
 */
export async function POST(request: Request) {
  try {
    const parsedBody = await readLimitedJson(request, 12_288);
    if (!parsedBody.ok) {
      return response(
        { error: "Сұраныс деректері дұрыс емес." },
        parsedBody.reason === "too-large" ? 413 : 400,
      );
    }

    if (
      !parsedBody.value ||
      typeof parsedBody.value !== "object" ||
      Array.isArray(parsedBody.value)
    ) {
      return response({ error: "Сұраныс деректері дұрыс емес." }, 400);
    }

    const body = parsedBody.value as Record<string, unknown>;
    const email = normalizeEmail(body.email);

    if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 180) {
      return response({ error: "Электрондық пошта мекенжайын дұрыс енгізіңіз." }, 400);
    }

    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit("auth:reset-request:ip", getClientIp(request), 5, 60 * 60, 60 * 60),
      consumeRateLimit("auth:reset-request:email", email, 3, 60 * 60, 60 * 60),
    ]);

    const results = [ipLimit, emailLimit];
    if (results.some((result) => !result.available)) {
      return rateLimitUnavailableResponse();
    }

    const blocked = results.find((result) => !result.allowed);
    if (blocked) {
      return rateLimitResponse(
        blocked.retryAfterSeconds,
        "Қалпына келтіру сұраулары тым жиі жіберілді. Біраз уақыттан кейін қайта көріңіз.",
      );
    }

    // Do not reveal whether the email is registered. This is only a preflight
    // quota check; Supabase Auth enforces its own rate limits on email sending.
    return response({ ok: true });
  } catch (error) {
    console.error("[auth/reset-request] request validation failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return response(
      { error: "Қалпына келтіру сұрауын қазір орындау мүмкін емес. Кейінірек қайталаңыз." },
      503,
    );
  }
}
