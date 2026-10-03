import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const scope = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/meetings.space.readonly",
].join(" ");

const allowedRoles = new Set(["MENTOR", "CHIEF_MENTOR", "LEADER"]);

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.role || !allowedRoles.has(profile.role)) {
    return NextResponse.redirect(new URL("/dashboard?google=forbidden", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL("/dashboard?google=not_configured", request.url));
  }

  const requestedReturnTo = new URL(request.url).searchParams.get("returnTo") ?? "/dashboard";
  const returnTo =
    requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : "/dashboard";

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
