import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function safeNext(value: string | null, origin: string) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return new URL("/dashboard", origin);
  }

  return new URL(value, origin);
}

function isResetPasswordTarget(next: URL) {
  return next.pathname === "/reset-password";
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams, origin } = requestUrl;
  const code = searchParams.get("code");
  const flowId = searchParams.get("sb_flow_id");
  const next = safeNext(searchParams.get("next"), origin);

  if (!code) {
    if (isResetPasswordTarget(next)) {
      return NextResponse.redirect(
        new URL("/reset-password?error=invalid_or_expired", origin),
      );
    }

    return NextResponse.redirect(new URL("/login?oauth=missing_code", origin));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );

  if (error) {
    console.error("[auth/callback] code exchange failed", {
      code: error.code,
      status: error.status,
    });

    if (isResetPasswordTarget(next)) {
      return NextResponse.redirect(
        new URL("/reset-password?error=invalid_or_expired", origin),
      );
    }

    return NextResponse.redirect(new URL("/login?oauth=failed", origin));
  }

  return NextResponse.redirect(next);
}
