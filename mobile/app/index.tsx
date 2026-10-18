"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getStudentOverview, type StudentOverview } from "@/lib/api";
import { supabase } from "@/lib/supabase";

export default function StudentHomeScreen() {
  const router = useRouter();
  const [overview, setOverview] = useState<StudentOverview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        router.replace("/login");
        return;
      }
      const result = await getStudentOverview();
      setOverview(result);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Деректерді жүктеу мүмкін болмады.";
      setError(message);
      if (/сессия аяқталды|қайта кіріңіз/i.test(message)) router.replace("/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading && !overview) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#FF8000" />
        <Text style={styles.loadingText}>Shyraq жүктелуде...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor="#FF8000" />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>SHYR<Text style={styles.brandAccent}>AQ</Text></Text>
            <Text style={styles.kicker}>ОҚУШЫ КАБИНЕТІ</Text>
          </View>
          <Pressable onPress={signOut} accessibilityRole="button" style={styles.signOutButton}>
            <Text style={styles.signOutText}>Шығу</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Деректер жүктелмеді</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable onPress={() => load()} style={styles.retryButton}>
              <Text style={styles.retryText}>Қайта көру</Text>
            </Pressable>
          </View>
        ) : null}

        {overview ? (
          <>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>БҮГІНГІ ПРОГРЕСС</Text>
              <Text style={styles.greeting}>Сәлем, {overview.profile.full_name?.split(" ")[0] || "оқушы"}!</Text>
              <Text style={styles.heroSubtext}>Кішкентай қадамдар үлкен нәтижеге жеткізеді.</Text>
              <View style={styles.teamPill}>
                <View style={styles.dot} />
                <Text style={styles.teamText}>{overview.team?.name ?? "Команда тағайындалуын күтіп тұр"}</Text>
              </View>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Жалпы ұпай</Text>
                <Text style={styles.statValue}>{overview.score}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Қазіргі streak</Text>
                <Text style={styles.statValue}>{overview.streak} <Text style={styles.statUnit}>күн</Text></Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Ең ұзақ streak</Text>
                <Text style={styles.statValue}>{overview.longestStreak} <Text style={styles.statUnit}>күн</Text></Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statLabel}>Есептер</Text>
                <Text style={styles.statValue}>{overview.reports.length}</Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Сабақ прогресі</Text>
              <Text style={styles.sectionCount}>{overview.videoProgress.length} сабақ</Text>
            </View>
            {overview.videoProgress.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>Әзірге прогресс жоқ</Text>
                <Text style={styles.emptyText}>Сабақтарың ашылғанда, қаралу нәтижесі осында көрінеді.</Text>
              </View>
            ) : (
              overview.videoProgress.map((item) => (
                <View key={item.lesson_id} style={styles.progressCard}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressTitle}>Сабақ</Text>
                    <Text style={styles.progressPercent}>{Math.round(item.watched_percent)}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.max(0, Math.min(100, item.watched_percent))}%` }]} />
                  </View>
                  <Text style={styles.progressFoot}>{item.test_unlocked ? "Тест ашық" : "Тест үшін 85% көру қажет"}</Text>
                </View>
              ))
            )}
            <Text style={styles.disclaimer}>
              Бұл бастапқы мобильді нұсқа. Келесі кезеңде тапсырмалар, есептер және сабақтар толық қосылады.
            </Text>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FAF9F7" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FAF9F7" },
  loadingText: { color: "#766E67", marginTop: 13, fontSize: 14 },
  content: { paddingHorizontal: 20, paddingVertical: 18, paddingBottom: 40 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  brand: { color: "#172235", fontSize: 23, fontWeight: "900", letterSpacing: -1.2 },
  brandAccent: { color: "#FF8000" },
  kicker: { color: "#958A80", fontWeight: "800", fontSize: 9, letterSpacing: 1.5, marginTop: 4 },
  signOutButton: { borderWidth: 1, borderColor: "#E5DCD2", backgroundColor: "#FFFFFF", borderRadius: 12, paddingVertical: 9, paddingHorizontal: 13 },
  signOutText: { color: "#6D655E", fontSize: 12, fontWeight: "800" },
  hero: { backgroundColor: "#172235", borderRadius: 24, padding: 22, marginBottom: 16 },
  heroEyebrow: { color: "#FFB36B", fontSize: 10, fontWeight: "800", letterSpacing: 1.6 },
  greeting: { color: "#FFFFFF", fontSize: 28, fontWeight: "900", letterSpacing: -0.7, marginTop: 12 },
  heroSubtext: { color: "#D0D6DF", fontSize: 13, lineHeight: 20, marginTop: 7 },
  teamPill: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", backgroundColor: "#29374C", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginTop: 17 },
  dot: { width: 6, height: 6, backgroundColor: "#FF8000", borderRadius: 6, marginRight: 8 },
  teamText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 25 },
  statCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EBE3DA", borderRadius: 18, padding: 16, width: "48%", flexGrow: 1, minHeight: 100 },
  statLabel: { color: "#867D75", fontSize: 11, fontWeight: "700" },
  statValue: { color: "#172235", fontSize: 26, fontWeight: "900", marginTop: 12 },
  statUnit: { color: "#8C8278", fontSize: 12, fontWeight: "700" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: "#172235", fontSize: 18, fontWeight: "900" },
  sectionCount: { color: "#8B8178", fontSize: 11, fontWeight: "700" },
  emptyCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EBE3DA", padding: 18, borderRadius: 18 },
  emptyTitle: { color: "#172235", fontSize: 14, fontWeight: "800" },
  emptyText: { color: "#857B73", fontSize: 12, lineHeight: 19, marginTop: 6 },
  progressCard: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#EBE3DA", padding: 16, borderRadius: 18, marginBottom: 10 },
  progressRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressTitle: { color: "#172235", fontSize: 13, fontWeight: "800" },
  progressPercent: { color: "#C25100", fontSize: 13, fontWeight: "900" },
  progressTrack: { height: 7, borderRadius: 8, backgroundColor: "#F0EAE3", marginTop: 12, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 8, backgroundColor: "#FF8000" },
  progressFoot: { color: "#8B8178", fontSize: 11, marginTop: 9 },
  errorBox: { padding: 18, borderRadius: 18, backgroundColor: "#FFF1EE", borderWidth: 1, borderColor: "#F5C7BC", marginBottom: 15 },
  errorTitle: { color: "#7D2B1C", fontSize: 14, fontWeight: "800" },
  errorText: { color: "#8E4435", fontSize: 12, lineHeight: 18, marginTop: 5 },
  retryButton: { backgroundColor: "#C25100", paddingVertical: 10, alignItems: "center", borderRadius: 11, marginTop: 13 },
  retryText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  disclaimer: { color: "#A1978D", fontSize: 10, lineHeight: 16, marginTop: 22, textAlign: "center" },
});
