import { NextResponse } from "next/server";
import { getSupabaseConfig } from "@/lib/supabase/config";

export async function GET() {
  let supabaseReachable = false;

  try {
    const { url, publishableKey } = getSupabaseConfig();
    const response = await fetch(
      url + "/auth/v1/health",
      {
        headers: { apikey: publishableKey },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      },
    );
    supabaseReachable = response.ok;
  } catch {
    supabaseReachable = false;
  }

  const ok = supabaseReachable;

  return NextResponse.json(
    { ok },
    {
      status: ok ? 200 : 503,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
