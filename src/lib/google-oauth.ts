import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { decryptGoogleToken, encryptGoogleToken } from "@/lib/google-token";

type TokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
  refresh_token?: unknown;
};

const TOKEN_TIMEOUT_MS = 8_000;

export async function getGoogleAccessToken(userId: string): Promise<string> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error("Google account is not connected");
  }

  const admin = createAdminSupabaseClient();
  const { data: connection, error } = await admin
    .from("google_connections")
    .select("refresh_token_encrypted")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !connection?.refresh_token_encrypted) {
    throw new Error("Google account is not connected");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured");

  let refreshToken: string;
  try {
    refreshToken = decryptGoogleToken(connection.refresh_token_encrypted);
  } catch {
    throw new Error("Stored Google credentials are unavailable");
  }

  let token: TokenResponse;
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    });

    if (!response.ok) throw new Error("Token refresh rejected");
    token = await response.json() as TokenResponse;
  } catch {
    // Avoid exposing provider response bodies or credentials in route errors.
    throw new Error("Google access token refresh failed");
  }

  if (
    typeof token.access_token !== "string" ||
    token.access_token.length < 20 ||
    token.access_token.length > 8192 ||
    typeof token.expires_in !== "number" ||
    !Number.isFinite(token.expires_in) ||
    token.expires_in <= 0
  ) {
    throw new Error("Google returned an invalid access token");
  }

  if (typeof token.refresh_token === "string" && token.refresh_token.length >= 20) {
    let encryptedRefreshToken: string;
    try {
      encryptedRefreshToken = encryptGoogleToken(token.refresh_token);
    } catch {
      throw new Error("Google credential encryption is not configured");
    }

    const { error: rotateError } = await admin
      .from("google_connections")
      .update({
        refresh_token_encrypted: encryptedRefreshToken,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (rotateError) {
      console.error("[google-oauth] rotated refresh token could not be saved", {
        code: rotateError.code,
      });
      throw new Error("Google credentials could not be updated");
    }
  }

  return token.access_token;
}
