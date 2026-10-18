import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const SECRET_FIELDS = [
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
] as const;

type SecretField = (typeof SECRET_FIELDS)[number];
type JsonRecord = Record<string, unknown>;

// Temporary, non-persistent browser storage is only for viewing the native UI
// in a desktop browser. Real iOS/Android sessions remain in SecureStore.
const webPreviewStorage = new Map<string, string>();

function isJsonRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function secureKey(storageKey: string, field: SecretField) {
  return `${storageKey}::${field}`;
}

/**
 * Keep Supabase bearer/refresh tokens in iOS Keychain / Android encrypted
 * storage while storing non-token session metadata in AsyncStorage.
 *
 * Legacy session JSON is migrated by persisting tokens securely before the
 * plaintext copy is removed. SecureStore errors fail closed: tokens are never
 * silently written to AsyncStorage as a fallback.
 */
export const nativeAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === "web") {
      return webPreviewStorage.get(key) ?? null;
    }

    const stored = await AsyncStorage.getItem(key);
    if (stored === null) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      // Supabase also stores opaque PKCE verifier values using this adapter.
      return stored;
    }

    if (!isJsonRecord(parsed)) return stored;

    const hydrated: JsonRecord = { ...parsed };
    const metadata: JsonRecord = { ...parsed };
    let migrated = false;

    for (const field of SECRET_FIELDS) {
      const current = metadata[field];
      if (typeof current === "string" && current.length > 0) {
        // Keep the token in this in-memory response for the current auth read.
        // Remove it from the copy persisted back to AsyncStorage.
        await SecureStore.setItemAsync(secureKey(key, field), current);
        hydrated[field] = current;
        delete metadata[field];
        migrated = true;
      } else {
        const secret = await SecureStore.getItemAsync(secureKey(key, field));
        if (secret !== null) hydrated[field] = secret;
        else delete hydrated[field];
      }
    }

    if (migrated) {
      await AsyncStorage.setItem(key, JSON.stringify(metadata));
    }

    return JSON.stringify(hydrated);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      webPreviewStorage.set(key, value);
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      await AsyncStorage.setItem(key, value);
      return;
    }

    if (!isJsonRecord(parsed)) {
      await AsyncStorage.setItem(key, value);
      return;
    }

    const metadata: JsonRecord = { ...parsed };
    const containsSessionToken = SECRET_FIELDS.some(
      (field) => typeof metadata[field] === "string" && (metadata[field] as string).length > 0,
    );

    if (!containsSessionToken) {
      // Clear stale secure token fields if Supabase is replacing the session
      // with an empty auth-session object. Keep non-session values such as a
      // PKCE verifier intact.
      if (key.endsWith("-auth-token")) {
        await Promise.all(
          SECRET_FIELDS.map((field) => SecureStore.deleteItemAsync(secureKey(key, field))),
        );
      }
      await AsyncStorage.setItem(key, value);
      return;
    }

    for (const field of SECRET_FIELDS) {
      const token = metadata[field];
      if (typeof token === "string" && token.length > 0) {
        await SecureStore.setItemAsync(secureKey(key, field), token);
      } else {
        await SecureStore.deleteItemAsync(secureKey(key, field));
      }
      delete metadata[field];
    }

    // Write metadata only after all sensitive token fields were secured.
    await AsyncStorage.setItem(key, JSON.stringify(metadata));
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === "web") {
      webPreviewStorage.delete(key);
      return;
    }

    await AsyncStorage.removeItem(key);
    await Promise.all(
      SECRET_FIELDS.map((field) => SecureStore.deleteItemAsync(secureKey(key, field))),
    );
  },
};
