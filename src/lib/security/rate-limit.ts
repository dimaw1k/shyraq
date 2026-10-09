import { createHash } from "node:crypto";
import { isIP } from "node:net";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type RateLimitResult = {
  allowed: boolean;
  available: boolean;
  retryAfterSeconds: number;
  hits: number;
};

function getRateLimitSecret() {
  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || secret.trim().length < 16) {
    throw new Error("Supabase server secret key is missing or invalid");
  }

  return secret.trim();
}

/**
 * Vercel overwrites X-Forwarded-For at its edge to prevent client IP spoofing.
 * Do not prioritize arbitrary CF-Connecting-IP or other client-controlled headers
 * unless the deployment is explicitly behind a trusted Cloudflare proxy.
 */
export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded && isIP(forwarded) ? forwarded : "unknown";
}

function hashBucketKey(scope: string, value: string) {
  if (value.length > 512) {
    throw new Error("Rate limit key input is too long");
  }

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
  try {
    const bucketKey = hashBucketKey(scope, value);
    const admin = createAdminSupabaseClient();
    const { data, error } = await admin.rpc("consume_security_rate_limit", {
      p_bucket_key: bucketKey,
      p_limit: limit,
      p_window_seconds: windowSeconds,
      p_block_seconds: blockSeconds,
    });

    if (error) {
      throw new Error(`Rate-limit RPC failed (${error.code || "unknown"})`);
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== "boolean") {
      throw new Error("Rate-limit RPC returned an invalid response");
    }

    return {
      allowed: row.allowed,
      available: true,
      retryAfterSeconds: Number(row.retry_after_seconds ?? 0),
      hits: Number(row.hits ?? 0),
    };
  } catch (error) {
    // Fail closed. Authentication endpoints must never continue when the shared
    // rate-limit store is unavailable or its server-only credentials are missing.
    console.error("[security/rate-limit] request denied because limiter is unavailable", {
      scope,
      message: error instanceof Error ? error.message : "unknown",
    });
    return {
      allowed: false,
      available: false,
      retryAfterSeconds: 60,
      hits: limit + 1,
    };
  }
}

export function rateLimitUnavailableResponse() {
  return new Response(
    JSON.stringify({
      error: "Қауіпсіздік тексерісін уақытша орындау мүмкін емес. Кейінірек қайта көріңіз.",
    }),
    {
      status: 503,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "Retry-After": "60",
      },
    },
  );
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
