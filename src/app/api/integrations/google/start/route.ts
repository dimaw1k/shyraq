import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getTrustedAppUrl, sanitizeLocalReturnTo } from "@/lib/app-url";
import { consumeRateLimit, rateLimitResponse, rateLimitUnavailableResponse } from "@/lib/security/rate-limit";

const scope = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/meetings.space.created",
].join(" ");

const allowedRoles = new Set(["CHIEF_MENTOR"]);

export async function GET(request: Request) {
  const appUrl = getTrustedAppUrl();
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", appUrl));

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role || !allowedRoles.has(profile.role) || profile.status !== "ACTIVE") {
    return NextResponse.redirect(new URL("/dashboard?google=forbidden", appUrl));
  }
  const rateLimit = await consumeRateLimit("chief-mentor:google-oauth-start", user.id, 10, 900, 300);
  if (!rateLimit.available) return rateLimitUnavailableResponse();
  if (!rateLimit.allowed) {
    return rateLimitResponse(rateLimit.retryAfterSeconds, "Google аккаунтын қосу әрекеттері тым жиі орындалды.");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL("/dashboard?google=not_configured", appUrl));
  }

  const requestedReturnTo = new URL(request.url).searchParams.get("returnTo") ?? "/chief-mentor/meet";
  const returnTo = sanitizeLocalReturnTo(requestedReturnTo, "/chief-mentor/meet");

  const state = crypto.randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(
    "https://accounts.google.com/o/oauth2/v2/auth?" +
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        access_type: "offline",
        prompt: "consent",
        scope,
        state,
        include_granted_scopes: "true",
      }),
  );

  response.cookies.set("shyraq_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  response.cookies.set("shyraq_google_return_to", returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return response;
}
