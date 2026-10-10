import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { encryptGoogleToken } from "@/lib/google-token";
import { getTrustedAppUrl, sanitizeLocalReturnTo } from "@/lib/app-url";
import { getGoogleOAuthConfig } from "@/lib/google-oauth-config";

const allowedRoles = new Set(["CHIEF_MENTOR"]);
const OAUTH_TIMEOUT_MS = 8_000;

type TokenResponse = {
  access_token?: unknown;
  refresh_token?: unknown;
  expires_in?: unknown;
  token_type?: unknown;
};

type UserInfo = {
  sub?: unknown;
  email?: unknown;
  email_verified?: unknown;
};

function safeStatusUrl(status: string, returnTo: string, appUrl: URL) {
  const target = new URL(sanitizeLocalReturnTo(returnTo, "/chief-mentor/meet"), appUrl);
  target.searchParams.set("google", status);
  return target;
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.set("shyraq_google_oauth_state", "", {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 0, path: "/",
  });
  response.cookies.set("shyraq_google_return_to", "", {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 0, path: "/",
  });
  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

function redirectResult(status: string, returnTo: string, appUrl: URL) {
  return clearOAuthCookies(NextResponse.redirect(safeStatusUrl(status, returnTo, appUrl), 303));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const appUrl = getTrustedAppUrl();
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("shyraq_google_oauth_state")?.value;
  const returnTo = cookieStore.get("shyraq_google_return_to")?.value ?? "/chief-mentor/meet";
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (!state || !expectedState || state.length > 256 || !cryptoSafeEqual(state, expectedState)) {
    return redirectResult("invalid_state", returnTo, appUrl);
  }

  if (oauthError) return redirectResult("cancelled", returnTo, appUrl);

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirectResult("login_required", returnTo, appUrl);

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile?.role || !allowedRoles.has(profile.role) || profile.status !== "ACTIVE") {
    return redirectResult("forbidden", returnTo, appUrl);
  }

  const code = url.searchParams.get("code");
  const oauth = getGoogleOAuthConfig();
  if (!code || code.length > 2048 || !oauth) {
    return redirectResult("not_configured", returnTo, appUrl);
  }

  let token: TokenResponse;
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: oauth.clientId,
        client_secret: oauth.clientSecret,
        redirect_uri: oauth.redirectUri,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(OAUTH_TIMEOUT_MS),
    });

    if (!tokenResponse.ok) {
      return redirectResult("token_exchange_failed", returnTo, appUrl);
    }

    token = await tokenResponse.json() as TokenResponse;
  } catch {
    return redirectResult("token_exchange_failed", returnTo, appUrl);
  }

  if (
    typeof token.access_token !== "string" ||
    token.access_token.length < 20 ||
    token.access_token.length > 8192 ||
    typeof token.refresh_token !== "string" ||
    token.refresh_token.length < 20 ||
    token.refresh_token.length > 8192
  ) {
    // Never persist a connection unless Google's response contains a usable,
    // rotating refresh credential. Error details are intentionally not exposed.
    return redirectResult("no_refresh_token", returnTo, appUrl);
  }

  let userInfo: UserInfo;
  try {
    const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: "Bearer " + token.access_token },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(OAUTH_TIMEOUT_MS),
    });
    if (!userInfoResponse.ok) {
      return redirectResult("identity_verification_failed", returnTo, appUrl);
    }
    userInfo = await userInfoResponse.json() as UserInfo;
  } catch {
    return redirectResult("identity_verification_failed", returnTo, appUrl);
  }

  if (
    typeof userInfo.sub !== "string" ||
    !/^[A-Za-z0-9_-]{1,255}$/.test(userInfo.sub) ||
    typeof userInfo.email !== "string" ||
    userInfo.email.length > 320 ||
    !/^\S+@\S+\.\S+$/.test(userInfo.email) ||
    userInfo.email_verified !== true
  ) {
    return redirectResult("identity_verification_failed", returnTo, appUrl);
  }

  let encryptedRefreshToken: string;
  try {
    encryptedRefreshToken = encryptGoogleToken(token.refresh_token);
  } catch {
    return redirectResult("not_configured", returnTo, appUrl);
  }

  const admin = createAdminSupabaseClient();
  const { error: saveError } = await admin.from("google_connections").upsert({
    user_id: user.id,
    google_subject: userInfo.sub,
    google_email: userInfo.email.trim().toLowerCase(),
    refresh_token_encrypted: encryptedRefreshToken,
    updated_at: new Date().toISOString(),
  });

  if (saveError) {
    console.error("[auth/google-callback] could not save connection", { code: saveError.code });
    return redirectResult("save_failed", returnTo, appUrl);
  }

  return redirectResult("connected", returnTo, appUrl);
}

function cryptoSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
