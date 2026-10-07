import crypto from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const response = await updateSession(request);

  const nonce = crypto.randomUUID();
  const isProduction = process.env.NODE_ENV === "production";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self' https://accounts.google.com",
    "script-src 'self' 'nonce-" + nonce + "' 'strict-dynamic' https://*.kinescope.io https://kinescope.io",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://sqjjqnisnndulkzcqfwb.supabase.co https://*.kinescope.io https://kinescope.io",
    "font-src 'self' data:",
    "media-src 'self' blob: data: https://*.kinescope.io https://kinescope.io",
    "connect-src 'self' https://sqjjqnisnndulkzcqfwb.supabase.co https://*.supabase.co https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://*.kinescope.io wss://*.supabase.co",
    "frame-src 'self' https://*.kinescope.io https://kinescope.io",
    isProduction ? "upgrade-insecure-requests" : "",
  ]
    .filter(Boolean)
    .join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-nonce", nonce);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
