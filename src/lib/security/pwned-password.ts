import "server-only";

import { createHash } from "node:crypto";

export type PwnedPasswordCheck =
  | { status: "safe" }
  | { status: "pwned" }
  | { status: "unavailable" };

const CHECK_TIMEOUT_MS = 4_000;
const PWNED_PASSWORDS_RANGE_ENDPOINT = "https://api.pwnedpasswords.com/range/";

 /**
  * Check a password against HIBP Pwned Passwords using its k-anonymity range
  * API. Only the first five hex chars of the SHA-1 hash leave this server.
  * Neither the password nor its full hash is sent to HIBP.
  *
  * "unavailable" must be handled fail-closed by routes that create/change a
  * password, because this is our free-plan fallback for Supabase's paid
  * leaked-password protection setting.
  */
export async function checkPwnedPassword(
  password: string,
): Promise<PwnedPasswordCheck> {
  if (password.length === 0 || password.length > 128) {
    return { status: "safe" };
  }

  const hash = createHash("sha1").update(password, "utf8").digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHECK_TIMEOUT_MS);

  try {
    const response = await fetch(PWNED_PASSWORDS_RANGE_ENDPOINT + prefix, {
      method: "GET",
      headers: {
        "Add-Padding": "true",
        "User-Agent": "Shyraq-Password-Security/1.0",
      },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });

    if (!response.ok) {
      return { status: "unavailable" };
    }

    const body = await response.text();
    if (!body || body.length > 1_500_000) {
      return { status: "unavailable" };
    }

    for (const line of body.split(/\r?\n/)) {
      const separator = line.indexOf(":");
      if (separator <= 0) continue;

      const returnedSuffix = line.slice(0, separator).trim().toUpperCase();
      if (returnedSuffix !== suffix) continue;

      const count = Number(line.slice(separator + 1).trim());
      if (!Number.isSafeInteger(count) || count < 0) {
        return { status: "unavailable" };
      }

      if (count > 0) {
        return { status: "pwned" };
      }
    }

    return { status: "safe" };
  } catch {
    return { status: "unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}
