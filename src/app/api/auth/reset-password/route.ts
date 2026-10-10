import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { getPasswordValidationError } from "@/lib/security/password";
import { readLimitedJson } from "@/lib/http/read-limited-json";
import {
  consumeRateLimit,
  rateLimitResponse,
  rateLimitUnavailableResponse,
} from "@/lib/security/rate-limit";
import { verifyRecoveryGrant } from "@/lib/security/recovery-grant";

const RECOVERY_COOKIE = "shyraq_recovery_grant";

function response(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", Pragma: "no-cache" },
  });
}

function clearRecoveryCookie(result: NextResponse) {
  result.cookies.set(RECOVERY_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return result;
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const grant = verifyRecoveryGrant(cookieStore.get(RECOVERY_COOKIE)?.value);

    if (!grant) {
      return clearRecoveryCookie(
        response(
          { error: "Қалпына келтіру сілтемесі жарамсыз немесе мерзімі өткен. Жаңа сілтеме сұраңыз." },
          401,
        ),
      );
    }

    const parsedBody = await readLimitedJson(request, 16_384);
    if (!parsedBody.ok) {
      return response(
        { error: parsedBody.reason === "too-large" ? "Сұраныс тым үлкен." : "Қалпына келтіру деректері дұрыс емес." },
        parsedBody.reason === "too-large" ? 413 : 400,
      );
    }
    if (
      !parsedBody.value ||
      typeof parsedBody.value !== "object" ||
      Array.isArray(parsedBody.value)
    ) {
      return response({ error: "Қалпына келтіру деректері дұрыс емес." }, 400);
    }

    const body = parsedBody.value as Record<string, unknown>;
    const password = typeof body.password === "string" ? body.password : "";

    const admin = createAdminSupabaseClient();
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(
      grant.userId,
    );

    if (userError || !userData.user?.id || !userData.user.email) {
      console.error("[auth/reset-password] recovery account lookup failed", {
        status: userError?.status ?? null,
      });
      return clearRecoveryCookie(
        response({ error: "Қалпына келтіру сессиясы жарамсыз. Жаңа сілтеме сұраңыз." }, 401),
      );
    }

    const passwordError = getPasswordValidationError(password, [
      userData.user.email,
    ]);
    if (passwordError) {
      return response({ error: passwordError }, 400);
    }

    // Keep an account-level limit as well as a one-use limit bound to this grant.
    const userLimit = await consumeRateLimit(
      "auth:reset-password",
      grant.userId,
      5,
      15 * 60,
      15 * 60,
    );
    if (!userLimit.available) return rateLimitUnavailableResponse();
    if (!userLimit.allowed) {
      return rateLimitResponse(
        userLimit.retryAfterSeconds,
        "Құпиясөзді жаңарту әрекеттері тым жиі орындалды. Кейінірек қайталап көріңіз.",
      );
    }

    const grantLimit = await consumeRateLimit(
      "auth:reset-grant",
      grant.jti,
      1,
      10 * 60,
      10 * 60,
    );
    if (!grantLimit.available) return rateLimitUnavailableResponse();
    if (!grantLimit.allowed) {
      return clearRecoveryCookie(
        response(
          { error: "Бұл қалпына келтіру сілтемесі қолданылған. Жаңа сілтеме сұраңыз." },
          401,
        ),
      );
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(
      grant.userId,
      { password },
    );

    if (updateError) {
      console.error("[auth/reset-password] password update failed", {
        status: updateError.status,
        code: updateError.code ?? null,
      });
      return clearRecoveryCookie(
        response(
          { error: "Құпиясөзді жаңарту мүмкін болмады. Жаңа қалпына келтіру сілтемесін сұраңыз." },
          400,
        ),
      );
    }

    return clearRecoveryCookie(response({ ok: true }));
  } catch (error) {
    console.error("[auth/reset-password] password update failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return response(
      { error: "Құпиясөзді жаңарту кезінде қате болды. Қайта көріңіз." },
      500,
    );
  }
}
