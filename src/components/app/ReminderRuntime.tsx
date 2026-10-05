"use client";

import { useEffect, useState } from "react";
import { studentTranslations } from "@/lib/student-translations";

type ReminderKey =
  | "morningMeet"
  | "morningReport"
  | "eveningMeet"
  | "eveningReport"
  | "habits";

type ReminderSettings = {
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

type StudentLanguage = "kk" | "ru" | "en";

const STORAGE_KEY = "shyraq:reminders";
const LANGUAGE_KEY = "shyraq:language";
const FIRED_PREFIX = "shyraq:reminder-fired:";

const DEFAULT_SETTINGS: ReminderSettings = {
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

function readLanguage(): StudentLanguage {
  const value = window.localStorage.getItem(LANGUAGE_KEY);
  return value === "ru" || value === "en" ? value : "kk";
}

function readSettings(): ReminderSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function firedKey(date: string, key: ReminderKey, time: string) {
  return FIRED_PREFIX + date + ":" + key + ":" + time;
}

const REMINDER_BODY_KEY: Record<ReminderKey, keyof typeof studentTranslations.kk> = {
  morningMeet: "reminderMorningMeet",
  morningReport: "reminderMorningReport",
  eveningMeet: "reminderEveningMeet",
  eveningReport: "reminderEveningReport",
  habits: "reminderHabits",
};

const REMINDER_TITLE_KEY: Record<ReminderKey, keyof typeof studentTranslations.kk> = {
  morningMeet: "morningMeet",
  morningReport: "morningReport",
  eveningMeet: "eveningMeet",
  eveningReport: "eveningReport",
  habits: "habits",
};

export function ReminderRuntime() {
  const [notice, setNotice] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    let noticeTimer: number | null = null;

    function check() {
      if (
        typeof Notification === "undefined" ||
        Notification.permission !== "granted" ||
        window.localStorage.getItem("shyraq:notifications-enabled") !== "1"
      ) {
        return;
      }

      const settings = readSettings();
      if (!settings.enabled) return;

      const now = new Date();
      const date = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0"),
      ].join("-");
      const currentTime = [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
      ].join(":");

      for (const key of Object.keys(REMINDER_BODY_KEY) as ReminderKey[]) {
        const enabled = Boolean(settings[key]);
        const timeKey = (key + "Time") as keyof ReminderSettings;
        const time = settings[timeKey];

        if (!enabled || typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
          continue;
        }

        const [targetHour, targetMinute] = time.split(":").map(Number);
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const targetMinutes = targetHour * 60 + targetMinute;
        const overdueMinutes = currentMinutes - targetMinutes;

        if (overdueMinutes < 0 || overdueMinutes > 60) {
          continue;
        }

        const keyForDate = firedKey(date, key, time);
        if (window.localStorage.getItem(keyForDate) === "1") continue;

        const language = readLanguage();
        const title = studentTranslations[language][REMINDER_TITLE_KEY[key]];
        const message = studentTranslations[language][REMINDER_BODY_KEY[key]];

        setNotice({ title, body: message });
        if (noticeTimer !== null) window.clearTimeout(noticeTimer);
        noticeTimer = window.setTimeout(() => setNotice(null), 7000);

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification("Shyraq", {
              body: message,
              tag: "shyraq-" + key,
            });
          } catch {
            // In-app notice remains available when browser notifications are blocked.
          }
        }

        window.localStorage.setItem(keyForDate, "1");
      }
    }

    check();
    const timer = window.setInterval(check, 30_000);

    return () => {
      window.clearInterval(timer);
      if (noticeTimer !== null) window.clearTimeout(noticeTimer);
    };
  }, []);

  if (!notice) return null;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[120] w-[min(360px,calc(100vw-24px))]">
      <div className="rounded-[16px] border border-[#E7E0D8] bg-white px-4 py-3 shadow-[0_18px_45px_rgba(23,34,53,.16)]">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[10px] bg-[#FFF1E2] text-[#FF8000]">
            <span className="text-[15px] leading-none">!</span>
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-extrabold text-[#172235]">{notice.title}</p>
            <p className="mt-1 text-[10px] font-semibold leading-4 text-[#6F665E]">{notice.body}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
