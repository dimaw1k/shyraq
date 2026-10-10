import { getTrustedAppUrl } from "@/lib/app-url";

export type GoogleOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

/**
 * Validate every server-side OAuth secret and require the callback to be
 * same-origin with the configured canonical app URL. This makes missing or
 * mismatched credentials fail before sending a mentor to Google's consent UI.
 */
export function getGoogleOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  const encryptionKey = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY?.trim();

  if (!clientId || !clientSecret || !redirectUri || !encryptionKey) return null;

  const decodedEncryptionKey = Buffer.from(encryptionKey, "base64");
  if (
    decodedEncryptionKey.length !== 32 ||
    decodedEncryptionKey.toString("base64") !== encryptionKey
  ) {
    return null;
  }

  try {
    const appUrl = getTrustedAppUrl();
    const callbackUrl = new URL(redirectUri);

    if (
      callbackUrl.origin !== appUrl.origin ||
      callbackUrl.pathname !== "/api/integrations/google/callback" ||
      callbackUrl.username ||
      callbackUrl.password ||
      callbackUrl.search ||
      callbackUrl.hash ||
      (process.env.NODE_ENV === "production" && callbackUrl.protocol !== "https:")
    ) {
      return null;
    }
  } catch {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}
