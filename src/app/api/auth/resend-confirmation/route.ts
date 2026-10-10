import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTrustedAppUrl } from "@/lib/app-url";
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
 * Resend Supabase's sign-up confirmation email.
 * The response intentionally does not reveal whether an address has an account.
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
      consumeRateLimit("auth:resend-confirmation:ip", getClientIp(request), 5, 60 * 60, 60 * 60),
      consumeRateLimit("auth:resend-confirmation:email", email, 3, 60 * 60, 60 * 60),
    ]);

    const results = [ipLimit, emailLimit];
    if (results.some((result) => !result.available)) {
      return rateLimitUnavailableResponse();
    }

    const blocked = results.find((result) => !result.allowed);
    if (blocked) {
      return rateLimitResponse(
        blocked.retryAfterSeconds,
        "Сұраулар тым жиі жіберілді. Біраз уақыттан кейін қайта көріңіз.",
      );
    }

    const confirmationUrl = new URL("/auth/callback", getTrustedAppUrl());
    confirmationUrl.searchParams.set("next", "/login?verified=1");

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: confirmationUrl.toString() },
    });

    if (error) {
      // Do not expose account existence or internal email-provider details.
      console.warn("[auth/resend-confirmation] Supabase resend was not completed", {
        status: error.status ?? null,
        code: error.code ?? null,
      });
    }

    // Keep the same public response for unknown, already-confirmed, and pending
    // accounts to prevent account enumeration.
    return response({ ok: true });
  } catch (error) {
    console.error("[auth/resend-confirmation] request failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return response(
      { error: "Сұрауды қазір орындау мүмкін емес. Кейінірек қайта көріңіз." },
      503,
    );
  }
}
