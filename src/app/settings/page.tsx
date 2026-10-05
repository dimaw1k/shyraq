import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/AppNav";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { StudentSettingsClient, type ReminderSettings, type ThemeMode } from "@/components/student/StudentSettingsClient";
import type { StudentLanguage } from "@/lib/student-language";

const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: true,
  morningMeet: true,
  morningMeetTime: "08:00",
  morningReport: true,
  morningReportTime: "10:00",
  eveningMeet: true,
  eveningMeetTime: "19:00",
  eveningReport: true,
  eveningReportTime: "21:00",
  habits: true,
  habitsTime: "20:30",
};

function cleanReminders(value: unknown): ReminderSettings {
  const source = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const time = (input: unknown, fallback: string) =>
    typeof input === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(input) ? input : fallback;

  return {
    enabled: source.enabled !== false,
    morningMeet: source.morningMeet !== false,
    morningMeetTime: time(source.morningMeetTime, DEFAULT_REMINDERS.morningMeetTime),
    morningReport: source.morningReport !== false,
    morningReportTime: time(source.morningReportTime, DEFAULT_REMINDERS.morningReportTime),
    eveningMeet: source.eveningMeet !== false,
    eveningMeetTime: time(source.eveningMeetTime, DEFAULT_REMINDERS.eveningMeetTime),
    eveningReport: source.eveningReport !== false,
    eveningReportTime: time(source.eveningReportTime, DEFAULT_REMINDERS.eveningReportTime),
    habits: source.habits !== false,
    habitsTime: time(source.habitsTime, DEFAULT_REMINDERS.habitsTime),
  };
}

export default async function SettingsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("full_name,role").eq("id", user.id).maybeSingle(),
    supabase
      .from("student_settings")
      .select("language,theme,reminders,notifications_enabled")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const language: StudentLanguage =
    settings?.language === "ru" || settings?.language === "en" ? settings.language : "kk";
  const theme: ThemeMode =
    settings?.theme === "dark" || settings?.theme === "system" ? settings.theme : "light";

  return (
    <AppShell
      role={profile?.role ?? "STUDENT"}
      userName={profile?.full_name ?? undefined}
      title=""
      hideHeader
    >
      <div className="px-3.5 pb-8 pt-5 sm:px-6 lg:px-8">
        <StudentSettingsClient
          email={user.email ?? ""}
          initial={{
            language,
            theme,
            reminders: cleanReminders(settings?.reminders),
            notificationsEnabled: settings?.notifications_enabled === true,
          }}
        />
      </div>
    </AppShell>
  );
}
