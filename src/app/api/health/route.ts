import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "shyraq",
    environment: env.appUrl ? "configured" : "missing-config",
    timestamp: new Date().toISOString(),
  });
}
