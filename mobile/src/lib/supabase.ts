import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { nativeAuthStorage } from "@/lib/native-auth-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

if (!supabaseUrl) {
  throw new Error("EXPO_PUBLIC_SUPABASE_URL is missing. Copy mobile/.env.example to mobile/.env.");
}
if (!supabasePublishableKey) {
  throw new Error("EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing. Copy the Shyraq publishable key into mobile/.env.");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: nativeAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});
