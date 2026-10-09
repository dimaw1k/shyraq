"use client";

import { useEffect, useState } from "react";
import {
  studentTranslations,
  studentText,
  type StudentLanguage,
} from "@/lib/student-translations";

export { studentTranslations, studentText };
export type { StudentLanguage };

export const STUDENT_LANGUAGE_KEY = "shyraq:language";
export const STUDENT_LANGUAGE_EVENT = "shyraq-language-change";

export function setStudentLanguage(language: StudentLanguage) {
  // Keep the cookie value constrained to supported languages before writing it.
  const safeLanguage: StudentLanguage =
    language === "ru" || language === "en" ? language : "kk";

  window.localStorage.setItem(STUDENT_LANGUAGE_KEY, safeLanguage);

  // The preference cookie contains only a language code, not authentication data.
  // Secure is added on HTTPS (including production) without breaking local HTTP development.
  const secureAttribute = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `shyraq-language=${safeLanguage}; Path=/; Max-Age=31536000; SameSite=Lax${secureAttribute}`;

  window.dispatchEvent(
    new CustomEvent(STUDENT_LANGUAGE_EVENT, { detail: safeLanguage }),
  );
  document.documentElement.lang = safeLanguage;
}

export function useStudentLanguage(initialLanguage: StudentLanguage = "kk") {
  const [language, setLanguage] = useState<StudentLanguage>(initialLanguage);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STUDENT_LANGUAGE_KEY);
      if (stored === "kk" || stored === "ru" || stored === "en") {
        setLanguage(stored);
      }
    }, 0);

    const onChange = (event: Event) => {
      const next = (event as CustomEvent<StudentLanguage>).detail;
      if (next === "kk" || next === "ru" || next === "en") setLanguage(next);
    };

    window.addEventListener(STUDENT_LANGUAGE_EVENT, onChange);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(STUDENT_LANGUAGE_EVENT, onChange);
    };
  }, []);

  return {
    language,
    t: (key: string) => studentTranslations[language][key] ?? studentTranslations.kk[key] ?? key,
  };
}
