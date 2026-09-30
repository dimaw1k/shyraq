import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { decryptGoogleToken, encryptGoogleToken } from "@/lib/google-token";

type TokenResponse = { access_token: string; expires_in: number; refresh_token?: string };

export async function getGoogleAccessToken(userId: string): Promise<string> {
  const admin = createAdminSupabaseClient();
  const { data: connection, error } = await admin
    .from("google_connections")
    .select("refresh_token_encrypted")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !connection) throw new Error("Google account is not connected");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Google OAuth is not configured");

  const refreshToken = decryptGoogleToken(connection.refresh_token_encrypted);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) throw new Error("Google access token refresh failed");

  const token = (await response.json()) as TokenResponse;

  if (token.refresh_token) {
    await admin.from("google_connections").update({
      refresh_token_encrypted: encryptGoogleToken(token.refresh_token),
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }

  return token.access_token;
}
