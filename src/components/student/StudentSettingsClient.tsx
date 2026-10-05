"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Check,
  ChevronRight,
  Info,
  Languages,
  LogOut,
  Mail,
  MessageSquareText,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  Timer,
  UserRound,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import {
  setStudentLanguage,
  useStudentLanguage,
  type StudentLanguage,
} from "@/lib/student-language";
import { useRouter } from "next/navigation";

export type ThemeMode = "light" | "dark" | "system";

export type ReminderSettings = {
  enabled: boolean;
  morningMeet: boolean;
  morningMeetTime: string;
  morningReport: boolean;
  morningReportTime: string;
  eveningMeet: boolean;
  eveningMeetTime: string;
  eveningReport: boolean;
  eveningReportTime: string;
  habits: boolean;
  habitsTime: string;
};

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

const REMINDER_ITEMS = [
  ["morningMeet", "morningMeetTime", "morningMeet"],
  ["morningReport", "morningReportTime", "morningReport"],
  ["eveningMeet", "eveningMeetTime", "eveningMeet"],
  ["eveningReport", "eveningReportTime", "eveningReport"],
  ["habits", "habitsTime", "habits"],
] as const;

type InitialSettings = {
  language: StudentLanguage;
  theme: ThemeMode;
  reminders: ReminderSettings;
  notificationsEnabled: boolean;
};

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[20px] border border-[#E7E0D8] bg-white p-4 shadow-[0_8px_24px_rgba(23,34,53,.035)] sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[13px] bg-[#FFF1E2] text-[#FF8000]">
          {icon}
        </span>
        <h2 className="text-[15px] font-extrabold tracking-[-.02em] text-[#172235]">{title}</h2>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Row({
  icon,
  title,
  right,
  onClick,
}: {
  icon?: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="flex min-w-0 items-center gap-3">
        {icon ? <span className="text-[#8E847A]">{icon}</span> : null}
        <span className="truncate text-[12px] font-bold text-[#172235]">{title}</span>
      </span>
      <span className="shrink-0">{right}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#E9E3DC] bg-[#FCFBF9] px-3.5 py-3 text-left transition hover:border-[#FFB366] hover:bg-white"
      >
        {body}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[14px] border border-[#E9E3DC] bg-[#FCFBF9] px-3.5 py-3">
      {body}
    </div>
  );
}

function Toggle({
  checked,
  title,
  onChange,
}: {
  checked: boolean;
  title: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#E9E3DC] bg-[#FCFBF9] px-3.5 py-3 text-left"
    >
      <span className="text-[12px] font-bold text-[#172235]">{title}</span>
      <span className={["relative h-6 w-11 shrink-0 rounded-full transition", checked ? "bg-[#FF8000]" : "bg-[#D4CEC6]"].join(" ")}>
        <span className={["absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-6" : "translate-x-1"].join(" ")} />
      </span>
    </button>
  );
}

function Choice({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-[12px] border px-3 py-2.5 text-[11px] font-extrabold transition",
        active
          ? "border-[#FF8000] bg-[#FFF1E2] text-[#D56600]"
          : "border-[#E7E0D8] bg-[#FCFBF9] text-[#6F665E] hover:border-[#FFB366] hover:bg-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export function StudentSettingsClient({
  email,
  initial,
}: {
  email: string;
  initial: InitialSettings;
}) {
  const router = useRouter();
  const { language, t } = useStudentLanguage();
  const [theme, setTheme] = useState<ThemeMode>(initial.theme);
  const [reminders, setReminders] = useState<ReminderSettings>(initial.reminders);
  const [notificationsEnabled, setNotificationsEnabled] = useState(initial.notificationsEnabled);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );
  const [feedbackCategory, setFeedbackCategory] = useState("TECHNICAL");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const enabledCount = useMemo(
    () =>
      reminders.enabled
        ? [reminders.morningMeet, reminders.morningReport, reminders.eveningMeet, reminders.eveningReport, reminders.habits].filter(Boolean).length
        : 0,
    [reminders],
  );

  useEffect(() => {
    document.documentElement.lang = language;
    window.localStorage.setItem("shyraq:language", language);
  }, [language]);

  useEffect(() => {
    const resolved =
      theme === "system"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : theme;

    document.documentElement.dataset.theme = resolved;
    window.localStorage.setItem("shyraq:theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("shyraq:reminders", JSON.stringify(reminders));
    window.localStorage.setItem("shyraq:notifications-enabled", notificationsEnabled ? "1" : "0");

    const timer = window.setTimeout(async () => {
      setSaving(true);
      try {
        const response = await fetch("/api/student/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            theme,
            reminders,
            notificationsEnabled,
          }),
        });

        if (!response.ok) throw new Error("save");
      } catch {
        // Local values remain available if the network is temporarily unavailable.
      } finally {
        setSaving(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [language, theme, reminders, notificationsEnabled]);

  function updateReminder<K extends keyof ReminderSettings>(key: K, value: ReminderSettings[K]) {
    setReminders((current) => ({ ...current, [key]: value }));
  }

  async function allowNotifications() {
    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    const enabled = permission === "granted";
    setNotificationsEnabled(enabled);

    if (enabled) {
      new Notification("Shyraq", { body: t("notificationsOn"), tag: "shyraq-settings-test" });
    }
  }

  function testNotification() {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    new Notification("Shyraq", {
      body: t("testNotification"),
      tag: "shyraq-test",
    });
  }

  async function logout() {
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.auth.signOut();
    if (!error) router.replace("/login");
  }

  async function sendFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (feedbackMessage.trim().length < 5) return;

    setFeedbackStatus("");
    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: feedbackCategory,
        subject: feedbackCategory === "SUGGESTION" ? "Suggestion" : "Student feedback",
        message: feedbackMessage.trim(),
      }),
    });

    if (!response.ok) return;

    setFeedbackMessage("");
    setFeedbackStatus(t("feedbackSent"));
  }

  const languageOptions: Array<[StudentLanguage, string]> = [
    ["kk", t("kazakh")],
    ["ru", t("russian")],
    ["en", t("english")],
  ];

  return (
    <div className="mx-auto w-full max-w-[760px] space-y-3 pb-6">
      <div className="flex items-end justify-between gap-3 px-1 pb-2">
        <div>
          <p className="text-[9px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">{t("settings")}</p>
          <h1 className="mt-1 text-[24px] font-extrabold tracking-[-.045em] text-[#172235]">{t("settings")}</h1>
        </div>
        <span className="rounded-full bg-[#FFF1E2] px-2.5 py-1 text-[9px] font-extrabold text-[#C86A11]">
          {saving ? "…" : t("saved")}
        </span>
      </div>

      <Panel icon={<Languages size={18} />} title={t("language")}>
        <div className="grid grid-cols-3 gap-2">
          {languageOptions.map(([value, label]) => (
            <Choice
              key={value}
              active={language === value}
              label={label}
              onClick={() => setStudentLanguage(value)}
            />
          ))}
        </div>
      </Panel>

      <Panel icon={<BellRing size={18} />} title={t("reminders")}>
        <div className="space-y-2.5">
          <Toggle
            checked={reminders.enabled}
            onChange={(value) => updateReminder("enabled", value)}
            title={t("reminders") + " · " + enabledCount}
          />

          {REMINDER_ITEMS.map(([enabledKey, timeKey, labelKey]) => (
            <div key={enabledKey} className="grid grid-cols-[1fr_104px] gap-2">
              <Toggle
                checked={Boolean(reminders[enabledKey]) && reminders.enabled}
                onChange={(value) => updateReminder(enabledKey, value)}
                title={t(labelKey)}
              />
              <label className="flex items-center rounded-[14px] border border-[#E9E3DC] bg-[#FCFBF9] px-3">
                <Timer size={14} className="mr-2 shrink-0 text-[#A49A90]" />
                <input
                  type="time"
                  aria-label={t(labelKey)}
                  value={String(reminders[timeKey])}
                  onChange={(event) => updateReminder(timeKey, event.target.value)}
                  className="w-full bg-transparent text-[11px] font-extrabold text-[#172235] outline-none"
                />
              </label>
            </div>
          ))}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={allowNotifications}
              className="flex items-center justify-center gap-2 rounded-[14px] border border-[#E7E0D8] bg-[#FCFBF9] px-4 py-3 text-[11px] font-extrabold text-[#172235]"
            >
              {notificationPermission === "granted" ? <Check size={15} /> : <Bell size={15} />}
              {notificationPermission === "granted" ? t("notificationsOn") : t("allowNotifications")}
            </button>
            <button
              type="button"
              disabled={notificationPermission !== "granted" || !notificationsEnabled}
              onClick={testNotification}
              className="flex items-center justify-center gap-2 rounded-[14px] bg-[#FF8000] px-4 py-3 text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Bell size={15} />
              {t("testNotification")}
            </button>
          </div>
        </div>
      </Panel>

      <Panel icon={<Palette size={18} />} title={t("appearance")}>
        <div className="grid grid-cols-3 gap-2">
          <Choice
            active={theme === "light"}
            label={t("light")}
            onClick={() => setTheme("light")}
          />
          <Choice
            active={theme === "dark"}
            label={t("dark")}
            onClick={() => setTheme("dark")}
          />
          <Choice
            active={theme === "system"}
            label={t("system")}
            onClick={() => setTheme("system")}
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-[#8B8179]">
          {theme === "dark" ? <Moon size={14} /> : <Sun size={14} />}
          {theme === "dark" ? t("dark") : theme === "light" ? t("light") : t("system")}
        </div>
      </Panel>

      <Panel icon={<ShieldCheck size={18} />} title={t("security")}>
        <div className="space-y-2">
          <Link href="/reset-password">
            <Row
              icon={<ShieldCheck size={15} />}
              title={t("changePassword")}
              right={<ChevronRight size={16} className="text-[#9A9189]" />}
            />
          </Link>
          <Row
            icon={<LogOut size={15} />}
            title={t("allDevices")}
            right={<ChevronRight size={16} className="text-[#9A9189]" />}
            onClick={logout}
          />
        </div>
      </Panel>

      <Panel icon={<UserRound size={18} />} title={t("account")}>
        <div className="space-y-2">
          <Row icon={<Mail size={15} />} title={email || "—"} />
          <div className="grid grid-cols-2 gap-2">
            <Link href="/profile">
              <Row title={t("profile")} right={<ChevronRight size={16} className="text-[#9A9189]" />} />
            </Link>
            <Link href="/reset-password">
              <Row title={t("password")} right={<ChevronRight size={16} className="text-[#9A9189]" />} />
            </Link>
          </div>
        </div>
      </Panel>

      <Panel icon={<Info size={18} />} title={t("about")}>
        <div className="grid grid-cols-2 gap-2">
          <Row title={t("appName")} right={<span className="text-[10px] font-bold text-[#8B8179]">Shyraq</span>} />
          <Row title={t("version")} right={<span className="text-[10px] font-bold text-[#8B8179]">0.1.0</span>} />
        </div>
      </Panel>

      <Panel icon={<MessageSquareText size={18} />} title={t("feedback")}>
        <form onSubmit={sendFeedback} className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            <Choice
              active={feedbackCategory === "TECHNICAL"}
              label={t("technical")}
              onClick={() => setFeedbackCategory("TECHNICAL")}
            />
            <Choice
              active={feedbackCategory === "SUGGESTION"}
              label={t("suggestion")}
              onClick={() => setFeedbackCategory("SUGGESTION")}
            />
            <Choice
              active={feedbackCategory === "OTHER"}
              label={t("other")}
              onClick={() => setFeedbackCategory("OTHER")}
            />
          </div>
          <textarea
            required
            minLength={5}
            rows={4}
            value={feedbackMessage}
            onChange={(event) => setFeedbackMessage(event.target.value)}
            placeholder={t("enterMessage")}
            className="w-full resize-none rounded-[14px] border border-[#E7E0D8] bg-[#FCFBF9] px-3.5 py-3 text-[12px] font-medium text-[#172235] outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10"
          />
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-[#FF8000] px-4 py-3 text-[11px] font-extrabold text-white"
            >
              <MessageSquareText size={15} />
              {t("sendFeedback")}
            </button>
            {feedbackStatus ? (
              <span className="rounded-[14px] bg-[#EDF8F1] px-3 py-3 text-[10px] font-extrabold text-[#23845A]">
                {feedbackStatus}
              </span>
            ) : null}
          </div>
        </form>
      </Panel>
    </div>
  );
}
