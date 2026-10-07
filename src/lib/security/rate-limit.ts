import { createHash } from "node:crypto";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  hits: number;
};

function getRateLimitSecret() {
  return (
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    "shyraq-local-rate-limit-salt"
  );
}

export function getClientIp(request: Request) {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;

  return "unknown";
}

function hashBucketKey(scope: string, value: string) {
  return createHash("sha256")
    .update(getRateLimitSecret())
    .update("\0")
    .update(scope)
    .update("\0")
    .update(value.trim().toLocaleLowerCase("en-US"))
    .digest("hex");
}

export async function consumeRateLimit(
  scope: string,
  value: string,
  limit: number,
  windowSeconds: number,
  blockSeconds = windowSeconds,
): Promise<RateLimitResult> {
  const bucketKey = hashBucketKey(scope, value);
  const admin = createAdminSupabaseClient();

  try {
    const { data, error } = await admin.rpc("consume_security_rate_limit", {
      p_bucket_key: bucketKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
      p_block_seconds: blockSeconds,
    });

    if (error) {
      console.error("[security/rate-limit] consume failed", {
        scope,
        code: error.code,
        message: error.message,
      });
      return { allowed: true, retryAfterSeconds: 0, hits: 0 };
    }

    const row = Array.isArray(data) ? data[0] : data;

    return {
      allowed: row?.allowed !== false,
      retryAfterSeconds: Number(row?.retry_after_seconds ?? 0),
      hits: Number(row?.hits ?? 0),
    };
  } catch (error) {
    console.error("[security/rate-limit] unexpected failure", {
      scope,
      message: error instanceof Error ? error.message : "unknown",
    });
    return { allowed: true, retryAfterSeconds: 0, hits: 0 };
  }
}

export function rateLimitResponse(
  retryAfterSeconds: number,
  message = "Тым көп әрекет жасалды. Біраз уақыттан кейін қайта көріңіз.",
) {
  return new Response(
    JSON.stringify({
      error: message,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": String(Math.max(1, retryAfterSeconds)),
      },
    },
  );
}
