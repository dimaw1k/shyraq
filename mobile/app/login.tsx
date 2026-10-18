"use client";

import { useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getApiBaseUrl } from "@/lib/api";
import { supabase } from "@/lib/supabase";

type LoginResponse = {
  ok?: boolean;
  error?: string;
  session?: {
    access_token: string;
    refresh_token: string;
  };
};

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!identifier.trim() || password.length === 0) {
      Alert.alert("Деректерді енгізіңіз", "Телефон немесе email және құпиясөз қажет.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          client: "native",
        }),
      });

      const body = (await response.json().catch(() => null)) as LoginResponse | null;
      if (!response.ok || !body?.session?.access_token || !body.session.refresh_token) {
        throw new Error(body?.error ?? "Жүйеге кіру мүмкін болмады. Қайта көріңіз.");
      }

      const { error } = await supabase.auth.setSession({
        access_token: body.session.access_token,
        refresh_token: body.session.refresh_token,
      });

      if (error) {
        throw new Error("Қауіпсіз сессияны сақтау мүмкін болмады. Қайта кіріңіз.");
      }

      router.replace("/");
    } catch (error) {
      Alert.alert(
        "Кіру қатесі",
        error instanceof Error ? error.message : "Желімен байланыс болмады. Қайта көріңіз.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>SHYR</Text>
            <View style={styles.flame}>
              <View style={styles.flameInner} />
            </View>
            <Text style={styles.brandText}>Q</Text>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>ОҚУ. ӨСУ. НӘТИЖЕ.</Text>
            <Text style={styles.title}>Қайта оралғаныңа қуаныштымыз</Text>
            <Text style={styles.subtitle}>
              Shyraq аккаунтыңа кіріп, өз прогресіңді жалғастыр.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Телефон нөмірі немесе email</Text>
            <TextInput
              value={identifier}
              onChangeText={setIdentifier}
              placeholder="+7 (___) ___ __ __ немесе email"
              placeholderTextColor="#9A9188"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              returnKeyType="next"
              style={styles.input}
              editable={!loading}
              accessibilityLabel="Телефон нөмірі немесе email"
            />

            <Text style={[styles.label, styles.passwordLabel]}>Құпиясөз</Text>
            <View style={styles.passwordRow}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Құпиясөзіңді енгіз"
                placeholderTextColor="#9A9188"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={handleLogin}
                style={styles.passwordInput}
                editable={!loading}
                accessibilityLabel="Құпиясөз"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Құпиясөзді жасыру" : "Құпиясөзді көрсету"}
                onPress={() => setShowPassword((value) => !value)}
                hitSlop={10}
              >
                <Text style={styles.showPassword}>{showPassword ? "Жасыру" : "Көрсету"}</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, loading && styles.disabled]}
              onPress={handleLogin}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Жүйеге кіру</Text>
              )}
            </Pressable>
            <Text style={styles.helper}>
              Қауіпсіз кіру · Деректерің Shyraq аккаунтыңмен синхрондалады
            </Text>
          </View>

          <Text style={styles.footer}>SHYRAQ · ОҚУ ТӘРТІБІН ЖҮЙЕГЕ АЙНАЛДЫР</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#FAF9F7" },
  scrollContent: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 34 },
  brandRow: { alignSelf: "center", flexDirection: "row", alignItems: "center", marginBottom: 48 },
  brandText: { color: "#172235", fontSize: 27, fontWeight: "900", letterSpacing: -1.2 },
  flame: { width: 21, height: 27, borderRadius: 12, backgroundColor: "#FF8000", alignItems: "center", justifyContent: "center", marginHorizontal: 1 },
  flameInner: { width: 8, height: 14, borderRadius: 6, backgroundColor: "#FFF7F1" },
  hero: { marginBottom: 28 },
  eyebrow: { color: "#C25100", fontWeight: "800", fontSize: 11, letterSpacing: 2, marginBottom: 12 },
  title: { color: "#172235", fontSize: 31, fontWeight: "800", lineHeight: 38, letterSpacing: -0.8 },
  subtitle: { color: "#766E67", fontSize: 15, lineHeight: 23, marginTop: 12 },
  card: { borderWidth: 1, borderColor: "#E9E1D8", backgroundColor: "#FFFFFF", borderRadius: 24, padding: 20 },
  label: { color: "#38342F", fontSize: 13, fontWeight: "700", marginBottom: 9 },
  input: { borderWidth: 1, borderColor: "#E3DAD0", backgroundColor: "#FFFEFD", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, color: "#172235", fontSize: 15 },
  passwordLabel: { marginTop: 20 },
  passwordRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E3DAD0", backgroundColor: "#FFFEFD", borderRadius: 14, paddingHorizontal: 14 },
  passwordInput: { flex: 1, paddingVertical: 14, color: "#172235", fontSize: 15 },
  showPassword: { color: "#C25100", fontSize: 12, fontWeight: "800", marginLeft: 10 },
  primaryButton: { marginTop: 24, minHeight: 52, borderRadius: 15, backgroundColor: "#FF8000", alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  pressed: { opacity: 0.86 },
  disabled: { opacity: 0.65 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
  helper: { color: "#8C837B", fontSize: 11, lineHeight: 17, textAlign: "center", marginTop: 15 },
  footer: { color: "#A49A90", fontSize: 9, fontWeight: "800", letterSpacing: 1.4, textAlign: "center", marginTop: 34 },
});
