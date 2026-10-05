"use client";

import { setStudentLanguage, useStudentLanguage, type StudentLanguage } from "@/lib/student-language";

export function AuthLanguagePicker() {
  const { language, t } = useStudentLanguage("kk");
  const options: Array<[StudentLanguage, string]> = [
    ["ru", "RU"],
    ["kk", "KZ"],
    ["en", "ENG"],
  ];

  return (
    <div className="absolute right-5 top-5 z-10 sm:right-6 sm:top-6">
      <label className="sr-only" htmlFor="auth-language">
        {t("language")}
      </label>
      <select
        id="auth-language"
        value={language}
        onChange={(event) => setStudentLanguage(event.target.value as StudentLanguage)}
        className="h-9 w-[84px] appearance-none rounded-[11px] border border-[#E7E0D8] bg-[#FCFBF9] px-3 pr-7 text-[10px] font-extrabold text-[#5F574F] outline-none transition focus:border-[#FF8000] focus:bg-white focus:ring-3 focus:ring-[#FF8000]/10"
      >
        {options.map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
