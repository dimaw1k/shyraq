import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "./server";
import { getSupabaseConfig } from "./config";

const MAX_BEARER_TOKEN_LENGTH = 8192;

export type ApiSupabaseContext = {
  supabase: SupabaseClient;
  user: User;
  mode: "cookie" | "bearer";
};

/**
 * Resolve a verified user and an RLS-scoped Supabase client for an API request.
 *
 * Web requests keep the existing @supabase/ssr cookie session.
 * Native clients may provide "Authorization: Bearer <Supabase access token>".
 * A malformed Authorization header fails closed rather than falling back to
 * a possibly different cookie identity.
 */
export async function getApiSupabaseContext(
  request: Request,
): Promise<ApiSupabaseContext | null> {
  const authorization = request.headers.get("authorization");

  if (authorization !== null) {
    const match = /^Bearer\s+(\S+)$/i.exec(authorization);
    const token = match?.[1];

    if (!token || token.length > MAX_BEARER_TOKEN_LENGTH) {
      return null;
    }

    const { url, publishableKey } = getSupabaseConfig();
    const authClient = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });

    // Use Auth's user endpoint to validate the supplied token against Supabase.
    // Never trust a decoded JWT or a client-provided user/profile object.
    const {
      data: { user },
      error,
    } = await authClient.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    // A separate client binds every subsequent PostgREST/Storage request to
    // this verified user's JWT so database RLS evaluates the real user.
    // When accessToken is configured, supabase-js intentionally disables its
    // auth namespace, which is why token verification above uses authClient.
    const supabase = createClient(url, publishableKey, {
      accessToken: async () => token,
    });

    return { supabase, user, mode: "bearer" };
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { supabase, user, mode: "cookie" };
}
