import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const RECOVERY_GRANT_TTL_SECONDS = 10 * 60;

type RecoveryGrantPayload = {
  version: 1;
  userId: string;
  jti: string;
  exp: number;
};

function getSigningSecret() {
  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!secret || secret.trim().length < 32) {
    throw new Error("Recovery grant signing secret is missing or invalid");
  }

  return secret.trim();
}

function sign(value: string) {
  return createHmac("sha256", getSigningSecret())
    .update(value)
    .digest("base64url");
}

/**
 * Validate the access token issued by Supabase after an email recovery code
 * was exchanged. The caller must first ask Supabase Auth to validate the
 * session/user; JWT decoding alone is not a signature check.
 */
export function isRecentRecoveryAccessToken(
  accessToken: string,
  expectedUserId: string,
) {
  try {
    const parts = accessToken.split(".");
    if (parts.length !== 3 || !parts[1]) return false;

    const claims = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as {
      aud?: unknown;
      sub?: unknown;
      iat?: unknown;
      exp?: unknown;
      amr?: unknown;
    };

    if (!claims || typeof claims !== "object" || Array.isArray(claims)) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    const methods = Array.isArray(claims.amr)
      ? claims.amr.map((entry) => {
          if (typeof entry === "string") return entry;
          if (typeof entry === "object" && entry !== null && "method" in entry) {
            return (entry as { method?: unknown }).method;
          }
          return null;
        })
      : [];

    const audienceIsAuthenticated =
      claims.aud === "authenticated" ||
      (Array.isArray(claims.aud) && claims.aud.includes("authenticated"));

    return (
      audienceIsAuthenticated &&
      claims.sub === expectedUserId &&
      typeof claims.iat === "number" &&
      Number.isInteger(claims.iat) &&
      claims.iat <= now + 60 &&
      claims.iat >= now - 15 * 60 &&
      typeof claims.exp === "number" &&
      claims.exp > now &&
      (methods.includes("recovery") || methods.includes("otp"))
    );
  } catch {
    return false;
  }
}

export function createRecoveryGrant(userId: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("Invalid recovery user identifier");
  }

  const exp = Math.floor(Date.now() / 1000) + RECOVERY_GRANT_TTL_SECONDS;
  const payload: RecoveryGrantPayload = {
    version: 1,
    userId,
    jti: randomBytes(32).toString("base64url"),
    exp,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  return {
    token: encodedPayload + "." + sign(encodedPayload),
    jti: payload.jti,
    expiresInSeconds: RECOVERY_GRANT_TTL_SECONDS,
  };
}

export function verifyRecoveryGrant(
  token: string | undefined | null,
): RecoveryGrantPayload | null {
  if (!token || token.length > 2048) return null;

  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;

  let expectedSignature: Buffer;
  let suppliedSignature: Buffer;
  let payload: RecoveryGrantPayload;

  try {
    expectedSignature = Buffer.from(sign(parts[0]), "base64url");
    suppliedSignature = Buffer.from(parts[1], "base64url");

    if (
      expectedSignature.length !== suppliedSignature.length ||
      !timingSafeEqual(expectedSignature, suppliedSignature)
    ) {
      return null;
    }

    payload = JSON.parse(
      Buffer.from(parts[0], "base64url").toString("utf8"),
    ) as RecoveryGrantPayload;
  } catch {
    return null;
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  if (
    payload.version !== 1 ||
    typeof payload.userId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(payload.userId) ||
    typeof payload.jti !== "string" ||
    !/^[A-Za-z0-9_-]{40,50}$/.test(payload.jti) ||
    !Number.isInteger(payload.exp) ||
    payload.exp <= now ||
    payload.exp > now + RECOVERY_GRANT_TTL_SECONDS
  ) {
    return null;
  }

  return payload;
}
