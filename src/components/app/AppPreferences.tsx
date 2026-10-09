"use client";

import { useEffect } from "react";
import {
  setStudentLanguage,
  STUDENT_LANGUAGE_KEY,
  STUDENT_LANGUAGE_EVENT,
} from "@/lib/student-language";

export function AppPreferences() {
  useEffect(() => {
    let active = true;

    const applyStored = () => {
      const storedLanguage = window.localStorage.getItem(STUDENT_LANGUAGE_KEY);
      if (storedLanguage === "ru" || storedLanguage === "en" || storedLanguage === "kk") {
        document.documentElement.lang = storedLanguage;
      }
    };

    window.localStorage.removeItem("shyraq:theme");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.style.colorScheme = "light";

    applyStored();

    const onLanguageChange = () => {
      const value = window.localStorage.getItem(STUDENT_LANGUAGE_KEY);
      if (value === "ru" || value === "en" || value === "kk") document.documentElement.lang = value;
    };

    window.addEventListener(STUDENT_LANGUAGE_EVENT, onLanguageChange);

    fetch("/api/student/settings", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok || !active) return;
        const payload = await response.json();
        const settings = payload?.settings;
        if (!settings || !active) return;

        if (settings.language === "kk" || settings.language === "ru" || settings.language === "en") {
          // Centralize localStorage, document language and cookie updates so every
          // language change uses the same Secure/SameSite cookie policy.
          setStudentLanguage(settings.language);
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
      window.removeEventListener(STUDENT_LANGUAGE_EVENT, onLanguageChange);
    };
  }, []);

  return null;
}
