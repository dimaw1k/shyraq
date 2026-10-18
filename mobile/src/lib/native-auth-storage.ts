import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const SECRET_FIELDS = [
  "access_token",
  "refresh_token",
  "provider_token",
  "provider_refresh_token",
] as const;

type SecretField = (typeof SECRET_FIELDS)[number];
type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function secureKey(storageKey: string, field: SecretField) {
  return `${storageKey}::${field}`;
}

/**
 * Supabase stores a complete session JSON document in its auth storage.
 * Keep bearer/refresh tokens in iOS Keychain / Android encrypted storage and
 * keep only non-token session metadata in AsyncStorage.
 *
 * This also migrates any previously stored session JSON by moving token fields
 * into SecureStore before returning the migrated value to the auth client.
 * If SecureStore fails, the error is allowed to propagate; tokens are never
 * silently written back to AsyncStorage as a fallback.
 */
export const nativeAuthStorage = {
  async getItem(key: string): Promise<string | null> {
    const stored = await AsyncStorage.getItem(key);
    if (stored === null) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      // Other Supabase storage values (for example the PKCE verifier) are
      // opaque strings, not session JSON.
      return stored;
    }

    if (!isJsonRecord(parsed)) return stored;

    let changed = false;
    for (const field of SECRET_FIELDS) {
      const current = parsed[field];
      if (typeof current === "string" && current.length > 0) {
        await SecureStore.setItemAsync(secureKey(key, field), current);
        delete parsed[field];
        changed = true;
      } else {
        const secret = await SecureStore.getItemAsync(secureKey(key, field));
        if (secret !== null) parsed[field] = secret;
      }
    }

    if (changed) {
      await AsyncStorage.setItem(key, JSON.stringify(parsed));
    }

    return JSON.stringify(parsed);
  },

  async setItem(key: string, value: string): Promise<void> {
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

    // Store the metadata only after the sensitive fields were secured.
    await AsyncStorage.setItem(key, JSON.stringify(metadata));
  },

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
    await Promise.all(
      SECRET_FIELDS.map((field) => SecureStore.deleteItemAsync(secureKey(key, field))),
    );
  },
};
