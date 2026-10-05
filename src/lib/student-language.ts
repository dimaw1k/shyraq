"use client";

import { useEffect, useState } from "react";
import {
  studentTranslations,
  studentText,
  type StudentLanguage,
} from "@/lib/student-translations";

export { studentTranslations, studentText };
export type { StudentLanguage };

export function setStudentLanguage(language: StudentLanguage) {
  window.localStorage.setItem(STUDENT_LANGUAGE_KEY, language);
  document.cookie = `shyraq-language=${language}; path=/; max-age=31536000; samesite=lax`;
  window.dispatchEvent(new CustomEvent(STUDENT_LANGUAGE_EVENT, { detail: language }));
  document.documentElement.lang = language;
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
