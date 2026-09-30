import { NextResponse } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Production health contract: deployment must prove real Supabase connectivity.

export async function GET() {
  const publicEnvConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  const adminEnvConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
  let supabaseReachable = false;

  try {
    const response = await fetch(
      SUPABASE_URL + "/rest/v1/marathon_settings?select=id&limit=1",
      {
        headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
        cache: "no-store",
      },
    );
    supabaseReachable = response.ok;
  } catch {
    supabaseReachable = false;
  }

  const ok = supabaseReachable && publicEnvConfigured && adminEnvConfigured;

  return NextResponse.json(
    {
      ok,
      service: "shyraq",
      environment: {
        appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
        publicEnvConfigured,
        adminEnvConfigured,
      },
      supabase: {
        url: SUPABASE_URL,
        reachable: supabaseReachable,
      },
      timestamp: new Date().toISOString(),
    },
    { status: ok ? 200 : 503 },
  );
}
