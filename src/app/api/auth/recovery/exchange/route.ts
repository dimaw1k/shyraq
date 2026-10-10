import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import {
  consumeRateLimit,
  getClientIp,
  rateLimitResponse,
  rateLimitUnavailableResponse,
} from "@/lib/security/rate-limit";
import { createRecoveryGrant } from "@/lib/security/recovery-grant";

const RECOVERY_COOKIE = "shyraq_recovery_grant";

function response(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}

export async function POST(request: Request) {
  try {
    const parsedBody = await readLimitedJson(request, 12_288);
    if (!parsedBody.ok) {
      return response(
        { error: "Қалпына келтіру сілтемесі жарамсыз немесе мерзімі өткен." },
        parsedBody.reason === "too-large" ? 413 : 400,
      );
    }

    if (
      !parsedBody.value ||
      typeof parsedBody.value !== "object" ||
      Array.isArray(parsedBody.value)
    ) {
      return response(
        { error: "Қалпына келтіру сілтемесі жарамсыз немесе мерзімі өткен." },
        400,
      );
    }

    const body = parsedBody.value as Record<string, unknown>;
    const accessToken =
      typeof body.accessToken === "string" ? body.accessToken.trim() : "";
    const recoveryType = body.type === "recovery";

    if (
      !recoveryType ||
      accessToken.length < 100 ||
      accessToken.length > 8192 ||
      !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(accessToken)
    ) {
      return response(
        { error: "Қалпына келтіру сілтемесі жарамсыз немесе мерзімі өткен." },
        401,
      );
    }

    const ipLimit = await consumeRateLimit(
      "auth:reset-exchange:ip",
      getClientIp(request),
      10,
      60 * 60,
      60 * 60,
    );
    if (!ipLimit.available) return rateLimitUnavailableResponse();
    if (!ipLimit.allowed) {
      return rateLimitResponse(
        ipLimit.retryAfterSeconds,
        "Қалпына келтіру әрекеттері тым жиі орындалды. Кейінірек қайталап көріңіз.",
      );
    }

    const { url, publishableKey } = getSupabaseConfig();
    const supabase = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user?.id || !data.user.email) {
      return response(
        { error: "Қалпына келтіру сілтемесі жарамсыз немесе мерзімі өткен." },
        401,
      );
    }

    // Revoke the temporary Supabase recovery session before issuing a narrowly
    // scoped, short-lived grant that cannot be used as an app login session.
    const logoutUrl = new URL("/auth/v1/logout", url);
    logoutUrl.searchParams.set("scope", "local");
    const logoutResponse = await fetch(logoutUrl, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        Authorization: "Bearer " + accessToken,
      },
      cache: "no-store",
    });

    if (!logoutResponse.ok) {
      console.error("[auth/recovery-exchange] temporary session revocation failed", {
        status: logoutResponse.status,
      });
      return response(
        { error: "Қалпына келтіруді қауіпсіз аяқтау мүмкін болмады. Жаңа сілтеме сұраңыз." },
        503,
      );
    }

    const grant = createRecoveryGrant(data.user.id);
    const result = response({ ok: true });

    result.cookies.set(RECOVERY_COOKIE, grant.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: grant.expiresInSeconds,
    });

    return result;
  } catch (error) {
    console.error("[auth/recovery-exchange] recovery exchange failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return response(
      { error: "Қалпына келтіруді қауіпсіз аяқтау мүмкін болмады. Жаңа сілтеме сұраңыз." },
      503,
    );
  }
}
