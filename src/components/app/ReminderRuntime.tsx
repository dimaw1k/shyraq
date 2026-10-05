"use client";

import { useEffect } from "react";
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

export function ReminderRuntime() {
  useEffect(() => {
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

      for (const key of Object.keys(REMINDER_TEXTS.kk) as ReminderKey[]) {
        const enabled = Boolean(settings[key]);
        const timeKey = (key + "Time") as keyof ReminderSettings;
        const time = settings[timeKey];

        if (!enabled || typeof time !== "string" || time !== currentTime) {
          continue;
        }

        const keyForDate = firedKey(date, key, time);
        if (window.localStorage.getItem(keyForDate) === "1") continue;

        const language = readLanguage();
        const message = studentTranslations[language][key];

        try {
          new Notification("Shyraq", {
            body: message,
            tag: "shyraq-" + key,
          });
          window.localStorage.setItem(keyForDate, "1");
        } catch {
          // Keep the reminder available for a later check if the browser blocks it.
        }
      }
    }

    check();
    const timer = window.setInterval(check, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
