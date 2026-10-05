"use client";

import { useEffect } from "react";

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

const STORAGE_KEY = "shyraq:reminders";
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

const REMINDERS: Array<{ key: ReminderKey; label: string }> = [
  { key: "morningMeet", label: "Таңғы Meet уақыты келді." },
  { key: "morningReport", label: "Таңғы есепті тапсыруға уақыт келді." },
  { key: "eveningMeet", label: "Кешкі Meet уақыты келді." },
  { key: "eveningReport", label: "Кешкі есепті тапсыруға уақыт келді." },
  { key: "habits", label: "Бүгінгі әдеттеріңізді белгілеуді ұмытпаңыз." },
];

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
      if (typeof Notification === "undefined" || Notification.permission !== "granted") {
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

      for (const reminder of REMINDERS) {
        const enabled = Boolean(settings[reminder.key]);
        const timeKey = (reminder.key + "Time") as keyof ReminderSettings;
        const time = settings[timeKey];

        if (!enabled || typeof time !== "string" || time !== currentTime) continue;

        const key = firedKey(date, reminder.key, time);
        if (window.localStorage.getItem(key) === "1") continue;

        new Notification("Shyraq", {
          body: reminder.label,
          tag: "shyraq-" + reminder.key,
        });

        window.localStorage.setItem(key, "1");
      }
    }

    check();
    const timer = window.setInterval(check, 30_000);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
