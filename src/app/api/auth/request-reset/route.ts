import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getTrustedAppUrl } from "@/lib/app-url";
import { readLimitedJson } from "@/lib/http/read-limited-json";
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
    const parsedBody = await readLimitedJson(request, 16384);
    if (!parsedBody.ok) {
      return NextResponse.json(
        { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Сұраныс деректері дұрыс емес." },
        { status: parsedBody.reason === "too-large" ? 413 : 400, headers: { "Cache-Control": "no-store" } },
      );
    }
    if (!parsedBody.value || typeof parsedBody.value !== "object" || Array.isArray(parsedBody.value)) {
      return NextResponse.json({ error: "Сұраныс деректері дұрыс емес." }, { status: 400 });
    }
    const body = parsedBody.value;
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
