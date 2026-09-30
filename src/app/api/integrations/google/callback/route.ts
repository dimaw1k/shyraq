import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { encryptGoogleToken } from "@/lib/google-token";

type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
};

type UserInfo = {
  sub?: string;
  email?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const stateCookie = (await import("next/headers")).cookies;
  const cookieStore = await stateCookie();
  const expectedState = cookieStore.get("shyraq_google_oauth_state")?.value;
  const state = url.searchParams.get("state");

  if (!state || !expectedState || !cryptoSafeEqual(state, expectedState)) {
    return NextResponse.redirect(new URL("/dashboard?google=invalid_state", request.url));
  }

  const error = url.searchParams.get("error");
  if (error) return NextResponse.redirect(new URL("/dashboard?google=cancelled", request.url));

  const code = url.searchParams.get("code");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!code || !clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(new URL("/dashboard?google=not_configured", request.url));
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL("/dashboard?google=token_exchange_failed", request.url));
  }

  const token = (await tokenResponse.json()) as TokenResponse;
  if (!token.refresh_token) {
    return NextResponse.redirect(new URL("/dashboard?google=no_refresh_token", request.url));
  }

  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: "Bearer " + token.access_token },
  });

  const userInfo = userInfoResponse.ok ? ((await userInfoResponse.json()) as UserInfo) : {};
  const admin = createAdminSupabaseClient();

  const { error: saveError } = await admin.from("google_connections").upsert({
    user_id: user.id,
    google_subject: userInfo.sub ?? null,
    google_email: userInfo.email ?? null,
    refresh_token_encrypted: encryptGoogleToken(token.refresh_token),
    updated_at: new Date().toISOString(),
  });

  if (saveError) {
    return NextResponse.redirect(new URL("/dashboard?google=save_failed", request.url));
  }

  return NextResponse.redirect(new URL("/dashboard?google=connected", request.url));
}

function cryptoSafeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && require("node:crypto").timingSafeEqual(left, right);
}
