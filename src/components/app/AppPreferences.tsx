"use client";

import { useEffect } from "react";
import {
  setStudentLanguage,
  STUDENT_LANGUAGE_KEY,
  STUDENT_LANGUAGE_EVENT,
} from "@/lib/student-language";

const THEME_KEY = "shyraq:theme";

function applyTheme(value: string | null) {
  const resolved =
    value === "dark" || value === "light"
      ? value
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";

  document.documentElement.dataset.theme = resolved;
}

export function AppPreferences() {
  useEffect(() => {
    let active = true;

    const applyStored = () => {
      applyTheme(window.localStorage.getItem(THEME_KEY));
      const storedLanguage = window.localStorage.getItem(STUDENT_LANGUAGE_KEY);
      if (storedLanguage === "ru" || storedLanguage === "en" || storedLanguage === "kk") {
        document.documentElement.lang = storedLanguage;
      }
    };

    applyStored();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onThemeChange = () => {
      if (window.localStorage.getItem(THEME_KEY) === "system") applyTheme("system");
    };
    const onLanguageChange = () => {
      const value = window.localStorage.getItem(STUDENT_LANGUAGE_KEY);
      if (value === "ru" || value === "en" || value === "kk") document.documentElement.lang = value;
    };

    media.addEventListener("change", onThemeChange);
    window.addEventListener(STUDENT_LANGUAGE_EVENT, onLanguageChange);

    fetch("/api/student/settings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok || !active) return;
        const payload = await response.json();
        const settings = payload?.settings;
        if (!settings || !active) return;

        if (settings.language === "kk" || settings.language === "ru" || settings.language === "en") {
          window.localStorage.setItem(STUDENT_LANGUAGE_KEY, settings.language);
          document.documentElement.lang = settings.language;
          setStudentLanguage(settings.language);
        }

        if (settings.theme === "light" || settings.theme === "dark" || settings.theme === "system") {
          window.localStorage.setItem(THEME_KEY, settings.theme);
          applyTheme(settings.theme);
        }

        if (settings.reminders) {
          window.localStorage.setItem("shyraq:reminders", JSON.stringify(settings.reminders));
        }

        window.localStorage.setItem(
          "shyraq:notifications-enabled",
          settings.notificationsEnabled ? "1" : "0",
        );
      })
      .catch(() => undefined);

    return () => {
      active = false;
      media.removeEventListener("change", onThemeChange);
      window.removeEventListener(STUDENT_LANGUAGE_EVENT, onLanguageChange);
    };
  }, []);

  return null;
}
