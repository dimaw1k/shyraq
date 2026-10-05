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
    <div
      className="inline-flex items-center rounded-full border border-[#E7E0D8] bg-white p-0.5 shadow-[0_2px_10px_rgba(23,34,53,.035)]"
      aria-label={t("language")}
    >
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          aria-pressed={language === value}
          onClick={() => setStudentLanguage(value)}
          className={[
            "min-w-[42px] rounded-full px-2.5 py-1.5 text-[9px] font-extrabold tracking-[.02em] transition",
            language === value
              ? "bg-[#FFF1E2] text-[#D56600] shadow-sm"
              : "text-[#8B8179] hover:bg-[#FAF7F3] hover:text-[#172235]",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
