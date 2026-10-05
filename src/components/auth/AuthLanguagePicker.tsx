"use client";

import { setStudentLanguage, useStudentLanguage, type StudentLanguage } from "@/lib/student-language";

export function AuthLanguagePicker() {
  const { language, t } = useStudentLanguage("kk");
  const options: Array<[StudentLanguage, string]> = [
    ["kk", t("kazakh")],
    ["ru", t("russian")],
    ["en", t("english")],
  ];

  return (
    <div className="flex items-center justify-center gap-1.5" aria-label={t("language")}>
      {options.map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => setStudentLanguage(value)}
          className={[
            "rounded-full border px-2.5 py-1 text-[9px] font-extrabold transition",
            language === value
              ? "border-[#FF8000] bg-[#FFF1E2] text-[#D56600]"
              : "border-[#E7E0D8] bg-white text-[#8B8179] hover:border-[#FFB366]",
          ].join(" ")}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
