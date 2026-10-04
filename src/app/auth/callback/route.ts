import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeNext(value: string | null, origin: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return new URL("/dashboard", origin);
  return new URL(value, origin);
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), origin);

  if (!code) {
    return NextResponse.redirect(new URL("/login?oauth=missing_code", origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?oauth=failed", origin));
  }

  return NextResponse.redirect(next);
}
