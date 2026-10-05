import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(
      new URL("/reset-password?error=invalid_or_expired", origin),
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  );

  if (error) {
    console.error("[auth/recovery] code exchange failed", {
      code: error.code,
      status: error.status,
    });

    return NextResponse.redirect(
      new URL("/reset-password?error=invalid_or_expired", origin),
    );
  }

  return NextResponse.redirect(new URL("/reset-password", origin));
}
