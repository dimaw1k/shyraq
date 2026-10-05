"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Languages,
  LogOut,
  MessageSquareText,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
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
  className = "",
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={[
        "rounded-[15px] border border-[#E7E0D8] bg-white p-3 shadow-[0_6px_18px_rgba(23,34,53,.028)]",
        className,
      ].join(" ")}
    >
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#FFF1E2] text-[#FF8000]">
          {icon}
        </span>
        <h2 className="text-[13px] font-extrabold tracking-[-.02em] text-[#172235]">
          {title}
        </h2>
      </div>
      <div className="mt-2.5">{children}</div>
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
      <span className="flex min-w-0 items-center gap-2.5">
        {icon ? <span className="shrink-0 text-[#8E847A]">{icon}</span> : null}
        <span className="truncate text-[11px] font-bold text-[#172235]">{title}</span>
      </span>
      <span className="shrink-0">{right}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-[#E9E3DC] bg-[#FCFBF9] px-3 py-2.5 text-left transition hover:border-[#FFB366] hover:bg-white"
      >
        {body}
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[#E9E3DC] bg-[#FCFBF9] px-3 py-2.5">
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
      className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-[#E9E3DC] bg-[#FCFBF9] px-3 py-2.5 text-left"
    >
      <span className="truncate text-[11px] font-bold text-[#172235]">{title}</span>
      <span
        className={[
          "relative h-5 w-10 shrink-0 rounded-full transition",
          checked ? "bg-[#FF8000]" : "bg-[#D4CEC6]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute left-[3px] top-[3px] h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-[21px]" : "translate-x-[3px]",
          ].join(" ")}
        />
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
        "rounded-[11px] border px-2.5 py-2.5 text-[10px] font-extrabold transition",
        active
          ? "border-[#FF8000] bg-[#FFF1E2] text-[#D56600]"
          : "border-[#E7E0D8] bg-[#FCFBF9] text-[#6F665E] hover:border-[#FFB366] hover:bg-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function TimePicker({
  value,
  label,
  onChange,
  onOpenChange,
  open,
}: {
  value: string;
  label: string;
  onChange: (value: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [hourText, minuteText] = value.split(":");
  const hour = Math.min(23, Math.max(0, Number.parseInt(hourText ?? "0", 10) || 0));
  const minute = Math.min(59, Math.max(0, Number.parseInt(minuteText ?? "0", 10) || 0));

  const update = (nextHour: number, nextMinute: number) => {
    onChange(
      String(nextHour).padStart(2, "0") +
        ":" +
        String(nextMinute).padStart(2, "0"),
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        className={[
          "flex h-10 w-full items-center justify-between gap-2 rounded-[11px] border px-2.5 text-left transition",
          open
            ? "border-[#FF9A45] bg-white ring-3 ring-[#FF8000]/10"
            : "border-[#E9E3DC] bg-[#FCFBF9] hover:border-[#FFB366] hover:bg-white",
        ].join(" ")}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Clock3 size={13} className="shrink-0 text-[#9A9189]" />
          <span className="font-mono text-[12px] font-bold tracking-[-.02em] text-[#172235]">
            {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
          </span>
        </span>
        <ChevronDown
          size={13}
          className={[
            "shrink-0 text-[#9A9189] transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[80] w-[188px] rounded-[14px] border border-[#E7E0D8] bg-white p-2 shadow-[0_16px_36px_rgba(23,34,53,.14)]">
          <div className="mb-1.5 flex items-center justify-between px-1">
            <span className="text-[8px] font-extrabold uppercase tracking-[.14em] text-[#A0978F]">
              {label}
            </span>
            <span className="font-mono text-[10px] font-bold text-[#FF8000]">
              {String(hour).padStart(2, "0")}:{String(minute).padStart(2, "0")}
            </span>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
            <div>
              <p className="mb-1 px-1 text-[8px] font-bold text-[#968C83]">HH</p>
              <input
                type="number"
                min={0}
                max={23}
                step={1}
                inputMode="numeric"
                value={hour}
                onChange={(event) => {
                  const next = Math.min(23, Math.max(0, Number(event.target.value) || 0));
                  update(next, minute);
                }}
                className="h-9 w-full rounded-[10px] border border-[#E8E1DA] bg-[#FAF8F5] px-2 text-center font-mono text-[13px] font-bold text-[#172235] outline-none transition focus:border-[#FF8000] focus:bg-white"
              />
            </div>

            <span className="mt-5 text-[15px] font-bold text-[#B0A69D]">:</span>

            <div>
              <p className="mb-1 px-1 text-[8px] font-bold text-[#968C83]">MM</p>
              <input
                type="number"
                min={0}
                max={59}
                step={1}
                inputMode="numeric"
                value={minute}
                onChange={(event) => {
                  const next = Math.min(59, Math.max(0, Number(event.target.value) || 0));
                  update(hour, next);
                }}
                className="h-9 w-full rounded-[10px] border border-[#E8E1DA] bg-[#FAF8F5] px-2 text-center font-mono text-[13px] font-bold text-[#172235] outline-none transition focus:border-[#FF8000] focus:bg-white"
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ReminderEditor({
  label,
  checked,
  time,
  onToggle,
  onTimeChange,
}: {
  label: string;
  checked: boolean;
  time: string;
  onToggle: (value: boolean) => void;
  onTimeChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-[50px] rounded-[12px] border border-[#E9E3DC] bg-[#FCFBF9] px-2">
      <div className="grid h-full grid-cols-[minmax(0,1fr)_38px_96px] items-center gap-2">
        <span className="min-w-0 truncate px-1 text-[10px] font-extrabold text-[#172235]">
          {label}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onToggle(!checked)}
          className={[
            "relative h-5 w-9 shrink-0 rounded-full transition",
            checked ? "bg-[#FF8000]" : "bg-[#D4CEC6]",
          ].join(" ")}
        >
          <span
            className={[
              "absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-[left,right]",
              checked ? "right-[3px]" : "left-[3px]",
            ].join(" ")}
          />
        </button>

        <TimePicker
          value={time}
          label={label}
          open={open}
          onOpenChange={setOpen}
          onChange={onTimeChange}
        />
      </div>
    </div>
  );
}

export function StudentSettingsClient({
  email: _email,
  initial,
}: {
  email: string;
  initial: InitialSettings;
}) {
  const router = useRouter();
  const { language, t } = useStudentLanguage(initial.language);
  const [theme, setTheme] = useState<ThemeMode>(initial.theme);
  const [reminders, setReminders] = useState<ReminderSettings>(initial.reminders);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    initial.notificationsEnabled,
  );
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("default");
  const [feedbackCategory, setFeedbackCategory] = useState("TECHNICAL");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [notificationStatus, setNotificationStatus] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setNotificationPermission(
        typeof Notification === "undefined"
          ? "unsupported"
          : Notification.permission,
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const enabledCount = useMemo(
    () =>
      reminders.enabled
        ? [
            reminders.morningMeet,
            reminders.morningReport,
            reminders.eveningMeet,
            reminders.eveningReport,
            reminders.habits,
          ].filter(Boolean).length
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
    window.localStorage.setItem(
      "shyraq:notifications-enabled",
      notificationsEnabled ? "1" : "0",
    );

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

  function updateReminder<K extends keyof ReminderSettings>(
    key: K,
    value: ReminderSettings[K],
  ) {
    setReminders((current) => ({ ...current, [key]: value }));
  }

  async function allowNotifications() {
    setNotificationStatus("");

    if (typeof Notification === "undefined") {
      setNotificationPermission("unsupported");
      setNotificationsEnabled(false);
      setNotificationStatus(t("notificationUnsupported"));
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission !== "granted") {
        setNotificationsEnabled(false);
        setNotificationStatus(
          permission === "denied"
            ? t("notificationDenied")
            : t("notificationPermissionPending"),
        );
        return;
      }

      setNotificationsEnabled(true);
      setNotificationStatus(t("notificationsOn"));

      new Notification("Shyraq", {
        body: t("notificationWelcome"),
        tag: "shyraq-settings-welcome",
      });
    } catch {
      setNotificationsEnabled(false);
      setNotificationStatus(t("notificationFailed"));
    }
  }

  function testNotification() {
    setNotificationStatus("");

    if (typeof Notification === "undefined") {
      setNotificationStatus(t("notificationUnsupported"));
      return;
    }

    if (Notification.permission !== "granted") {
      setNotificationPermission(Notification.permission);
      setNotificationsEnabled(false);
      setNotificationStatus(t("notificationNeedPermission"));
      return;
    }

    try {
      new Notification("Shyraq", {
        body: t("notificationTestBody"),
        tag: "shyraq-test",
      });
      setNotificationStatus(t("notificationSent"));
    } catch {
      setNotificationStatus(t("notificationFailed"));
    }
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
        subject:
          feedbackCategory === "SUGGESTION"
            ? "Suggestion"
            : "Student feedback",
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
    <div className="mx-auto w-full max-w-[900px] space-y-2.5 pb-5">
      <div className="flex items-end justify-between gap-3 px-1 pb-0.5">
        <div>
          <p className="text-[8px] font-extrabold uppercase tracking-[.18em] text-[#FF8000]">
            {t("settings")}
          </p>
          <h1 className="mt-0.5 text-[20px] font-extrabold tracking-[-.045em] text-[#172235]">
            {t("settings")}
          </h1>
        </div>
        <span className="rounded-full bg-[#FFF1E2] px-2.5 py-1 text-[9px] font-extrabold text-[#C86A11]">
          {saving ? "…" : t("saved")}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Panel icon={<Languages size={17} />} title={t("language")}>
          <div className="grid grid-cols-3 gap-1.5">
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

        <Panel icon={<Palette size={17} />} title={t("appearance")}>
          <div className="grid grid-cols-3 gap-1.5">
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
          <div className="mt-2.5 flex items-center gap-2 text-[9px] font-semibold text-[#8B8179]">
            {theme === "dark" ? <Moon size={13} /> : <Sun size={13} />}
            {theme === "dark"
              ? t("dark")
              : theme === "light"
                ? t("light")
                : t("system")}
          </div>
        </Panel>

        <Panel
          icon={<BellRing size={17} />}
          title={t("reminders")}
          className="md:col-span-2"
        >
          <div className="grid gap-2">
            <div className="flex h-[42px] items-center justify-between rounded-[11px] border border-[#E9E3DC] bg-[#FCFBF9] px-3">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-[10px] font-extrabold text-[#172235]">
                  {t("reminders")}
                </span>
                <span className="rounded-full bg-[#FFF1E2] px-1.5 py-0.5 text-[8px] font-extrabold text-[#C86A11]">
                  {enabledCount}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={reminders.enabled}
                aria-label={t("reminders")}
                onClick={() => updateReminder("enabled", !reminders.enabled)}
                className={[
                  "relative h-5 w-9 shrink-0 rounded-full transition",
                  reminders.enabled ? "bg-[#FF8000]" : "bg-[#D4CEC6]",
                ].join(" ")}
              >
                <span
                  className={[
                    "absolute top-[3px] h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform",
                    reminders.enabled ? "translate-x-[18px]" : "translate-x-[3px]",
                  ].join(" ")}
                />
              </button>
            </div>

            <div className="grid gap-1.5 sm:grid-cols-2">
              {REMINDER_ITEMS.map(([enabledKey, timeKey, labelKey]) => (
                <ReminderEditor
                  key={enabledKey}
                  label={t(labelKey)}
                  checked={Boolean(reminders[enabledKey]) && reminders.enabled}
                  time={String(reminders[timeKey])}
                  onToggle={(value) => updateReminder(enabledKey, value)}
                  onTimeChange={(value) => updateReminder(timeKey, value)}
                />
              ))}
            </div>

            <div className="grid gap-1.5 pt-0.5 sm:grid-cols-2">
              <button
                type="button"
                onClick={allowNotifications}
                disabled={notificationPermission === "unsupported"}
                className="flex items-center justify-center gap-2 rounded-[12px] border border-[#E7E0D8] bg-[#FCFBF9] px-3 py-2.5 text-[10px] font-extrabold text-[#172235] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {notificationPermission === "granted" ? (
                  <Check size={14} />
                ) : (
                  <Bell size={14} />
                )}
                {notificationPermission === "granted"
                  ? t("notificationsOn")
                  : notificationPermission === "denied"
                    ? t("notificationDeniedShort")
                    : t("allowNotifications")}
              </button>

              <button
                type="button"
                disabled={notificationPermission !== "granted"}
                onClick={testNotification}
                className="flex items-center justify-center gap-2 rounded-[12px] bg-[#FF8000] px-3 py-2.5 text-[10px] font-extrabold text-white transition hover:bg-[#E87500] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Bell size={14} />
                {t("testNotification")}
              </button>
              {notificationStatus ? (
                <p className="sm:col-span-2 rounded-[10px] bg-[#FAF7F3] px-3 py-2 text-[9px] font-semibold text-[#6F665E]">
                  {notificationStatus}
                </p>
              ) : null}
            </div>
          </div>
        </Panel>

        <Panel icon={<ShieldCheck size={17} />} title={t("security")}>
          <div className="space-y-1.5">
            <Link href="/reset-password" className="block">
              <Row
                icon={<ShieldCheck size={14} />}
                title={t("changePassword")}
                right={<ChevronRight size={15} className="text-[#9A9189]" />}
              />
            </Link>
            <Row
              icon={<LogOut size={14} />}
              title={t("allDevices")}
              right={<ChevronRight size={15} className="text-[#9A9189]" />}
              onClick={logout}
            />
          </div>
        </Panel>

        <Panel icon={<MessageSquareText size={17} />} title={t("feedback")}>
          <form onSubmit={sendFeedback} className="space-y-1.5">
            <div className="grid grid-cols-3 gap-1.5">
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
              rows={3}
              value={feedbackMessage}
              onChange={(event) => setFeedbackMessage(event.target.value)}
              placeholder={t("enterMessage")}
              className="w-full resize-none rounded-[12px] border border-[#E7E0D8] bg-[#FCFBF9] px-3 py-2.5 text-[11px] font-medium text-[#172235] outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-4 focus:ring-[#FF8000]/10"
            />

            <div className="flex items-center gap-1.5">
              <button
                type="submit"
                className="flex flex-1 items-center justify-center gap-2 rounded-[12px] bg-[#FF8000] px-3 py-2.5 text-[10px] font-extrabold text-white"
              >
                <MessageSquareText size={14} />
                {t("sendFeedback")}
              </button>

              {feedbackStatus ? (
                <span className="rounded-[12px] bg-[#EDF8F1] px-2.5 py-2.5 text-[9px] font-extrabold text-[#23845A]">
                  {feedbackStatus}
                </span>
              ) : null}
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
