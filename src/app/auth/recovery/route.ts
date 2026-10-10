import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { getTrustedAppUrl } from "@/lib/app-url";
import {
  createRecoveryGrant,
  isRecentRecoveryAccessToken,
} from "@/lib/security/recovery-grant";

const RECOVERY_COOKIE = "shyraq_recovery_grant";

type CookieOptions = {
  domain?: string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  sameSite?: boolean | "lax" | "strict" | "none";
  secure?: boolean;
  priority?: "low" | "medium" | "high";
  partitioned?: boolean;
};

type CookieMutation = {
  name: string;
  value: string;
  options?: CookieOptions;
};

function redirectWithCookies(
  target: URL,
  writes: Map<string, CookieMutation>,
  recoveryGrant?: { token: string; expiresInSeconds: number },
) {
  const response = NextResponse.redirect(target, 303);

  for (const cookie of writes.values()) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  if (recoveryGrant) {
    response.cookies.set(RECOVERY_COOKIE, recoveryGrant.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: recoveryGrant.expiresInSeconds,
    });
  }

  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const appUrl = getTrustedAppUrl();
  const invalidUrl = new URL("/reset-password?error=invalid_or_expired", appUrl);
  const updateUrl = new URL("/reset-password?mode=update", appUrl);
  const code = request.nextUrl.searchParams.get("code");

  if (!code || code.length > 2048) {
    return redirectWithCookies(invalidUrl, new Map());
  }

  const { url, publishableKey } = getSupabaseConfig();
  const writes = new Map<string, CookieMutation>();

  const supabase = createServerClient(url, publishableKey, {
    cookieOptions: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(items) {
        for (const { name, value, options } of items) {
          request.cookies.set(name, value);
          writes.set(name, { name, value, options });
        }
      },
    },
  });

  try {
    // PKCE codes are short-lived and single-use. Their verifier was saved by
    // the browser when resetPasswordForEmail() was called.
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.session?.access_token || !data.session.user?.id) {
      // A rejected/expired PKCE code does not authorize us to sign out a
      // pre-existing, unrelated session in this browser.
      return redirectWithCookies(invalidUrl, writes);
    }

    // Ask Supabase Auth to validate the resulting session, then require a
    // recent OTP/recovery authentication method before issuing a reset grant.
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (
      userError ||
      !userData.user?.id ||
      userData.user.id !== data.session.user.id ||
      !isRecentRecoveryAccessToken(data.session.access_token, userData.user.id)
    ) {
      await supabase.auth.signOut({ scope: "local" });
      return redirectWithCookies(invalidUrl, writes);
    }

    const userId = userData.user.id;

    // The normal Supabase session is temporary. Clear it before issuing the
    // narrow recovery-only grant so it cannot be used to navigate the app.
    const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
    if (signOutError) {
      console.error("[auth/recovery] could not clear temporary recovery session", {
        status: signOutError.status,
      });
      return redirectWithCookies(invalidUrl, writes);
    }

    const grant = createRecoveryGrant(userId);
    return redirectWithCookies(updateUrl, writes, grant);
  } catch (error) {
    console.error("[auth/recovery] PKCE recovery exchange failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    // No grant is issued on errors. Do not clear an existing unrelated session
    // if the code exchange did not complete successfully.
    return redirectWithCookies(invalidUrl, writes);
  }
}
