import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const scope = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/meetings.space.readonly",
].join(" ");

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role !== "MENTOR" && profile?.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard?google=forbidden", request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !redirectUri) {
    return NextResponse.redirect(new URL("/dashboard?google=not_configured", request.url));
  }

  const state = crypto.randomBytes(24).toString("base64url");
  const response = NextResponse.redirect("https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope,
    state,
  }));

  response.cookies.set("shyraq_google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
    path: "/",
  });

  return response;
}
