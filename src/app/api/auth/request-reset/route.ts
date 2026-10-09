import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getTrustedAppUrl } from "@/lib/app-url";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
  rateLimitUnavailableResponse,
} from "@/lib/security/rate-limit";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);
    const clientIp = getClientIp(request);

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Электрондық пошта мекенжайын дұрыс енгізіңіз." },
        { status: 400 },
      );
    }

    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit("auth:reset-request:ip", clientIp, 5, 60 * 60, 60 * 60),
      consumeRateLimit("auth:reset-request:email", email, 3, 60 * 60, 60 * 60),
    ]);

    const limitResults = [ipLimit, emailLimit];
    if (limitResults.some((result) => !result.available)) {
      return rateLimitUnavailableResponse();
    }

    const blocked = limitResults.find((result) => !result.allowed);
    if (blocked) {
      return rateLimitResponse(
        blocked.retryAfterSeconds,
        "Қалпына келтіру сұраулары тым жиі жіберілді. Біраз уақыттан кейін қайта көріңіз.",
      );
    }

    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const redirectTo = new URL("/auth/recovery", getTrustedAppUrl()).toString();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("[auth/reset-request] Supabase reset request failed", {
        status: error.status,
        message: error.message,
      });
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
      { error: "Қалпына келтіру сілтемесін жіберу кезінде қате болды." },
      { status: 503 },
    );
  }
}
